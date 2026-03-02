import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { exchangeCodeForToken, validateProject } from "@/lib/auth-utils";
import { sendAnalyticsEvent } from "@/lib/analytics";
import {
  redirectToError,
  redirectToSuccess,
  getBaseUrl,
} from "@/lib/response-utils";
import { transferProject } from "@/lib/project-transfer";
import { buildRateLimitKey } from "@/lib/server/ratelimit";

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const url = new URL(request.url);
    const { searchParams } = url;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const projectID = searchParams.get("projectID");

    const key = buildRateLimitKey(request);

    // --- Simple rate limiting ---
    const { success } = await env.CLAIM_DB_RATE_LIMITER.limit({ key });
    if (!success) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Rate limit exceeded. Please try again later.",
          path: url.pathname,
        },
        { status: 429 }
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
      await sendAnalyticsEvent(
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

    // Validate project exists and get project data
    try {
      await validateProject(projectID);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await sendAnalyticsEvent(
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
      // Fetch project details with user's token to get workspace ID
      const projectDetailsRes = await fetch(
        `https://api.prisma.io/v1/projects/${projectID}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const projectDetails = (await projectDetailsRes.json()) as {
        data?: { workspace?: { id?: string } };
      };
      const workspaceId = (projectDetails.data?.workspace?.id ?? "").replace(
        /^wksp_/,
        ""
      );

      // Fetch databases to get database ID
      const databasesRes = await fetch(
        `https://api.prisma.io/v1/projects/${projectID}/databases`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const databases = (await databasesRes.json()) as {
        data?: Array<{ id?: string }>;
      };
      const databaseId = (databases.data?.[0]?.id ?? "").replace(/^db_/, "");

      await sendAnalyticsEvent(
        "create_db:claim_successful",
        {
          "project-id": projectID,
          "workspace-id": workspaceId,
          "database-id": databaseId,
        },
        request
      );

      const cleanProjectId = projectID.replace(/^proj_/, "");
      return redirectToSuccess(
        request,
        cleanProjectId,
        workspaceId,
        databaseId
      );
    } else {
      await sendAnalyticsEvent(
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
