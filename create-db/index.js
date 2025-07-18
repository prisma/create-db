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

// Parse command line arguments into flags and positional arguments

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  const positional = [];
  const allowedFlags = ["region", "i", "copy"];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const flagName = arg.slice(2);
      if (!allowedFlags.includes(flagName)) {
        console.error(
          `Invalid flag: --${flagName}. Allowed flags are: --region, --i`
        );
        process.exit(1);
      }
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        flags[flagName] = args[i + 1];
        i++;
      } else {
        flags[flagName] = true;
      }
    } else if (arg.startsWith("-")) {
      // Disallow all single-dash flags and print allowed flags
      console.error(
        [
          "",
          "Invalid flag: " + arg,
          "",
          "Allowed flags:",
          "",
          "  --region <region>    Set the region (us-east-1, eu-west-1, etc)",
          "  --i                  Interactive mode",
          "  --copy               Enable clipboard prompt",
          "",
        ].join("\n")
      );
      process.exit(1);
    } else {
      // Disallow subcommands or positional arguments
      console.error(
        `Invalid subcommand or argument: ${arg}. Allowed flags are: --region, --i, --copy`
      );
      process.exit(1);
    }
  }

  return { flags, positional };
}

// Get region from user input

async function promptForRegion(defaultRegion) {
  const url = `${process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io"}/regions`;
  const res = await fetch(url);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    console.error("Failed to parse JSON from /regions endpoint.");
    throw e;
  }

  const regions = Array.isArray(data) ? data : data.data;

  const region = await select({
    message: "Choose a region:",
    options: regions.map((r) => ({ value: r.id, label: r.id })),
    initialValue:
      regions.find((r) => r.id === defaultRegion)?.id || regions[0]?.id,
  });

  if (region === null) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return region;
}

// Create a database

async function createDatabase(name, region, enableCopyPrompt = false) {
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

  log.info("Connection string:");
  log.message("  " + chalk.yellow(result.databases[0].connectionString));

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

  if (enableCopyPrompt) {
    const shouldCopy = await confirm({
      message:
        "Would you like to copy the connection string to your clipboard?",
      initialValue: true,
    });
    if (shouldCopy) {
      clipboard.writeSync(result.databases[0].connectionString);
      log.success("Connection string copied to clipboard!");
    }
  }
}

// Main function

async function main() {
  try {
    // Parse command line arguments
    const { flags } = parseArgs();

    // Set default values
    let name = new Date().toISOString();
    let region = "us-east-1";
    let usePrompts = false;
    let enableCopyPrompt = false;

    // Apply command line flags
    if (flags.region) {
      region = flags.region;
    }
    if (flags.i) {
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

    // Create the database
    await createDatabase(name, region, enableCopyPrompt);

    outro("");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
