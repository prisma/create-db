#!/usr/bin/env node

import pkg from "enquirer";
const { Input, Select } = pkg;
import ora from "ora";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

// Parse command line arguments into flags and positional arguments

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  const positional = [];
  const allowedFlags = ["region", "i"];

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
          chalk.red.bold("Invalid flag: ") + chalk.yellow(arg),
          "",
          chalk.bold("Allowed flags:"),
          "",
          `  ${chalk.green("--region <region>")}    Set the region ${chalk.dim(
            "(us-east-1, eu-west-1, etc)"
          )}`,
          `  ${chalk.green("--i")}                  Interactive mode`,
          "",
        ].join("\n")
      );
      process.exit(1);
    } else {
      // Disallow subcommands or positional arguments
      console.error(
        `Invalid subcommand or argument: ${arg}. Allowed flags are: --region, --i`
      );
      process.exit(1);
    }
  }

  return { flags, positional };
}

// Get region from user input

async function promptForRegion(defaultRegion) {
  const url = `${process.env.CREATE_DB_WORKER_URL}/regions`;
  const res = await fetch(url);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    console.error("Failed to parse JSON from /regions endpoint.");
    throw e;
  }

  const regions = Array.isArray(data) ? data : data.data;

  const regionPrompt = new Select({
    message: "Choose a region:",
    choices: regions.map((r) => r.id),
    initial:
      regions.findIndex((r) => r.id === defaultRegion) >= 0
        ? regions.findIndex((r) => r.id === defaultRegion)
        : 0,
  });
  return await regionPrompt.run();
}

// Create a database

async function createDatabase(name, region) {
  const spinner = ora("Creating a database...").start();

  const resp = await fetch(`${process.env.CREATE_DB_WORKER_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region, name }),
  });

  // Rate limit exceeded

  if (resp.status === 429) {
    spinner.fail(
      chalk.bold(
        " We're experiencing a high volume of requests. Please try again later."
      )
    );
    process.exit(1);
  }

  const result = await resp.json();

  if (result.error) {
    spinner.fail(
      chalk.red.bold("Error creating database: ") +
        chalk.yellow(result.error.message || "Unknown error")
    );
    process.exit(1);
  }

  spinner.succeed("Database created successfully!");

  // Display connection string
  console.log(chalk.bold("\nConnection string:"));
  console.log(chalk.yellow(result.databases[0].connectionString));

  console.log(
    chalk.red.bold("\nThis database will be deleted in 24 hours."),
    chalk.bold("To claim it, visit: ")
  );
  console.log(
    chalk.yellow(`${process.env.CLAIM_DB_WORKER_URL}?projectID=${result.id}`)
  );
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

    // Apply command line flags
    if (flags.region) {
      region = flags.region;
    }
    if (flags.i) {
      usePrompts = true;
    }

    // Show interactive prompts if requested or if no flags provided
    if (usePrompts) {
      region = await promptForRegion(region);
      console.log();
    }

    // Create the database
    await createDatabase(name, region);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
