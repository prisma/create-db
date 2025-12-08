import { NextRequest, NextResponse } from "next/server";

export function getBaseUrl(request: NextRequest): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function redirectToError(
  request: NextRequest,
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
  return NextResponse.redirect(errorUrl);
}

export function redirectToSuccess(
  request: NextRequest,
  projectID: string,
  workspaceId: string,
  databaseId: string
): Response {
  const params = new URLSearchParams({
    projectID: projectID,
    workspaceId: workspaceId,
    databaseId: databaseId,
  });

  const baseUrl = getBaseUrl(request);
  const successUrl = `${baseUrl}/success?${params.toString()}`;
  return NextResponse.redirect(successUrl);
}
