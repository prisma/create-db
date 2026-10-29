export interface Env {
  CLAIM_DB_RATE_LIMITER: RateLimit;
  INTEGRATION_TOKEN: string;
  CLIENT_SECRET: string;
  CLIENT_ID: string;
  CREATE_DB_DATASET: AnalyticsEngineDataset;
  POSTHOG_API_KEY?: string;
  POSTHOG_PROXY_HOST?: string;
}

export function getEnv(): Env {
  // In Cloudflare Workers (production), use globalThis
  const workerEnv = globalThis as unknown as Partial<Env>;
  if (typeof globalThis !== "undefined" && workerEnv.CLIENT_ID) {
    return {
      CLAIM_DB_RATE_LIMITER: workerEnv.CLAIM_DB_RATE_LIMITER!,
      INTEGRATION_TOKEN: workerEnv.INTEGRATION_TOKEN!,
      CLIENT_SECRET: workerEnv.CLIENT_SECRET!,
      CLIENT_ID: workerEnv.CLIENT_ID,
      CREATE_DB_DATASET: workerEnv.CREATE_DB_DATASET!,
      POSTHOG_API_KEY: workerEnv.POSTHOG_API_KEY,
      POSTHOG_PROXY_HOST: workerEnv.POSTHOG_PROXY_HOST,
    };
  }

  // In development, use process.env with fallback for rate limiter
  return {
    // No-op rate limiter for development
    CLAIM_DB_RATE_LIMITER: { limit: async () => ({ success: true }) },
    INTEGRATION_TOKEN: process.env.INTEGRATION_TOKEN!,
    CLIENT_SECRET: process.env.CLIENT_SECRET!,
    CLIENT_ID: process.env.CLIENT_ID!,
    // No-op analytics for development
    CREATE_DB_DATASET: { writeDataPoint: () => {} },
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_PROXY_HOST: process.env.POSTHOG_PROXY_HOST,
  };
}
