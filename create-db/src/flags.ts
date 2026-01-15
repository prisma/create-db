import { z } from "zod";
import { RegionSchema } from "./types.js";

export const CreateFlags = z.object({
  region: RegionSchema.optional()
    .describe("AWS region for the database")
    .meta({ alias: "r" }),
  interactive: z
    .boolean()
    .optional()
    .default(false)
    .describe("Run in interactive mode to select a region")
    .meta({ alias: "i" }),
  json: z
    .boolean()
    .optional()
    .default(false)
    .describe("Output machine-readable JSON")
    .meta({ alias: "j" }),
  env: z
    .string()
    .optional()
    .describe("Write DATABASE_URL and CLAIM_URL to the specified .env file")
    .meta({ alias: "e" }),
  userAgent: z
    .string()
    .optional()
    .describe("Custom user agent string (e.g. 'test/test')")
    .meta({ alias: "u" }),
});

export type CreateFlagsInput = z.infer<typeof CreateFlags>;
