import { z } from "zod";
import { RegionSchema } from "../types.js";

/**
 * Zod schema for CLI flags used by the `create` command.
 */
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
  ttl: z
    .preprocess(
      (value) => (value === true ? "" : value),
      z.string()
    )
    .optional()
    .describe("Auto-delete after (30m, 1h-24h)")
    .meta({ alias: "t" }),
  copy: z
    .boolean()
    .optional()
    .default(false)
    .describe("Copy the connection string to your clipboard")
    .meta({ alias: "c" }),
  quiet: z
    .boolean()
    .optional()
    .default(false)
    .describe("Only output the connection string")
    .meta({ alias: "q" }),
  open: z
    .boolean()
    .optional()
    .default(false)
    .describe("Open the claim URL in your browser")
    .meta({ alias: "o" }),
  userAgent: z
    .string()
    .optional()
    .describe("Custom user agent string (e.g. 'test/test')")
    .meta({ alias: "u", hidden: true }),
});

/** Inferred type from CreateFlags schema. */
export type CreateFlagsInput = z.infer<typeof CreateFlags>;

/**
 * Zod schema for CLI flags used by the `regions` command.
 */
export const RegionsFlags = z.object({
  json: z
    .boolean()
    .optional()
    .default(false)
    .describe("Output machine-readable JSON")
    .meta({ alias: "j" }),
});

/** Inferred type from RegionsFlags schema. */
export type RegionsFlagsInput = z.infer<typeof RegionsFlags>;

// GitHub issue to suppress the Alias in the help text: https://github.com/mmkal/trpc-cli/issues/154
