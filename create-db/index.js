#!/usr/bin/env node

const { Input, Select, Password } = require("enquirer");
const ora = require("commonjs-ora");
const boxen = require("boxen");

// Parse command line arguments into flags and positional arguments

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const flagName = arg.slice(2);

      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        flags[flagName] = args[i + 1];
        i++;
      } else {
        flags[flagName] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

// Claim a database

async function claimDatabase() {
  const connectionString = await new Password({
    message: "Enter the connection string:",
  }).run();

  if (!connectionString) {
    console.error("A connection string is required.");
    process.exit(1);
  }

  const spinner = ora("Claiming database...").start();
  const claimUrl = `https://claim-db-worker.raycast-0ef.workers.dev/claim?connectionString=${encodeURIComponent(
    connectionString
  )}`;

  const res = await fetch(claimUrl);
  const data = await res.json();
  spinner.succeed("Claimed!");
  console.log("Response:\n", data);
}

// Get database name from user input

async function promptForName(defaultName) {
  const namePrompt = new Input({
    message: "What should your database be called?",
    default: defaultName,
  });
  return await namePrompt.run();
}

// Get region from user input

async function promptForRegion(defaultRegion) {
  const res = await fetch("https://create-db-worker.raycast-0ef.workers.dev");
  const data = await res.json();
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

  const resp = await fetch("https://create-db-worker.raycast-0ef.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region, name }),
  });

  const result = await resp.json();
  spinner.succeed("Database created successfully!");

  // Display connection string
  console.log("\n🔗 CONNECTION STRING");
  console.log(
    boxen(result.databases[0].connectionString, {
      padding: 1,
      borderStyle: "round",
    })
  );

  console.log(
    "\nThis database will be deleted in 24 hours. To claim this database, run:"
  );
  console.log(
    boxen(`npx create-db claim ${result.databases[0].connectionString}`, {
      padding: 1,
      borderStyle: "round",
    })
  );
}

// Main function

async function main() {
  try {
    // Parse command line arguments
    const { flags, positional } = parseArgs();
    const [subcommand] = positional;

    // Handle 'claim' subcommand
    if (subcommand === "claim") {
      await claimDatabase();
      return;
    }

    // Set default values
    let name = "my-prisma-postgres-database";
    let region = "us-east-1";
    let usePrompts = false;

    // Apply command line flags
    if (flags.name) {
      name = flags.name;
    }
    if (flags.region) {
      region = flags.region;
    }
    if (flags.prompt || flags.prompts) {
      usePrompts = true;
    }

    // Show interactive prompts if requested or if no flags provided
    if (usePrompts) {
      name = await promptForName(name);
      console.log();
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
