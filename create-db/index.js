#!/usr/bin/env node

import { select, spinner, intro, outro, log, cancel } from "@clack/prompts";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import terminalLink from "terminal-link";
import chalk from "chalk";

dotenv.config();

const CREATE_DB_WORKER_URL =
  process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io";
const CLAIM_DB_WORKER_URL =
  process.env.CLAIM_DB_WORKER_URL || "https://create-db.prisma.io";

// Track pending analytics promises to ensure they complete before exit
const pendingAnalytics = [];

async function sendAnalyticsToWorker(eventName, properties, cliRunId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  const analyticsPromise = (async () => {
    try {
      const payload = {
        eventName,
        properties: { distinct_id: cliRunId, ...(properties || {}) },
      };
      await fetch(`${CREATE_DB_WORKER_URL}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't block CLI
    } finally {
      clearTimeout(timer);
    }
  })();

  pendingAnalytics.push(analyticsPromise);
  return analyticsPromise;
}

// Wait for all pending analytics with a timeout
async function flushAnalytics(maxWaitMs = 500) {
  if (pendingAnalytics.length === 0) return;

  const timeout = new Promise((resolve) => setTimeout(resolve, maxWaitMs));
  const allAnalytics = Promise.all(pendingAnalytics);

  await Promise.race([allAnalytics, timeout]);
}

async function detectUserLocation() {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: {
        "User-Agent": "create-db-cli/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch location data: ${response.status}`);
    }

    const data = await response.json();
    return {
      country: data.country_code,
      continent: data.continent_code,
      city: data.city,
      region: data.region,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    return null;
  }
}

const REGION_COORDINATES = {
  "ap-southeast-1": { lat: 1.3521, lng: 103.8198 }, // Singapore
  "ap-northeast-1": { lat: 35.6762, lng: 139.6503 }, // Tokyo
  "eu-central-1": { lat: 50.1109, lng: 8.6821 }, // Frankfurt
  "eu-west-3": { lat: 48.8566, lng: 2.3522 }, // Paris
  "us-east-1": { lat: 38.9072, lng: -77.0369 }, // N. Virginia
  "us-west-1": { lat: 37.7749, lng: -122.4194 }, // N. California
};

export function getRegionClosestToLocation(userLocation) {
  if (!userLocation) return null;

  const userLat = parseFloat(userLocation.latitude);
  const userLng = parseFloat(userLocation.longitude);

  let closestRegion = null;
  let minDistance = Infinity;

  for (const [region, coordinates] of Object.entries(REGION_COORDINATES)) {
    // Simple distance calculation using Haversine formula
    const latDiff = ((userLat - coordinates.lat) * Math.PI) / 180;
    const lngDiff = ((userLng - coordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((coordinates.lat * Math.PI) / 180) *
        Math.sin(lngDiff / 2) *
        Math.sin(lngDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // Earth radius in km

    if (distance < minDistance) {
      minDistance = distance;
      closestRegion = region;
    }
  }

  return closestRegion;
}

async function listRegions() {
  try {
    const regions = await getRegions();
    console.log(chalk.cyan.bold("\n🌐 Available Prisma Postgres regions:\n"));
    regions.forEach((r) =>
      console.log(`- ${chalk.green(r.id)}, ${r.name || r.id}`)
    );
    console.log("");
  } catch (e) {
    handleError("Failed to fetch regions.", e);
  }
}

async function isOffline() {
  const healthUrl = `${CREATE_DB_WORKER_URL}/health`;

  try {
    const res = await fetch(healthUrl, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Prisma Postgres API returned a status of ${res.status}`);
    }
    return false; // Online
  } catch {
    console.error(
      chalk.red.bold("\n✖ Error: Cannot reach Prisma Postgres API server.\n")
    );
    console.error(
      chalk.gray(
        `Check your internet connection or visit ${chalk.green("https://www.prisma-status.com/\n")}`
      )
    );
    await flushAnalytics();
    process.exit(1);
  }
}

export function getCommandName() {
  const executable = process.argv[1] || "create-db";
  if (executable.includes("create-pg")) return "create-pg";
  if (executable.includes("create-postgres")) return "create-postgres";
  return "create-db";
}

const CLI_NAME = getCommandName();

function readUserEnvFile() {
  const userCwd = process.cwd();
  const envPath = path.join(userCwd, ".env");

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        envVars[key.trim()] = value.trim();
      }
    }
  });

  return envVars;
}

async function showHelp() {
  let regionExamples = "us-east-1, eu-west-1";
  try {
    const regions = await getRegions();
    if (regions && regions.length > 0) {
      regionExamples = regions.map((r) => r.id).join(", ");
    }
  } catch {}

  console.log(`
${chalk.cyan.bold("Prisma Postgres Create DB")}

Usage:
  ${chalk.green(`npx ${CLI_NAME} [options]`)}

Options:
  ${chalk.yellow(`--region <region>, -r <region>`)}  Specify the region (e.g., ${regionExamples})
  ${chalk.yellow("--interactive, -i")}               Run in interactive mode to select a region and create the database
  ${chalk.yellow("--json, -j")}                      Output machine-readable JSON and exit
  ${chalk.yellow("--list-regions")}                  List available regions and exit
  ${chalk.yellow("--help, -h")}                      Show this help message
  ${chalk.yellow("--env, -e")}                       Prints DATABASE_URL to the terminal. ${chalk.gray(`To write to .env, use --env >> .env`)}

Examples:
  ${chalk.gray(`npx ${CLI_NAME} --region us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} -r us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} --interactive`)}
  ${chalk.gray(`npx ${CLI_NAME} -i`)}
  ${chalk.gray(`npx ${CLI_NAME} --json --region us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} --env --region us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} --env >> .env`)}
`);
  await flushAnalytics();
  process.exit(0);
}

async function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};

  const allowedFlags = [
    "region",
    "help",
    "list-regions",
    "interactive",
    "json",
    "env",
  ];
  const shorthandMap = {
    r: "region",
    i: "interactive",
    h: "help",
    j: "json",
    e: "env",
  };

  const exitWithError = (message) => {
    console.error(chalk.red.bold("\n✖ " + message));
    console.error(chalk.gray("\nUse --help or -h to see available options.\n"));
    process.exit(1);
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const flag = arg.slice(2);
      if (flag === "help") await showHelp();
      if (!allowedFlags.includes(flag))
        exitWithError(`Invalid flag: --${flag}`);
      if (flag === "region") {
        const region = args[i + 1];
        if (!region || region.startsWith("-"))
          exitWithError("Missing value for --region flag.");
        flags.region = region;
        i++;
      } else {
        flags[flag] = true;
      }
      continue;
    }

    if (arg.startsWith("-")) {
      const short = arg.slice(1);

      if (shorthandMap[short]) {
        const mappedFlag = shorthandMap[short];
        if (mappedFlag === "help") showHelp();
        if (mappedFlag === "region") {
          const region = args[i + 1];
          if (!region || region.startsWith("-"))
            exitWithError("Missing value for -r flag.");
          flags.region = region;
          i++;
        } else {
          flags[mappedFlag] = true;
        }
        continue;
      }

      for (const letter of short.split("")) {
        const mappedFlag = shorthandMap[letter];
        if (!mappedFlag) exitWithError(`Invalid flag: -${letter}`);
        if (mappedFlag === "help") {
          await showHelp();
          return;
        }
        if (mappedFlag === "region") {
          const region = args[i + 1];
          if (!region || region.startsWith("-"))
            exitWithError("Missing value for -r flag.");
          flags.region = region;
          i++;
        } else {
          flags[mappedFlag] = true;
        }
      }
      continue;
    }

    exitWithError(`Invalid argument: ${arg}`);
  }

  return { flags };
}

function validateFlagCombinations(flags) {
  const conflictingFlags = [
    ["env", "json"],
    ["list-regions", "env"],
    ["list-regions", "json"],
    ["list-regions", "interactive"],
    ["list-regions", "region"],
    ["interactive", "env"],
    ["interactive", "json"],
  ];

  for (const [flag1, flag2] of conflictingFlags) {
    if (flags[flag1] && flags[flag2]) {
      console.error(
        chalk.red.bold(
          `\n✖ Error: Cannot use --${flag1} and --${flag2} together.\n`
        )
      );
      console.error(chalk.gray("Use --help or -h to see available options.\n"));
      process.exit(1);
    }
  }
}

export async function getRegions(returnJson = false) {
  const url = `${CREATE_DB_WORKER_URL}/regions`;
  const res = await fetch(url);

  if (!res.ok) {
    if (returnJson) {
      throw new Error(
        `Failed to fetch regions. Status: ${res.status} ${res.statusText}`
      );
    }
    handleError(
      `Failed to fetch regions. Status: ${res.status} ${res.statusText}`
    );
  }

  try {
    const data = await res.json();
    const regions = Array.isArray(data) ? data : data.data;
    return regions.filter((region) => region.status === "available");
  } catch (e) {
    if (returnJson) {
      throw new Error("Failed to parse JSON from /regions endpoint.");
    }
    handleError("Failed to parse JSON from /regions endpoint.", e);
  }
}

export async function validateRegion(region, returnJson = false) {
  const regions = await getRegions(returnJson);
  const regionIds = regions.map((r) => r.id);

  if (!regionIds.includes(region)) {
    if (returnJson) {
      throw new Error(
        `Invalid region: ${region}. Available regions: ${regionIds.join(", ")}`
      );
    }
    handleError(
      `Invalid region: ${chalk.yellow(region)}.\nAvailable regions: ${chalk.green(
        regionIds.join(", ")
      )}`
    );
  }

  return region;
}

function handleError(message, extra = "") {
  console.error(
    "\n" +
      chalk.red.bold("✖ An error occurred!") +
      "\n\n" +
      chalk.white("Message: ") +
      chalk.yellow(message) +
      (extra
        ? "\n" + chalk.white("Available regions: ") + chalk.green(extra)
        : "") +
      "\n"
  );
  process.exit(1);
}

async function promptForRegion(defaultRegion, userAgent, cliRunId) {
  let regions;
  try {
    regions = await getRegions();
  } catch (e) {
    handleError("Failed to fetch regions.", e);
  }

  if (!regions || regions.length === 0) {
    handleError("No regions available to select.");
  }

  const region = await select({
    message: "Choose a region:",
    options: regions.map((r) => ({ value: r.id, label: r.id })),
    initialValue:
      regions.find((r) => r.id === defaultRegion)?.id || regions[0]?.id,
  });

  if (region === null) {
    cancel(chalk.red("Operation cancelled."));
    await flushAnalytics();
    process.exit(0);
  }

  void sendAnalyticsToWorker(
    "create_db:region_selected",
    {
      command: CLI_NAME,
      region: region,
      "selection-method": "interactive",
      "user-agent": userAgent,
    },
    cliRunId
  );

  return region;
}

async function createDatabase(
  name,
  region,
  userAgent,
  cliRunId,
  silent = false
) {
  let s;
  if (!silent) {
    s = spinner();
    s.start("Creating your database...");
  }

  const resp = await fetch(`${CREATE_DB_WORKER_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      region,
      name,
      utm_source: CLI_NAME,
      userAgent,
    }),
  });

  if (resp.status === 429) {
    if (silent) {
      return {
        error: "rate_limit_exceeded",
        message:
          "We're experiencing a high volume of requests. Please try again later.",
        status: 429,
      };
    }

    if (s) {
      s.stop(
        "We're experiencing a high volume of requests. Please try again later."
      );
    }

    void sendAnalyticsToWorker(
      "create_db:database_creation_failed",
      {
        command: CLI_NAME,
        region: region,
        "error-type": "rate_limit",
        "status-code": 429,
        "user-agent": userAgent,
      },
      cliRunId
    );

    await flushAnalytics();
    process.exit(1);
  }

  let result;
  let raw;
  try {
    raw = await resp.text();
    result = JSON.parse(raw);
  } catch (e) {
    if (silent) {
      return {
        error: "invalid_json",
        message: "Unexpected response from create service.",
        raw,
        status: resp.status,
      };
    }
    if (s) {
      s.stop("Unexpected response from create service.");
    }

    void sendAnalyticsToWorker(
      "create_db:database_creation_failed",
      {
        command: CLI_NAME,
        region,
        "error-type": "invalid_json",
        "status-code": resp.status,
        "user-agent": userAgent,
      },
      cliRunId
    );

    await flushAnalytics();
    process.exit(1);
  }

  const database = result.data ? result.data.database : result.databases?.[0];
  const projectId = result.data ? result.data.id : result.id;

  const directConnDetails = result.data
    ? database?.apiKeys?.[0]?.directConnection
    : result.databases?.[0]?.apiKeys?.[0]?.ppgDirectConnection;
  const directUser = directConnDetails?.user
    ? encodeURIComponent(directConnDetails.user)
    : "";
  const directPass = directConnDetails?.pass
    ? encodeURIComponent(directConnDetails.pass)
    : "";
  const directHost = directConnDetails?.host;
  const directPort = directConnDetails?.port
    ? `:${directConnDetails.port}`
    : "";
  const directDbName = directConnDetails?.database || "postgres";
  const directConn =
    directConnDetails && directHost
      ? `postgresql://${directUser}:${directPass}@${directHost}${directPort}/${directDbName}?sslmode=require`
      : null;

  const claimUrl = `${CLAIM_DB_WORKER_URL}/claim?projectID=${projectId}&utm_source=${userAgent || CLI_NAME}&utm_medium=cli`;
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (silent && !result.error) {
    const jsonResponse = {
      connectionString: directConn,
      claimUrl: claimUrl,
      deletionDate: expiryDate.toISOString(),
      region: database?.region?.id || region,
      name: database?.name,
      projectId: projectId,
    };

    if (userAgent) {
      jsonResponse.userAgent = userAgent;
    }

    return jsonResponse;
  }

  if (result.error) {
    if (silent) {
      return {
        error: "api_error",
        message: result.error.message || "Unknown error",
        details: result.error,
        status: result.error.status ?? resp.status,
      };
    }

    if (s) {
      s.stop(
        `Error creating database: ${result.error.message || "Unknown error"}`
      );
    }

    void sendAnalyticsToWorker(
      "create_db:database_creation_failed",
      {
        command: CLI_NAME,
        region: region,
        "error-type": "api_error",
        "error-message": result.error.message,
        "user-agent": userAgent,
      },
      cliRunId
    );

    await flushAnalytics();
    process.exit(1);
  }

  if (s) {
    s.stop("Database created successfully!");
  }

  const expiryFormatted = expiryDate.toLocaleString();

  log.message("");
  log.info(chalk.bold("Database Connection"));
  log.message("");

  // Direct connection (only output this one)
  if (directConn) {
    log.message(chalk.cyan("  Connection String:"));
    log.message("  " + chalk.yellow(directConn));
    log.message("");
  } else {
    log.warning(chalk.yellow("  Connection details are not available."));
    log.message("");
  }


  // Claim database section
  const clickableUrl = terminalLink(claimUrl, claimUrl, { fallback: false });
  log.success(chalk.bold("Claim Your Database"));
  log.message(chalk.cyan("  Keep your database for free:"));
  log.message("  " + chalk.yellow(clickableUrl));
  log.message(
    chalk.italic(
      chalk.gray(
        `  Database will be deleted on ${expiryFormatted} if not claimed.`
      )
    )
  );

  void sendAnalyticsToWorker(
    "create_db:database_created",
    {
      command: CLI_NAME,
      region,
      utm_source: CLI_NAME,
    },
    cliRunId
  );
}

export async function main() {
  try {
    // Generate unique ID for this CLI run
    const cliRunId = randomUUID();

    const rawArgs = process.argv.slice(2);

    const { flags } = await parseArgs();

    validateFlagCombinations(flags);

    let userAgent;
    const userEnvVars = readUserEnvFile();
    if (userEnvVars.PRISMA_ACTOR_NAME && userEnvVars.PRISMA_ACTOR_PROJECT) {
      userAgent = `${userEnvVars.PRISMA_ACTOR_NAME}/${userEnvVars.PRISMA_ACTOR_PROJECT}`;
    }

    void sendAnalyticsToWorker(
      "create_db:cli_command_ran",
      {
        command: CLI_NAME,
        "full-command": `${CLI_NAME} ${rawArgs.join(" ")}`.trim(),
        "has-region-flag":
          rawArgs.includes("--region") || rawArgs.includes("-r"),
        "has-interactive-flag":
          rawArgs.includes("--interactive") || rawArgs.includes("-i"),
        "has-help-flag": rawArgs.includes("--help") || rawArgs.includes("-h"),
        "has-list-regions-flag": rawArgs.includes("--list-regions"),
        "has-json-flag": rawArgs.includes("--json") || rawArgs.includes("-j"),
        "has-env-flag": rawArgs.includes("--env") || rawArgs.includes("-e"),
        "has-user-agent-from-env": !!userAgent,
        "node-version": process.version,
        platform: process.platform,
        arch: process.arch,
        "user-agent": userAgent,
      },
      cliRunId
    );

    if (!flags.help && !flags.json) {
      await isOffline();
    }

    let name = new Date().toISOString();
    let region = flags.region || "us-east-1";
    if (!flags.region || !flags.interactive) {
      const userLocation = await detectUserLocation();
      region = getRegionClosestToLocation(userLocation) || region;
    }
    let chooseRegionPrompt = false;

    if (flags.help) {
      return;
    }

    if (flags["list-regions"]) {
      await listRegions();
      await flushAnalytics();
      process.exit(0);
    }

    if (flags.region) {
      region = flags.region;

      void sendAnalyticsToWorker(
        "create_db:region_selected",
        {
          command: CLI_NAME,
          region: region,
          "selection-method": "flag",
          "user-agent": userAgent,
        },
        cliRunId
      );
    }

    if (flags.interactive) {
      chooseRegionPrompt = true;
    }

    if (flags.json) {
      try {
        if (chooseRegionPrompt) {
          region = await promptForRegion(region, userAgent, cliRunId);
        } else {
          await validateRegion(region, true);
        }
        const result = await createDatabase(
          name,
          region,
          userAgent,
          cliRunId,
          true
        );
        console.log(JSON.stringify(result, null, 2));
        await flushAnalytics();
        process.exit(0);
      } catch (e) {
        console.log(
          JSON.stringify(
            { error: "cli_error", message: e?.message || String(e) },
            null,
            2
          )
        );
        await flushAnalytics();
        process.exit(1);
      }
    }

    if (flags.env) {
      try {
        if (chooseRegionPrompt) {
          region = await promptForRegion(region, userAgent, cliRunId);
        } else {
          await validateRegion(region, true);
        }
        const result = await createDatabase(
          name,
          region,
          userAgent,
          cliRunId,
          true
        );
        if (result.error) {
          console.error(result.message || "Unknown error");
          await flushAnalytics();
          process.exit(1);
        }
        console.log(`DATABASE_URL="${result.connectionString}"`);
        console.error("\n# Claim your database at: " + result.claimUrl);
        await flushAnalytics();
        process.exit(0);
      } catch (e) {
        console.error(e?.message || String(e));
        await flushAnalytics();
        process.exit(1);
      }
    }

    intro(chalk.cyan.bold("🚀 Creating a Prisma Postgres database"));
    log.message(
      chalk.white(`Provisioning a temporary database in ${region}...`)
    );
    log.message(
      chalk.gray(
        `It will be automatically deleted in 24 hours, but you can claim it.`
      )
    );
    if (chooseRegionPrompt) {
      region = await promptForRegion(region, userAgent, cliRunId);
    }

    region = await validateRegion(region);

    await createDatabase(name, region, userAgent, cliRunId);

    outro("");
    await flushAnalytics();
  } catch (error) {
    console.error("Error:", error.message);
    await flushAnalytics();
    process.exit(1);
  }
}

// Run main() if this file is being executed directly
const isDirectExecution =
  import.meta.url.endsWith("/index.js") ||
  process.argv[1] === import.meta.url.replace("file://", "") ||
  process.argv[1].includes("create-db") ||
  process.argv[1].includes("create-pg") ||
  process.argv[1].includes("create-postgres");

if (isDirectExecution && !process.env.__CREATE_DB_EXECUTING) {
  process.env.__CREATE_DB_EXECUTING = "true";
  main().catch(console.error);
}

// if (import.meta.url.endsWith('/index.js') || process.argv[1] === import.meta.url.replace('file://', '')) {
//   main().catch(console.error);
// }
