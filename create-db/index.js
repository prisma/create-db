#!/usr/bin/env node

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

import { select, spinner, intro, outro, log, cancel } from "@clack/prompts";
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

function readUserEnvFile() {
  const userCwd = process.cwd();
  const envPath = path.join(userCwd, '.env');
  
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
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

Examples:
  ${chalk.gray(`npx ${CLI_NAME} --region us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} -r us-east-1`)}
  ${chalk.gray(`npx ${CLI_NAME} --interactive`)}
  ${chalk.gray(`npx ${CLI_NAME} -i`)}
  ${chalk.gray(`npx ${CLI_NAME} --json --region us-east-1`)}
`);
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
    "source",
  ];
  const shorthandMap = {
    r: "region",
    i: "interactive",
    h: "help",
    j: "json",
    s: "source",
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
      } else if (flag === "source") {
        flags.source = true;
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
        } else if (mappedFlag === "source") {
          flags.source = true;
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
        } else if (mappedFlag === "source") {
          flags.source = true;
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

async function promptForRegion(defaultRegion, source) {
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

  try {
    const analyticsProps = {
      command: CLI_NAME,
      region: region,
      "selection-method": "interactive",
    };
    
    if (source) {
      analyticsProps.source = source;
    }
    
    await analytics.capture("create_db:region_selected", analyticsProps);
  } catch (error) {}

  return region;
}

async function createDatabase(name, region, source, returnJson = false ) {
  let s;
  if (!returnJson) {
    s = spinner();
    s.start("Creating your database...");
  }

  const resp = await fetch(`${CREATE_DB_WORKER_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region, name, utm_source: source }),
  });

  if (resp.status === 429) {
    if (returnJson) {
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

    try {
      const analyticsProps = {
        command: CLI_NAME,
        region: region,
        "error-type": "rate_limit",
        "status-code": 429,
      };
      
      if (source) {
        analyticsProps.source = source;
      }
      
      await analytics.capture("create_db:database_creation_failed", analyticsProps);
    } catch (error) {}

    process.exit(1);
  }

  let result;
  let raw;
  try {
    raw = await resp.text();
    result = JSON.parse(raw);
  } catch (e) {
    if (returnJson) {
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
    try {
      const analyticsProps = {
        command: CLI_NAME,
        region,
        "error-type": "invalid_json",
        "status-code": resp.status,
      };
      
      if (source) {
        analyticsProps.source = source;
      }
      
      await analytics.capture("create_db:database_creation_failed", analyticsProps);
    } catch {}
    process.exit(1);
  }

  const database = result.data ? result.data.database : result.databases?.[0];
  const projectId = result.data ? result.data.id : result.id;
  const prismaConn = database?.connectionString;

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
      ? `postgresql://${directUser}:${directPass}@${directHost}${directPort}/${directDbName}`
      : null;

  const claimUrl = `${CLAIM_DB_WORKER_URL}?projectID=${projectId}&utm_source=${source}&utm_medium=cli`;
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (returnJson && !result.error) {
    return {
      connectionString: prismaConn,
      directConnectionString: directConn,
      claimUrl: claimUrl,
      deletionDate: expiryDate.toISOString(),
      region: database?.region?.id || region,
      name: database?.name,
      projectId: projectId,
    };
  }

  if (result.error) {
    if (returnJson) {
      return {
        error: "api_error",
        message: result.error.message || "Unknown error",
        details: result.error,
      };
    }

    if (s) {
      s.stop(
        `Error creating database: ${result.error.message || "Unknown error"}`
      );
    }

    try {
      const analyticsProps = {
        command: CLI_NAME,
        region: region,
        "error-type": "api_error",
        "error-message": result.error.message,
      };
      
      if (source) {
        analyticsProps.source = source;
      }
      
      await analytics.capture("create_db:database_creation_failed", analyticsProps);
    } catch (error) {}
    process.exit(1);
  }

  if (s) {
    s.stop("Database created successfully!");
  }

  const expiryFormatted = expiryDate.toLocaleString();

  log.message("");

  log.info(chalk.bold("Connect to your database →"));

  if (prismaConn) {
    log.message(
      chalk.magenta("  Use this connection string optimized for Prisma ORM:")
    );
    log.message("  " + chalk.yellow(prismaConn));
    log.message("");
  }

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

async function main() {
  try {
    const rawArgs = process.argv.slice(2);
    
    const { flags } = await parseArgs();
    
          let source;
    if (flags.source) {
      const userEnvVars = readUserEnvFile();
      const userCwd = process.cwd();
      const envPath = path.join(userCwd, '.env');
      
      if (fs.existsSync(envPath)) {
        const ctaVars = [];
        if (userEnvVars.CTA_VERSION) ctaVars.push(`v${userEnvVars.CTA_VERSION}`);
        if (userEnvVars.CTA_FRAMEWORK) ctaVars.push(userEnvVars.CTA_FRAMEWORK);
        if (userEnvVars.CTA_FRAMEWORK_VERSION) ctaVars.push(`fv${userEnvVars.CTA_FRAMEWORK_VERSION}`);
        
        if (ctaVars.length > 0) {
          source = ctaVars.join('-');
        }
      }
    }
    
    try {
      const analyticsProps = {
        command: CLI_NAME,
        "full-command": `${CLI_NAME} ${rawArgs.join(" ")}`.trim(),
        "has-region-flag":
          rawArgs.includes("--region") || rawArgs.includes("-r"),
        "has-interactive-flag":
          rawArgs.includes("--interactive") || rawArgs.includes("-i"),
        "has-help-flag": rawArgs.includes("--help") || rawArgs.includes("-h"),
        "has-list-regions-flag": rawArgs.includes("--list-regions"),
        "has-json-flag": rawArgs.includes("--json") || rawArgs.includes("-j"),
        "has-source-flag": rawArgs.includes("--source") || rawArgs.includes("-s"),
        "node-version": process.version,
        platform: process.platform,
        arch: process.arch,
      };
      
      if (source) {
        analyticsProps.source = source;
      }
      
      await analytics.capture("create_db:cli_command_ran", analyticsProps);
    } catch (error) {
      console.error("Error:", error.message);
    }

    if (!flags.help && !flags.json) {
      await isOffline();
    }

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

    if (flags.region) {
      region = flags.region;

      try {
        const analyticsProps = {
          command: CLI_NAME,
          region: region,
          "selection-method": "flag",
        };
        
        if (source) {
          analyticsProps.source = source;
        }
        
        await analytics.capture("create_db:region_selected", analyticsProps);
      } catch (error) {}
    }

    if (flags.source) {
      const userCwd = process.cwd();
      const envPath = path.join(userCwd, '.env');
      
      if (!fs.existsSync(envPath)) {
        console.error(chalk.red("Error: Source not configured correctly."));
        process.exit(1);
      }
      
      const userEnvVars = readUserEnvFile();
      const ctaVars = [];
      if (userEnvVars.CTA_VERSION) ctaVars.push(`v${userEnvVars.CTA_VERSION}`);
      if (userEnvVars.CTA_FRAMEWORK) ctaVars.push(userEnvVars.CTA_FRAMEWORK);
      if (userEnvVars.CTA_FRAMEWORK_VERSION) ctaVars.push(`fv${userEnvVars.CTA_FRAMEWORK_VERSION}`);
      
      if (ctaVars.length === 0) {
        console.error(chalk.red("Error: Source not configured correctly."));
        process.exit(1);
      }
    }

    if (flags.interactive) {
      chooseRegionPrompt = true;
    }

    if (flags.json) {
      try {
        if (chooseRegionPrompt) {
          region = await promptForRegion(region, source);
        } else {
          await validateRegion(region, true);
        }
        const result = await createDatabase(name, region, source, true);
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      } catch (e) {
        console.log(
          JSON.stringify(
            { error: "cli_error", message: e?.message || String(e) },
            null,
            2
          )
        );
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
      region = await promptForRegion(region, source);
    }

    region = await validateRegion(region);

    await createDatabase(name, region, source);

    outro("");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
