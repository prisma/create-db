#!/usr/bin/env node

import {
  select,
  spinner,
  intro,
  outro,
  log,
  cancel,
  confirm,
} from "@clack/prompts";
import chalk from "chalk";
import dotenv from "dotenv";
import terminalLink from "terminal-link";
import clipboard from "clipboardy";

dotenv.config();

async function isOffline() {
  const healthUrl = `${process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io"}/health`;

  try {
    const res = await fetch(healthUrl, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Prisma API returned status ${res.status}`);
    }
    return false; // Online
  } catch {
    console.error(chalk.red.bold("\n✖ Error: Cannot reach API server.\n"));
    console.error(
      chalk.gray("Check your internet connection or Prisma's status page:")
    );
    console.error(chalk.green("https://www.prisma-status.com/\n"));
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

function showHelp() {
  console.log(`
${chalk.cyan.bold("Prisma Postgres Create DB")}

Usage:
  ${chalk.green(`npx ${CLI_NAME} [options]`)}

Options:
  ${chalk.yellow("--region <region>, -r <region>")}  Specify the region (e.g., us-east-1, eu-west-1)
  ${chalk.yellow("--interactive, -i")}               Run in interactive mode
  ${chalk.yellow("--direct, -d")}                    Use direct PostgreSQL connection string
  ${chalk.yellow("--copy, -c")}                      Enable clipboard prompt for connection string
  ${chalk.yellow("--help, -h")}                      Show this help message

Examples:
  ${chalk.gray(`npx ${CLI_NAME} --region us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} -i`)}
  ${chalk.gray(`npx ${CLI_NAME} -r eu-west-1 -c`)}
  `);
  process.exit(0);
}

// Parse command line arguments into flags and positional arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};

  const allowedFlags = ["region", "interactive", "copy", "help", "direct"];
  const shorthandMap = {
    r: "region",
    i: "interactive",
    c: "copy",
    d: "direct",
    h: "help",
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
      if (flag === "help") showHelp();
      if (!allowedFlags.includes(flag))
        exitWithError(`Invalid flag: --${flag}`);
      if (flag === "region") {
        const region = args[i + 1];
        if (!region || region.startsWith("-"))
          exitWithError("Missing value for --region flag.");
        flags.region = region;
        i++;
      } else flags[flag] = true;
      continue;
    }

    if (arg.startsWith("-")) {
      const letters = arg.slice(1).split("");
      for (const letter of letters) {
        const mappedFlag = shorthandMap[letter];
        if (!mappedFlag) exitWithError(`Invalid flag: -${letter}`);
        if (mappedFlag === "help") showHelp();
        if (mappedFlag === "region") {
          const region = args[i + 1];
          if (!region || region.startsWith("-"))
            exitWithError("Missing value for -r flag.");
          flags.region = region;
          i++;
        } else flags[mappedFlag] = true;
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
  const url = `${process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io"}/regions`;
  const res = await fetch(url);

  if (!res.ok) {
    handleError(
      `Failed to fetch regions. Status: ${res.status} ${res.statusText}`
    );
  }

  try {
    const data = await res.json();
    return Array.isArray(data) ? data : data.data;
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

  return region;
}

// Create a database
// Create a database
async function createDatabase(
  name,
  region,
  enableCopyPrompt = false,
  enableDirectConn = false
) {
  const s = spinner();
  s.start("Setting up your database...");

  const resp = await fetch(
    `${process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io"}/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region, name }),
    }
  );

  // Rate limit exceeded
  if (resp.status === 429) {
    s.stop(
      "We're experiencing a high volume of requests. Please try again later."
    );
    process.exit(1);
  }

  const result = await resp.json();

  if (result.error) {
    s.stop(
      `Error creating database: ${result.error.message || "Unknown error"}`
    );
    process.exit(1);
  }

  s.stop("Database created successfully!");

  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiryFormatted = expiryDate.toLocaleString();

  log.message("");

  // Determine which connection string to display
  let connectionString;
  const defaultConn = result.databases?.[0]?.connectionString;
  const direct = result.databases?.[0]?.apiKeys?.[0]?.ppgDirectConnection;

  if (enableDirectConn && direct) {
    connectionString = `postgresql://${direct.user}:${direct.pass}@${direct.host}/postgres`;
    log.info(chalk.bold("Direct PostgreSQL connection string:"));
    log.message(
      chalk.gray(
        "  (Use this if you're connecting with tools or ORMs other than Prisma ORM.)"
      )
    );
  } else {
    connectionString = defaultConn;
    log.info(chalk.bold("Prisma Postgres Database connection string:"));
    log.message(
      chalk.gray(
        "  (This connection string is only for use with Prisma ORM. Use the --direct or -d flag if you need a standard PostgreSQL string.)"
      )
    );

    if (enableDirectConn && !direct) {
      log.warning(
        chalk.yellow(
          "Direct connection details were not available in the API response. Showing Prisma ORM connection string instead."
        )
      );
    }
  }

  log.message("  " + chalk.yellow(connectionString));
  log.message("");
  log.success("Claim your database:");

  const claimUrl = `${process.env.CLAIM_DB_WORKER_URL || "https://create-db.prisma.io"}?projectID=${result.id}`;
  const clickableUrl = terminalLink(claimUrl, claimUrl, { fallback: false });
  log.message("  " + chalk.green(clickableUrl));
  log.message(
    "  " +
      chalk.red(`Expires: ${expiryFormatted}`) +
      chalk.gray("  (Claim to make permanent on your Prisma account)")
  );

  // Copy to clipboard if requested
  if (enableCopyPrompt) {
    try {
      clipboard.writeSync(connectionString);
      log.success(
        `${enableDirectConn ? "Direct connection string" : "Connection string"} copied to clipboard!`
      );
    } catch (e) {
      log.warning("Clipboard copy failed.");
    }
  }
}

// Main function

async function main() {
  try {
    // Parse command line arguments
    const { flags } = parseArgs();

    if (!flags.help) {
      await isOffline();
    }

    // Set default values
    let name = new Date().toISOString();
    let region = "us-east-1";
    let usePrompts = false;
    let enableCopyPrompt = false;

    // Apply command line flags
    if (flags.region) {
      region = flags.region;
    }
    let enableDirectConn = false;
    if (flags.direct) {
      enableDirectConn = true;
    }
    if (flags.interactive) {
      usePrompts = true;
    }
    if (flags.copy) {
      enableCopyPrompt = true;
    }

    // Show intro and prompts if interactive mode is enabled
    if (usePrompts) {
      intro("Create Database");
      region = await promptForRegion(region);
    } else {
      // Show minimal header for non-interactive mode
      log.info(chalk.cyan.bold("🚀 Prisma Postgres Create DB"));
      log.message(
        chalk.gray(
          `Creating a temporary Prisma Postgres database in ${region}...`
        )
      );
      log.message("");
    }

    // Validate the region
    region = await validateRegion(region);

    // Create the database
    await createDatabase(name, region, enableCopyPrompt, enableDirectConn);

    outro("");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
