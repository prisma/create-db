import { select, isCancel } from "@clack/prompts";
import { randomUUID } from "crypto";

import type { CreateFlagsInput } from "../flags.js";
import type { RegionId } from "../../types.js";
import { getCommandName } from "../../core/database.js";
import { readUserEnvFile } from "../../utils/env-utils.js";
import { detectUserLocation, getRegionClosestToLocation } from "../../utils/geolocation.js";
import {
  sendAnalyticsEvent,
  flushAnalytics,
  ensureOnline,
  fetchRegions,
  validateRegionId,
  createDatabase,
} from "../../core/services.js";
import {
  showIntro,
  showOutro,
  showCancelled,
  createSpinner,
  printDatabaseResult,
  printJson,
  printError,
  printSuccess,
  writeEnvFile,
} from "../output.js";

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
        showCancelled();
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
      printJson(result);
      if (!result.success) {
        process.exit(1);
      }
      return;
    }

    if (!result.success) {
      printError(result.message);
      process.exit(1);
    }

    const writeResult = writeEnvFile(envPath!, result.connectionString, result.claimUrl);
    if (!writeResult.success) {
      printError(`Failed to write environment variables to ${envPath}: ${writeResult.error}`);
      process.exit(1);
    }

    printSuccess(`Wrote DATABASE_URL and CLAIM_URL to ${envPath}`);
    return;
  }

  await ensureOnline();

  showIntro();

  if (input.interactive) {
    const regions = await fetchRegions();

    const selectedRegion = await select({
      message: "Choose a region:",
      options: regions.map((r) => ({ value: r.id, label: r.name || r.id })),
      initialValue:
        regions.find((r) => r.id === region)?.id || regions[0]?.id,
    });

    if (isCancel(selectedRegion)) {
      showCancelled();
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

  const spinner = createSpinner();
  spinner.start(region);

  const result = await createDatabase(region, userAgent, cliRunId);

  if (!result.success) {
    spinner.error(result.message);
    await flushAnalytics();
    process.exit(1);
  }

  spinner.success();
  printDatabaseResult(result);
  showOutro();
  await flushAnalytics();
}
