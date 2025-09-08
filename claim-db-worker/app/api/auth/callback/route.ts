import { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { exchangeCodeForToken, validateProject } from "@/lib/auth-utils";
import {
  redirectToError,
  redirectToSuccess,
  getBaseUrl,
} from "@/lib/response-utils";
import { transferProject } from "@/lib/project-transfer";

async function sendServerAnalyticsEvent(
  event: string,
  properties: Record<string, any>,
  request: NextRequest
) {
  const env = getEnv();

  if (!env.POSTHOG_API_KEY || !env.POSTHOG_API_HOST) {
    return;
  }

  try {
    await fetch(`${env.POSTHOG_API_HOST}/e`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        api_key: env.POSTHOG_API_KEY,
        event,
        properties: {
          ...properties,
          $current_url: request.url,
          $user_agent: request.headers.get("user-agent"),
        },
        distinct_id: "server-claim",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to send server analytics event:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const projectID = searchParams.get("projectID");

    // Rate limiting
    const rateLimitResult = await env.CLAIM_DB_RATE_LIMITER.limit({
      key: request.url,
    });
    if (!rateLimitResult.success) {
      return redirectToError(
        request,
        "Rate Limited",
        "We're experiencing high demand. Please try again later."
      );
    }

    // Validate required parameters
    if (!state) {
      return redirectToError(
        request,
        "Missing State Parameter",
        "Please try again.",
        "The state parameter is required for security purposes."
      );
    }
    if (!projectID) {
      return redirectToError(
        request,
        "Missing Project ID",
        "Please ensure you are accessing this page with a valid project ID.",
        "The project ID parameter is required to claim your database."
      );
    }

    // Exchange authorization code for access token
    const baseUrl = getBaseUrl(request);
    const redirectUri = new URL("/api/auth/callback", baseUrl);
    redirectUri.searchParams.set("projectID", projectID);

    let tokenData;
    try {
      tokenData = await exchangeCodeForToken(code!, redirectUri.toString());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await sendServerAnalyticsEvent(
        "create_db:claim_failed",
        {
          "project-id": projectID,
          error: errorMessage,
        },
        request
      );
      return redirectToError(
        request,
        "Authentication Failed",
        "Failed to authenticate with Prisma. Please try again.",
        errorMessage
      );
    }

    // Validate project exists
    try {
      await validateProject(projectID);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await sendServerAnalyticsEvent(
        "create_db:claim_failed",
        {
          "project-id": projectID,
          error: errorMessage,
        },
        request
      );
      return redirectToError(
        request,
        "Project Not Found",
        "The project you're trying to claim doesn't exist or you don't have access to it.",
        errorMessage
      );
    }

    // Transfer the project
    const transferResult = await transferProject(
      projectID,
      tokenData.access_token
    );

    if (transferResult.success) {
      await sendServerAnalyticsEvent(
        "create_db:claim_successful",
        {
          "project-id": projectID,
        },
        request
      );
      return redirectToSuccess(request, projectID);
    } else {
      await sendServerAnalyticsEvent(
        "create_db:claim_failed",
        {
          "project-id": projectID,
          error: transferResult.error!,
        },
        request
      );
      return redirectToError(
        request,
        "Transfer Failed",
        "Failed to transfer the project. Please try again.",
        `Status: ${transferResult.status}\nResponse: ${transferResult.error}`
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    return redirectToError(
      request,
      "Unexpected Error",
      "An unexpected error occurred. Please try again.",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
