import {
  intro,
  outro,
  cancel,
  select,
  spinner,
  log,
  isCancel,
} from "@clack/prompts";
import { createRouterClient, os } from "@orpc/server";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import pc from "picocolors";
import terminalLink from "terminal-link";
import { createCli } from "trpc-cli";
import { z } from "zod";

import {
  type Region,
  type CreateDatabaseResult,
  type DatabaseResult,
  type ProgrammaticCreateOptions,
  type RegionId,
  RegionSchema,
} from "./types.js";
import { sendAnalytics, flushAnalytics } from "./analytics.js";
import { createDatabaseCore, getCommandName } from "./database.js";
import { readUserEnvFile } from "./env-utils.js";
import {
  detectUserLocation,
  getRegionClosestToLocation,
} from "./geolocation.js";
import { checkOnline, getRegions, validateRegion } from "./regions.js";

export type {
  Region,
  RegionId,
  CreateDatabaseResult,
  DatabaseResult,
  DatabaseError,
  ProgrammaticCreateOptions,
} from "./types.js";

export { isDatabaseError, isDatabaseSuccess, RegionSchema } from "./types.js";

dotenv.config({
  quiet: true,
});

const CREATE_DB_WORKER_URL =
  process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io";
const CLAIM_DB_WORKER_URL =
  process.env.CLAIM_DB_WORKER_URL || "https://create-db.prisma.io";

// Wrapper functions that include worker URLs
const sendAnalyticsWithUrl = (
  eventName: string,
  properties: Record<string, unknown>,
  cliRunId: string
) => sendAnalytics(eventName, properties, cliRunId, CREATE_DB_WORKER_URL);

const checkOnlineWithUrl = async () => {
  try {
    await checkOnline(CREATE_DB_WORKER_URL);
  } catch {
    await flushAnalytics();
    process.exit(1);
  }
};

const getRegionsWithUrl = () => getRegions(CREATE_DB_WORKER_URL);

const validateRegionWithUrl = (region: string) =>
  validateRegion(region, CREATE_DB_WORKER_URL);

const createDatabaseCoreWithUrl = (
  region: string,
  userAgent?: string,
  cliRunId?: string,
  source?: "programmatic" | "cli"
) =>
  createDatabaseCore(
    region,
    CREATE_DB_WORKER_URL,
    CLAIM_DB_WORKER_URL,
    userAgent,
    cliRunId,
    source
  );

const router = os.router({
  create: os
    .meta({
      description: "Create a new Prisma Postgres database",
      default: true,
    })
    .input(
      z.object({
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
          .describe(
            "Write DATABASE_URL and CLAIM_URL to the specified .env file"
          )
          .meta({ alias: "e" }),
        userAgent: z
          .string()
          .optional()
          .describe("Custom user agent string (e.g. 'test/test')")
          .meta({ alias: "u" }),
      })
    )
    .handler(async ({ input }) => {
      const cliRunId = randomUUID();
      const CLI_NAME = getCommandName();

      let userAgent: string | undefined = input.userAgent;
      if (!userAgent) {
        const userEnvVars = readUserEnvFile();
        if (userEnvVars.PRISMA_ACTOR_NAME && userEnvVars.PRISMA_ACTOR_PROJECT) {
          userAgent = `${userEnvVars.PRISMA_ACTOR_NAME}/${userEnvVars.PRISMA_ACTOR_PROJECT}`;
        }
      }

      void sendAnalyticsWithUrl(
        "create_db:cli_command_ran",
        {
          command: CLI_NAME,
          "has-region-flag": !!input.region,
          "has-interactive-flag": input.interactive,
          "has-json-flag": input.json,
          "has-env-flag": !!input.env,
          "user-agent": userAgent || undefined,
          "node-version": process.version,
          platform: process.platform,
          arch: process.arch,
        },
        cliRunId
      );

      let region: RegionId = input.region ?? "us-east-1";

      if (!input.region) {
        const userLocation = await detectUserLocation();
        region = getRegionClosestToLocation(userLocation) ?? region;
      }

      const envPath = input.env;
      const envEnabled =
        typeof envPath === "string" && envPath.trim().length > 0;

      if (input.json || envEnabled) {
        if (input.interactive) {
          await checkOnlineWithUrl();
          const regions = await getRegionsWithUrl();

          const selectedRegion = await select({
            message: "Choose a region:",
            options: regions.map((r) => ({
              value: r.id,
              label: r.name || r.id,
            })),
            initialValue:
              regions.find((r) => r.id === region)?.id || regions[0]?.id,
          });

          if (isCancel(selectedRegion)) {
            cancel(pc.red("Operation cancelled."));
            await flushAnalytics();
            process.exit(0);
          }

          region = selectedRegion as RegionId;
          void sendAnalyticsWithUrl(
            "create_db:region_selected",
            { region, "selection-method": "interactive" },
            cliRunId
          );
        } else if (input.region) {
          await validateRegionWithUrl(region);
          void sendAnalyticsWithUrl(
            "create_db:region_selected",
            { region, "selection-method": "flag" },
            cliRunId
          );
        }

        await checkOnlineWithUrl();
        const result = await createDatabaseCoreWithUrl(
          region,
          userAgent,
          cliRunId
        );
        await flushAnalytics();

        if (input.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (!result.success) {
          console.error(result.message);
          process.exit(1);
        }

        try {
          const targetEnvPath = envPath!;
          const lines = [
            `DATABASE_URL="${result.connectionString ?? ""}"`,
            `CLAIM_URL="${result.claimUrl}"`,
            "",
          ];

          let prefix = "";
          if (fs.existsSync(targetEnvPath)) {
            const existing = fs.readFileSync(targetEnvPath, "utf8");
            if (existing.length > 0 && !existing.endsWith("\n")) {
              prefix = "\n";
            }
          }

          fs.appendFileSync(targetEnvPath, prefix + lines.join("\n"), {
            encoding: "utf8",
          });

          console.log(
            pc.green(`Wrote DATABASE_URL and CLAIM_URL to ${targetEnvPath}`)
          );
        } catch (err) {
          console.error(
            pc.red(
              `Failed to write environment variables to ${envPath}: ${
                err instanceof Error ? err.message : String(err)
              }`
            )
          );
          process.exit(1);
        }

        return;
      }

      await checkOnlineWithUrl();

      intro(pc.bold(pc.cyan("🚀 Creating a Prisma Postgres database")));

      if (input.interactive) {
        const regions = await getRegionsWithUrl();

        const selectedRegion = await select({
          message: "Choose a region:",
          options: regions.map((r) => ({ value: r.id, label: r.name || r.id })),
          initialValue:
            regions.find((r) => r.id === region)?.id || regions[0]?.id,
        });

        if (isCancel(selectedRegion)) {
          cancel(pc.red("Operation cancelled."));
          await flushAnalytics();
          process.exit(0);
        }

        region = selectedRegion as RegionId;
        void sendAnalyticsWithUrl(
          "create_db:region_selected",
          { region, "selection-method": "interactive" },
          cliRunId
        );
      } else if (input.region) {
        await validateRegionWithUrl(region);
        void sendAnalyticsWithUrl(
          "create_db:region_selected",
          { region, "selection-method": "flag" },
          cliRunId
        );
      }

      const s = spinner();
      s.start(`Creating database in ${pc.cyan(region)}...`);

      const result = await createDatabaseCoreWithUrl(
        region,
        userAgent,
        cliRunId
      );

      if (!result.success) {
        s.stop(pc.red(`Error: ${result.message}`));
        await flushAnalytics();
        process.exit(1);
      }

      s.stop(pc.green("Database created successfully!"));

      const expiryFormatted = new Date(result.deletionDate).toLocaleString();
      const clickableUrl = terminalLink(result.claimUrl, result.claimUrl, {
        fallback: false,
      });

      log.message("");
      log.info(pc.bold("Database Connection"));
      log.message("");

      if (result.connectionString) {
        log.message(pc.cyan("  Connection String:"));
        log.message("  " + pc.yellow(result.connectionString));
        log.message("");
      } else {
        log.warning(pc.yellow("  Connection details are not available."));
        log.message("");
      }

      log.success(pc.bold("Claim Your Database"));
      log.message(pc.cyan("  Keep your database for free:"));
      log.message("  " + pc.yellow(clickableUrl));
      log.message(
        pc.italic(
          pc.dim(
            `  Database will be deleted on ${expiryFormatted} if not claimed.`
          )
        )
      );

      outro(pc.dim("Done!"));
      await flushAnalytics();
    }),

  regions: os
    .meta({ description: "List available Prisma Postgres regions" })
    .handler(async (): Promise<void> => {
      const regions = await getRegionsWithUrl();

      log.message("");
      log.info(pc.bold(pc.cyan("Available Prisma Postgres regions:")));
      log.message("");
      for (const r of regions) {
        log.message(`  ${pc.green(r.id)} - ${r.name || r.id}`);
      }
      log.message("");
    }),
});

export function createDbCli() {
  return createCli({
    router,
    name: getCommandName(),
    version: "1.1.0",
    description: "Instantly create a temporary Prisma Postgres database",
  });
}

const caller = createRouterClient(router, { context: {} });

/**
 * Create a new Prisma Postgres database programmatically.
 *
 * @param options - Options for creating the database
 * @param options.region - The AWS region for the database (optional)
 * @param options.userAgent - Custom user agent string (optional)
 * @returns A promise that resolves to either a {@link DatabaseResult} or {@link DatabaseError}
 *
 * @example
 * ```typescript
 * import { create } from "create-db";
 *
 * const result = await create({ region: "us-east-1" });
 *
 * if (result.success) {
 *   console.log(`Connection string: ${result.connectionString}`);
 *   console.log(`Claim URL: ${result.claimUrl}`);
 * } else {
 *   console.error(`Error: ${result.message}`);
 * }
 * ```
 */
export async function create(
  options?: ProgrammaticCreateOptions
): Promise<CreateDatabaseResult> {
  return createDatabaseCoreWithUrl(
    options?.region || "us-east-1",
    options?.userAgent,
    undefined,
    "programmatic"
  );
}

/**
 * List available Prisma Postgres regions programmatically.
 *
 * @example
 * ```typescript
 * import { regions } from "create-db";
 *
 * const availableRegions = await regions();
 * console.log(availableRegions);
 * ```
 */
export async function regions(): Promise<Region[]> {
  return getRegionsWithUrl();
}
