import { getEnv } from "./env";

export async function transferProject(
  projectID: string,
  accessToken: string
): Promise<{
  success: boolean;
  error?: string;
  status?: number;
  transferResponse: unknown;
}> {
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
    const responseText = await transferResponse.text();
    let responseData = null;

    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.log("Transfer response (not JSON):", responseText);
        responseData = { rawResponse: responseText };
      }
    }

    return { success: true, transferResponse: responseData };
  } else {
    const responseText = await transferResponse.text();
    return {
      success: false,
      error: responseText,
      status: transferResponse.status,
      transferResponse: null,
    };
  }
}
