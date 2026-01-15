import {
  intro,
  outro,
  cancel,
  select,
  spinner,
  log,
  isCancel,
} from "@clack/prompts";
import { randomUUID } from "crypto";
import fs from "fs";
import pc from "picocolors";
import terminalLink from "terminal-link";

import type { CreateFlagsInput } from "../flags.js";
import type { RegionId } from "../types.js";
import { getCommandName } from "../database.js";
import { readUserEnvFile } from "../env-utils.js";
import { detectUserLocation, getRegionClosestToLocation } from "../geolocation.js";
import {
  sendAnalyticsEvent,
  flushAnalytics,
  ensureOnline,
  fetchRegions,
  validateRegionId,
  createDatabase,
} from "../services.js";

export async function handleCreate(input: CreateFlagsInput): Promise<void> {
  const cliRunId = randomUUID();
  const CLI_NAME = getCommandName();

  let userAgent: string | undefined = input.userAgent;
  if (!userAgent) {
    const userEnvVars = readUserEnvFile();
    if (userEnvVars.PRISMA_ACTOR_NAME && userEnvVars.PRISMA_ACTOR_PROJECT) {
      userAgent = `${userEnvVars.PRISMA_ACTOR_NAME}/${userEnvVars.PRISMA_ACTOR_PROJECT}`;
    }
  }

  void sendAnalyticsEvent(
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
      await ensureOnline();
      const regions = await fetchRegions();

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
      void sendAnalyticsEvent(
        "create_db:region_selected",
        { region, "selection-method": "interactive" },
        cliRunId
      );
    } else if (input.region) {
      await validateRegionId(region);
      void sendAnalyticsEvent(
        "create_db:region_selected",
        { region, "selection-method": "flag" },
        cliRunId
      );
    }

    await ensureOnline();
    const result = await createDatabase(region, userAgent, cliRunId);
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

  await ensureOnline();

  intro(pc.bold(pc.cyan("🚀 Creating a Prisma Postgres database")));

  if (input.interactive) {
    const regions = await fetchRegions();

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
    void sendAnalyticsEvent(
      "create_db:region_selected",
      { region, "selection-method": "interactive" },
      cliRunId
    );
  } else if (input.region) {
    await validateRegionId(region);
    void sendAnalyticsEvent(
      "create_db:region_selected",
      { region, "selection-method": "flag" },
      cliRunId
    );
  }

  const s = spinner();
  s.start(`Creating database in ${pc.cyan(region)}...`);

  const result = await createDatabase(region, userAgent, cliRunId);

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
}
