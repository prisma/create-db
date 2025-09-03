import { getEnv } from "./env";
import { TokenData } from "./auth-utils";

export async function transferProject(
  projectID: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const env = getEnv();

  const requestBody = JSON.stringify({
    recipientAccessToken: accessToken,
  });

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
    return { success: true };
  } else {
    const responseText = await transferResponse.text();
    return {
      success: false,
      error: responseText,
      status: transferResponse.status,
    };
  }
}
