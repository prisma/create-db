#!/usr/bin/env node

const { Input, Select, Password } = require("enquirer");
const chalk = require("chalk");
const ora = require("commonjs-ora");

async function main() {
  try {
    // Claim Database
    const [, , subcommand] = process.argv;
    if (subcommand === "claim") {
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
      return;
    }

    // Prompt for Database Name
    const namePrompt = new Input({
      message: "What should your database be called?",
      default: "my-prisma-postgres-database",
    });
    const name = await namePrompt.run();
    console.log();

    // Fetch Available Regions
    const res = await fetch("https://create-db-worker.raycast-0ef.workers.dev");
    const data = await res.json();
    const regions = Array.isArray(data) ? data : data.data;

    // Prompt for Region Choice
    const regionPrompt = new Select({
      message: "Choose a region:",
      choices: regions.map((r) => r.id),
    });
    const region = await regionPrompt.run();

    // Empty line to seperate the spinner (\n doesn't work there)
    console.log();

    // Create Database
    const spinner = ora("Creating database...").start();
    const resp = await fetch(
      "https://create-db-worker.raycast-0ef.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, name }),
      }
    );
    const result = await resp.json();
    spinner.succeed("Success!\n");

    // Output Connection String
    console.log(
      `Connection String:\n\n${chalk.yellow(
        result.databases[0].connectionString
      )}\n`
    );
  } catch (error) {
    process.exit(1);
  }
}

main();
