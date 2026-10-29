const API_URL = "https://create-db-schema-api-routes.vercel.app/api/schema";
// const API_URL = "http://localhost:4141/api/schema";

/** An error carrying the API's own explanation, such as the line a schema error is on. */
const responseError = async (action: string, response: Response) => {
  const text = await response.text();
  let details = `${response.status} ${response.statusText}`;
  try {
    const body = JSON.parse(text) as { error?: string; details?: string };
    details = body.details ?? body.error ?? details;
  } catch {
    if (text) details = text;
  }
  return new Error(`${action} failed: ${details}`);
};

export const formatSchema = async (schema: string): Promise<string> => {
  const response = await fetch(
    `${API_URL}/format`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Format failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const { formattedSchema } = (await response.json()) as {
    formattedSchema: string;
  };
  return formattedSchema;
};

export const pushSchema = async (
  schema: string,
  connectionString: string
): Promise<{
  message?: string;
  details?: string;
  requiresForceReset?: boolean;
  dataLoss?: string[];
}> => {
  const response = await fetch(
    `${API_URL}/push`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connection-String": connectionString,
      },
      body: JSON.stringify({ schema }),
    }
  );

  if (!response.ok) {
    throw await responseError("Push", response);
  }

  return (await response.json()) as {
    message?: string;
    details?: string;
    requiresForceReset?: boolean;
    dataLoss?: string[];
  };
};

export const pullSchema = async (
  connectionString: string
): Promise<{
  schema?: string;
  details?: string;
  isEmpty?: boolean;
  message?: string;
}> => {
  const response = await fetch(
    `${API_URL}/pull`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connection-String": connectionString,
      },
    }
  );

  if (!response.ok) {
    throw await responseError("Pull", response);
  }

  return (await response.json()) as {
    schema?: string;
    details?: string;
    isEmpty?: boolean;
    message?: string;
  };
};

export const forcePushSchema = async (
  schema: string,
  connectionString: string
): Promise<void> => {
  const response = await fetch(
      `${API_URL}/push-force`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connection-String": connectionString,
      },
      body: JSON.stringify({ schema }),
    }
  );

  if (!response.ok) {
    throw await responseError("Push", response);
  }
};
