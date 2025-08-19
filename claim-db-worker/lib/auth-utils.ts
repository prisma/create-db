import { getEnv } from "./env";

export interface TokenData {
  access_token: string;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenData> {
  const env = getEnv();

  const tokenResponse = await fetch("https://auth.prisma.io/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(
      `Token exchange failed - Status: ${tokenResponse.status}, Response: ${text}`
    );
  }

  return (await tokenResponse.json()) as TokenData;
}

export async function validateProject(projectID: string): Promise<any> {
  const env = getEnv();

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
    throw new Error(
      `Project check failed - Status: ${projectCheckResponse.status}, Response: ${projectCheckText}`
    );
  }

  return await projectCheckResponse.json();
}
