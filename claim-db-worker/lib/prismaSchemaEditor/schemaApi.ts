export const formatSchema = async (schema: string): Promise<string> => {
  const response = await fetch(
    "https://create-db-schema-api-routes.vercel.app/api/schema/format",
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
}> => {
  const response = await fetch(
    "https://create-db-schema-api-routes.vercel.app/api/schema/push",
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
    const errorText = await response.text();
    throw new Error(
      `Push failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return (await response.json()) as {
    message?: string;
    details?: string;
    requiresForceReset?: boolean;
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
    "https://create-db-schema-api-routes.vercel.app/api/schema/pull",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connection-String": connectionString,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Pull failed: ${response.status} ${response.statusText} - ${errorText}`
    );
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
    "https://create-db-schema-api-routes.vercel.app/api/schema/push-force",
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
    const errorText = await response.text();
    throw new Error(
      `Force reset failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
};
