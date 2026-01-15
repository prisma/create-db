import { intro, outro, cancel, log, spinner as clackSpinner } from "@clack/prompts";
import fs from "fs";
import pc from "picocolors";
import terminalLink from "terminal-link";

import type { DatabaseResult } from "./types.js";

/** Display the CLI intro message. */
export function showIntro() {
  intro(pc.bold(pc.cyan("🚀 Creating a Prisma Postgres database")));
}

/** Display the CLI outro message. */
export function showOutro() {
  outro(pc.dim("Done!"));
}

/** Display a cancellation message. */
export function showCancelled() {
  cancel(pc.red("Operation cancelled."));
}

/**
 * Create a spinner for database creation progress.
 * @returns An object with start, success, and error methods
 */
export function createSpinner() {
  const s = clackSpinner();
  return {
    start: (region: string) => s.start(`Creating database in ${pc.cyan(region)}...`),
    success: () => s.stop(pc.green("Database created successfully!")),
    error: (message: string) => s.stop(pc.red(`Error: ${message}`)),
  };
}

/**
 * Print formatted database creation result to the console.
 * @param result - The successful database creation result
 */
export function printDatabaseResult(result: DatabaseResult) {
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
      pc.dim(`  Database will be deleted on ${expiryFormatted} if not claimed.`)
    )
  );
}

/**
 * Print data as formatted JSON.
 * @param data - Data to serialize and print
 */
export function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Print an error message in red.
 * @param message - Error message to display
 */
export function printError(message: string) {
  console.error(pc.red(message));
}

/**
 * Print a success message in green.
 * @param message - Success message to display
 */
export function printSuccess(message: string) {
  console.log(pc.green(message));
}

/**
 * Write database credentials to an env file.
 * @param envPath - Path to the env file
 * @param connectionString - Database connection string
 * @param claimUrl - URL to claim the database
 * @returns Success or failure with error message
 */
export function writeEnvFile(
  envPath: string,
  connectionString: string | null,
  claimUrl: string
): { success: true } | { success: false; error: string } {
  try {
    const lines = [
      `DATABASE_URL="${connectionString ?? ""}"`,
      `CLAIM_URL="${claimUrl}"`,
      "",
    ];

    let prefix = "";
    if (fs.existsSync(envPath)) {
      const existing = fs.readFileSync(envPath, "utf8");
      if (existing.length > 0 && !existing.endsWith("\n")) {
        prefix = "\n";
      }
    }

    fs.appendFileSync(envPath, prefix + lines.join("\n"), { encoding: "utf8" });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
