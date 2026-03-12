import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (
    !request.nextUrl.pathname.startsWith("/web") ||
    request.nextUrl.pathname.startsWith("/web/create-new")
  ) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => c.split("="))
  );

  const projectId = cookies["temp_db_info"]
    ? JSON.parse(decodeURIComponent(cookies["temp_db_info"])).projectId
    : null;

  if (!projectId) {
    console.log("No projectID found in cookies, skipping database check");
    return NextResponse.next();
  }

  console.log(`Checking database status for project: ${projectId}`);

  try {
    console.log(`Checking database status for project: ${projectId}`);
    const response = await fetch(
      `${request.nextUrl.origin}/api/check-db-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      }
    );

    const responseText = await response.text();
    console.log("Raw middleware response:", responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error("Failed to parse middleware response as JSON:", e);
      data = { success: false, error: "Invalid response from server" };
    }

    console.log(
      "Database status check response:",
      JSON.stringify(data, null, 2)
    );

    console.log("Response status:", response.status);
    if (data.error === true) {
      console.log(
        `Database check failed for project ${projectId}. Status: ${response.status}`
      );
      const url = request.nextUrl.clone();
      url.pathname = "/db-unavailable";
      return NextResponse.redirect(url);
    }

    console.log(`Database check passed for project ${projectId}`);
  } catch (error) {
    console.error("Error checking database status:", error);
    console.log("Proceeding to page despite check error");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/web/:path*", "/web"],
};
