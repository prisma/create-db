export interface Env {
  CLAIM_DB_RATE_LIMITER: any;
  INTEGRATION_TOKEN: string;
  CLIENT_SECRET: string;
  CLIENT_ID: string;
  CREATE_DB_DATASET: any;
  POSTHOG_API_KEY: string;
  POSTHOG_API_HOST: string;
}

export function getEnv(): Env {
  // In Cloudflare Workers (production), use globalThis
  if (typeof globalThis !== "undefined" && (globalThis as any).CLIENT_ID) {
    return {
      CLAIM_DB_RATE_LIMITER: (globalThis as any).CLAIM_DB_RATE_LIMITER,
      INTEGRATION_TOKEN: (globalThis as any).INTEGRATION_TOKEN,
      CLIENT_SECRET: (globalThis as any).CLIENT_SECRET,
      CLIENT_ID: (globalThis as any).CLIENT_ID,
      CREATE_DB_DATASET: (globalThis as any).CREATE_DB_DATASET,
      POSTHOG_API_KEY: (globalThis as any).POSTHOG_API_KEY,
      POSTHOG_API_HOST: (globalThis as any).POSTHOG_API_HOST,
    };
  }

  // In development, use process.env with fallback for rate limiter
  return {
    CLAIM_DB_RATE_LIMITER: (process.env.CLAIM_DB_RATE_LIMITER as any) || {
      limit: async () => ({ success: true }), // No-op rate limiter for development
    },
    INTEGRATION_TOKEN: process.env.INTEGRATION_TOKEN!,
    CLIENT_SECRET: process.env.CLIENT_SECRET!,
    CLIENT_ID: process.env.CLIENT_ID!,
    CREATE_DB_DATASET: (process.env.CREATE_DB_DATASET as any) || {
      writeDataPoint: async () => {}, // No-op analytics for development
    },
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY!,
    POSTHOG_API_HOST: process.env.POSTHOG_API_HOST!,
  };
}
