import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

function getBaseUrl(request: NextRequest): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: NextRequest) {
  function redirectToError(
    title: string,
    message: string,
    details?: string
  ): Response {
    const params = new URLSearchParams({
      title: title,
      message: message,
    });
    if (details) {
      params.set("details", details);
    }

    const baseUrl = getBaseUrl(request);
    const errorUrl = `${baseUrl}/error?${params.toString()}`;
    console.log("Redirecting to error:", errorUrl);
    return NextResponse.redirect(errorUrl);
  }

  function redirectToSuccess(projectID: string): Response {
    const params = new URLSearchParams({
      projectID: projectID,
    });

    const baseUrl = getBaseUrl(request);
    const successUrl = `${baseUrl}/success?${params.toString()}`;
    return NextResponse.redirect(successUrl);
  }

  try {
    const env = getEnv();
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const projectID = searchParams.get("projectID");

    const rateLimitResult = await env.CLAIM_DB_RATE_LIMITER.limit({
      key: request.url,
    });
    if (!rateLimitResult.success) {
      return redirectToError(
        "Rate Limited",
        "We're experiencing high demand. Please try again later.",
        undefined
      );
    }

    async function sendPosthogEvent(
      event: string,
      properties: Record<string, any>
    ) {
      const POSTHOG_API_KEY = env.POSTHOG_API_KEY;
      const POSTHOG_PROXY_HOST = env.POSTHOG_API_HOST;

      // Skip analytics if PostHog is not configured
      if (!POSTHOG_API_KEY || !POSTHOG_PROXY_HOST) {
        console.log("PostHog not configured, skipping analytics event:", event);
        return;
      }

      try {
        await fetch(`${POSTHOG_PROXY_HOST}/e`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${POSTHOG_API_KEY}`,
          },
          body: JSON.stringify({
            api_key: POSTHOG_API_KEY,
            event,
            properties,
            distinct_id: "web-claim",
          }),
        });
      } catch (error) {
        console.error("Failed to send PostHog event:", error);
      }
    }

    if (!state) {
      return redirectToError(
        "Missing State Parameter",
        "Please try again.",
        "The state parameter is required for security purposes."
      );
    }
    if (!projectID) {
      return redirectToError(
        "Missing Project ID",
        "Please ensure you are accessing this page with a valid project ID.",
        "The project ID parameter is required to claim your database."
      );
    }

    const baseUrl = getBaseUrl(request);
    const redirectUri = new URL("/api/auth/callback", baseUrl);
    redirectUri.searchParams.set("projectID", projectID!);

    const tokenResponse = await fetch("https://auth.prisma.io/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: redirectUri.toString(),
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      console.error(
        `Token exchange failed - Status: ${tokenResponse.status}, Response: ${text}`
      );
      await sendPosthogEvent("create_db:claim_failed", {
        "project-id": projectID,
        status: tokenResponse.status,
        error: text,
      });

      return redirectToError(
        "Authentication Failed",
        "Failed to authenticate with Prisma. Please try again.",
        `Status: ${tokenResponse.status}\nResponse: ${text}`
      );
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };

    console.error(
      `Transfer request - ProjectID: ${projectID}, HasIntegrationToken: ${!!env.INTEGRATION_TOKEN}, IntegrationTokenLength: ${env.INTEGRATION_TOKEN?.length}, HasAccessToken: ${!!tokenData.access_token}, AccessTokenLength: ${tokenData.access_token?.length}`
    );

    // First, let's check if the project exists and get its details
    const projectCheckResponse = await fetch(
      `https://api.prisma.io/v1/projects/${projectID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
        },
      }
    );

    if (!projectCheckResponse.ok) {
      const projectCheckText = await projectCheckResponse.text();
      console.error(
        `Project check failed - Status: ${projectCheckResponse.status}, Response: ${projectCheckText}`
      );
      return redirectToError(
        "Project Not Found",
        "The project you're trying to claim doesn't exist or you don't have access to it.",
        `Status: ${projectCheckResponse.status}\nResponse: ${projectCheckText}`
      );
    }

    const projectDetails = await projectCheckResponse.json();
    console.error(`Project details: ${JSON.stringify(projectDetails)}`);

    const requestBody = JSON.stringify({
      recipientAccessToken: tokenData.access_token,
    });
    console.error(`Transfer request body: ${requestBody}`);
    console.error(
      `Transfer URL: https://api.prisma.io/v1/projects/${projectID}/transfer`
    );

    const transferResponse = await fetch(
      `https://api.prisma.io/v1/projects/${projectID}/transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
        },
        body: requestBody,
      }
    );

    if (transferResponse.ok) {
      try {
        env.CREATE_DB_DATASET.writeDataPoint({
          blobs: ["database_claimed"],
          indexes: ["claim_db"],
        });
      } catch (error) {
        console.error("Failed to write analytics data point:", error);
      }

      await sendPosthogEvent("create_db:claim_successful", {
        "project-id": projectID,
      });
      return redirectToSuccess(projectID);
    } else {
      const responseText = await transferResponse.text();
      const responseHeaders = Object.fromEntries(
        transferResponse.headers.entries()
      );
      console.error(
        `Transfer failed - Status: ${transferResponse.status}, Headers: ${JSON.stringify(responseHeaders)}, Response: ${responseText}`
      );
      await sendPosthogEvent("create_db:claim_failed", {
        "project-id": projectID,
        status: transferResponse.status,
        error: responseText,
      });
      return redirectToError(
        "Transfer Failed",
        "Failed to transfer the project. Please try again.",
        `Status: ${transferResponse.status}\nResponse: ${responseText}`
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    return redirectToError(
      "Unexpected Error",
      "An unexpected error occurred. Please try again.",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
