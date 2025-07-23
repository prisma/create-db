#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config();

import {
  select,
  spinner,
  intro,
  outro,
  log,
  cancel,
} from "@clack/prompts";
import chalk from "chalk";
import terminalLink from "terminal-link";
import { analytics } from "./analytics.js";

const CREATE_DB_WORKER_URL =
  process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io";
const CLAIM_DB_WORKER_URL =
  process.env.CLAIM_DB_WORKER_URL || "https://create-db.prisma.io";

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
    process.exit(1);
  }
}

function getCommandName() {
  const executable = process.argv[1] || "create-db";
  if (executable.includes("create-pg")) return "create-pg";
  if (executable.includes("create-postgres")) return "create-postgres";
  return "create-db";
}

const CLI_NAME = getCommandName();

async function showHelp() {
  let regionExamples = "us-east-1, eu-west-1";
  try {
    const regions = await getRegions();
    if (regions && regions.length > 0) {
      regionExamples = regions.map((r) => r.id).join(", ");
    }
  } catch {
    // Fallback to default examples if fetching fails
  }

  console.log(`
${chalk.cyan.bold("Prisma Postgres Create DB")}

Usage:
  ${chalk.green(`npx ${CLI_NAME} [options]`)}

Options:
  ${chalk.yellow(`--region <region>, -r <region>`)}  Specify the region (e.g., ${regionExamples})
  ${chalk.yellow("--interactive, -i")}               Run in interactive mode to select a region and create the database
  ${chalk.yellow("--help, -h")}                      Show this help message

Examples:
  ${chalk.gray(`npx ${CLI_NAME} --region us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} -r us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} --interactive`)}
  ${chalk.gray(`npx ${CLI_NAME} -i`)}
`);
  process.exit(0);
}

// Parse command line arguments into flags and positional arguments
async function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};

  const allowedFlags = ["region", "help", "list-regions", "interactive"];
  const shorthandMap = {
    r: "region",
    i: "interactive",
    h: "help",
  };

  const exitWithError = (message) => {
    console.error(chalk.red.bold("\n✖ " + message));
    console.error(chalk.gray("\nUse --help or -h to see available options.\n"));
    process.exit(1);
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle long flags (--region, --help, etc.)
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

    // Handle short and multi-letter shorthand flags
    if (arg.startsWith("-")) {
      const short = arg.slice(1);

      // Check if it's a multi-letter shorthand like -cs or -lr
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

      // Fall back to single-letter flags like -r -l
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

/**
 * Fetch available regions from the API.
 */
export async function getRegions() {
  const url = `${CREATE_DB_WORKER_URL}/regions`;
  const res = await fetch(url);

  if (!res.ok) {
    handleError(
      `Failed to fetch regions. Status: ${res.status} ${res.statusText}`
    );
  }

  try {
    const data = await res.json();
    const regions = Array.isArray(data) ? data : data.data;
    return regions.filter((region) => region.status === "available");
  } catch (e) {
    handleError("Failed to parse JSON from /regions endpoint.", e);
  }
}

/**
 * Validate the provided region against the available list.
 */
export async function validateRegion(region) {
  const regions = await getRegions();
  const regionIds = regions.map((r) => r.id);

  if (!regionIds.includes(region)) {
    handleError(
      `Invalid region: ${chalk.yellow(region)}.\nAvailable regions: ${chalk.green(
        regionIds.join(", ")
      )}`
    );
  }

  return region;
}

/**
 * Prettified error handler
 */
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

// Get region from user input

async function promptForRegion(defaultRegion) {
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
    process.exit(0);
  }

  // Track region selection event
  try {
    await analytics.capture("region_selected", {
      command: CLI_NAME,
      region: region,
      selection_method: "interactive"
    });
  } catch (error) {
    // Silently fail analytics
  }

  return region;
}

// Create a database
async function createDatabase(name, region) {
  const s = spinner();
  s.start("Creating your database...");

  const resp = await fetch(`${CREATE_DB_WORKER_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region, name, utm_source: CLI_NAME }),
  });

  // Rate limit exceeded
  if (resp.status === 429) {
    s.stop(
      "We're experiencing a high volume of requests. Please try again later."
    );
    
    // Track database creation failure
    try {
      await analytics.capture("database_creation_failed", {
        command: CLI_NAME,
        region: region,
        error_type: "rate_limit",
        status_code: 429,
      });
    } catch (error) {
      // Silently fail analytics
    }
    
    process.exit(1);
  }

  const result = await resp.json();

  if (result.error) {
    s.stop(
      `Error creating database: ${result.error.message || "Unknown error"}`
    );
    
    // Track database creation failure
    try {
      await analytics.capture("database_creation_failed", {
        command: CLI_NAME,
        region: region,
        error_type: "api_error",
        error_message: result.error.message,
      });
    } catch (error) {
      // Silently fail analytics
    }
    process.exit(1);
  }

  s.stop("Database created successfully!");

  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiryFormatted = expiryDate.toLocaleString();

  log.message("");
  // Determine which connection string to display
  const database = result.data ? result.data.database : result.databases?.[0];
  const prismaConn = database?.connectionString;
  const directConnDetails = result.data
    ? database?.apiKeys?.[0]?.directConnection
    : result.databases?.[0]?.apiKeys?.[0]?.ppgDirectConnection;
  const directConn = directConnDetails
    ? `postgresql://${directConnDetails.user}:${directConnDetails.pass}@${directConnDetails.host}/postgres`
    : null;

  log.info(chalk.bold("Connect to your database →"));

  // Show Prisma Postgres connection string
  if (prismaConn) {
    log.message(
      chalk.magenta("  Use this connection string optimized for Prisma ORM:")
    );
    log.message("  " + chalk.yellow(prismaConn));
    log.message("");
  }

  // Show Direct connection string (if available)
  if (directConn) {
    log.message(
      chalk.cyan("  Use this connection string for everything else:")
    );
    log.message("  " + chalk.yellow(directConn));
    log.message("");
  } else {
    log.warning(
      chalk.yellow(
        "Direct connection details are not available in the API response."
      )
    );
  }

  // Claim Database
  const projectId = result.data ? result.data.id : result.id;
  const claimUrl = `${CLAIM_DB_WORKER_URL}?projectID=${projectId}&utm_source=${CLI_NAME}&utm_medium=cli`;
  const clickableUrl = terminalLink(claimUrl, claimUrl, { fallback: false });
  log.success(`${chalk.bold("Claim your database →")}`);
  log.message(
    chalk.cyan("  Want to keep your database? Claim for free via this link:")
  );
  log.message("  " + chalk.yellow(clickableUrl));
  log.message(
    chalk.italic(
      chalk.gray(
        "  Your database will be deleted on " +
          expiryFormatted +
          " if not claimed."
      )
    )
  );
}

// Main function

async function main() {
  try {
    const rawArgs = process.argv.slice(2);
    try {
      await analytics.capture("cli_command_ran", {
        command: CLI_NAME,
        full_command: `${CLI_NAME} ${rawArgs.join(' ')}`.trim(),
        has_region_flag: rawArgs.includes('--region') || rawArgs.includes('-r'),
        has_interactive_flag: rawArgs.includes('--interactive') || rawArgs.includes('-i'),
        has_help_flag: rawArgs.includes('--help') || rawArgs.includes('-h'),
        has_list_regions_flag: rawArgs.includes('--list-regions'),
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      });
    } catch (error) {
      // Silently fail analytics
    }

    // Parse command line arguments
    const { flags } = await parseArgs();

    if (!flags.help) {
      await isOffline();
    }

    // Set default values
    let name = new Date().toISOString();
    let region = "us-east-1";
    let chooseRegionPrompt = false;

    if (flags.help) {
      return;
    }

    if (flags["list-regions"]) {
      await listRegions();
      process.exit(0);
    }

    // Apply command line flags
    if (flags.region) {
      region = flags.region;
      
      // Track region selection via flag
      try {
        await analytics.capture("region_selected", {
          command: CLI_NAME,
          region: region,
          selection_method: "flag"
        });
      } catch (error) {
        // Silently fail analytics
      }
    }
    if (flags.interactive) {
      chooseRegionPrompt = true;
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
    // Interactive mode prompts
    if (chooseRegionPrompt) {
      // Prompt for region
      region = await promptForRegion(region);
    }

    // Validate the region
    region = await validateRegion(region);

    // Create the database
    await createDatabase(name, region);

    outro("");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
