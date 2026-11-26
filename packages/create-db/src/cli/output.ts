import { intro, outro, cancel, log, spinner as clackSpinner } from "@clack/prompts";
import { spawnSync } from "child_process";
import fs from "fs";
import pc from "picocolors";
import terminalLink from "terminal-link";

import type { DatabaseResult } from "../types.js";

type OperationResult = { success: true } | { success: false; error: string };

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
 * Create a spinner for database creation progress. When stdout isn't a
 * terminal (an agent, a pipe, a CI log), print plain step lines instead:
 * clack's spinner animates regardless and fills the output with frames.
 * @returns An object with start, success, and error methods
 */
export function createSpinner() {
  if (!process.stdout.isTTY) {
    return {
      start: (region: string) => log.step(`Creating database in ${pc.cyan(region)}...`),
      success: () => log.success(pc.green("Database created successfully!")),
      error: (message: string) => log.error(pc.red(`Error: ${message}`)),
    };
  }

  const s = clackSpinner();
  return {
    start: (region: string) => s.start(`Creating database in ${pc.cyan(region)}...`),
    success: () => s.stop(pc.green("Database created successfully!")),
    error: (message: string) => s.stop(pc.red(`Error: ${message}`)),
  };
}

/**
 * Format the deletion date in local time with the time zone, so the time
 * stays unambiguous when it's relayed from a sandbox in another zone.
 * @param deletionDate - ISO deletion date from the database result
 * @returns The formatted date, e.g. "10/30/2026, 9:02:10 AM UTC"
 */
export function formatDeletionDate(deletionDate: string) {
  return new Date(deletionDate).toLocaleString(undefined, {
    timeZoneName: "short",
  });
}

/**
 * Print formatted database creation result to the console.
 * @param result - The successful database creation result
 */
export function printDatabaseResult(result: DatabaseResult) {
  const expiryFormatted = formatDeletionDate(result.deletionDate);
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
  log.message(
    pc.italic(
      pc.dim("  Deploying or sharing an app with it? Claim it first: an unclaimed database is deleted and the app stops working.")
    )
  );
}

/** How the CLI printed its result; recorded on the claim URL as `utm_content`. */
export type OutputMode = "default" | "json" | "env" | "quiet";

/**
 * Tag the claim URL with the output mode, so claim page visits can be
 * attributed to the mode that produced them. The existing query string is
 * left as is rather than re-serialized, so other params keep their encoding.
 * @param result - The successful database creation result
 * @param mode - The output mode in use
 * @returns The result with a tagged claim URL
 */
export function withOutputMode(
  result: DatabaseResult,
  mode: OutputMode
): DatabaseResult {
  const separator = result.claimUrl.includes("?") ? "&" : "?";
  return {
    ...result,
    claimUrl: `${result.claimUrl}${separator}utm_content=${mode}`,
  };
}

/**
 * A short message for the person, ready to show as is. Agents paraphrase a
 * `nextStep` and often drop the claim URL; a finished sentence survives.
 * @param result - The successful database creation result
 * @returns The message, with the claim URL and deletion time
 */
export function formatUserMessage(result: DatabaseResult) {
  return `Your Prisma Postgres database is ready: free, no account needed. To keep it, claim it for free with a Prisma account (no card): ${result.claimUrl} . Unclaimed, it is deleted on ${formatDeletionDate(result.deletionDate)}. Claim it before you deploy or share an app that uses it.`;
}

/**
 * Build the JSON printed by `--json`: the result plus a `nextStep` telling the
 * agent or script to pass the claim URL on, since the database is deleted
 * unless someone claims it.
 * @param result - The successful database creation result
 * @returns The JSON payload
 */
export function formatJsonResult(result: DatabaseResult) {
  return {
    ...result,
    userMessage: formatUserMessage(result),
    nextStep: `Show the user userMessage, word for word, in your reply. The database is deleted at ${result.deletionDate} unless the user claims it, which keeps it for free. If an app you deploy or share uses this database, the user must claim it before then or the app stops working. Give the user this claim URL: ${result.claimUrl}`,
  };
}

/**
 * Print a one-line claim reminder for the non-interactive modes.
 * @param result - The successful database creation result
 * @param stream - Where to print; `stderr` keeps stdout clean for `--quiet`
 */
export function printClaimReminder(
  result: DatabaseResult,
  stream: "stdout" | "stderr" = "stdout"
) {
  const expiryFormatted = formatDeletionDate(result.deletionDate);
  const line = `Keep your database for free: ${result.claimUrl} (deleted on ${expiryFormatted} if not claimed)`;
  if (stream === "stderr") {
    console.error(line);
  } else {
    console.log(line);
  }
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
 * Written above the variables, so an agent that reads .env later (for
 * example when asked to deploy) sees that the database must be claimed.
 */
export const ENV_FILE_COMMENT =
  "# Prisma Postgres from create-db: free, no account needed. Open CLAIM_URL to keep it for free. Unclaimed, it is deleted. Claim it before you deploy or share an app that uses it.";

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
      ENV_FILE_COMMENT,
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

/**
 * Copy text to the system clipboard.
 * @param text - Text to copy
 */
export function copyToClipboard(text: string): OperationResult {
  const commands =
    process.platform === "darwin"
      ? [{ command: "pbcopy", args: [] as string[] }]
      : process.platform === "win32"
        ? [{ command: "cmd", args: ["/c", "clip"] }]
        : [
            { command: "wl-copy", args: [] as string[] },
            { command: "xclip", args: ["-selection", "clipboard"] },
            { command: "xsel", args: ["--clipboard", "--input"] },
          ];

  const errors: string[] = [];

  for (const { command, args } of commands) {
    const result = spawnSync(command, args, {
      input: text,
      encoding: "utf8",
      stdio: ["pipe", "ignore", "pipe"],
    });

    if (result.status === 0) {
      return { success: true };
    }

    if (result.error) {
      errors.push(`${command}: ${result.error.message}`);
    } else if (result.stderr?.trim()) {
      errors.push(`${command}: ${result.stderr.trim()}`);
    }
  }

  return {
    success: false,
    error: errors[0] || "No clipboard command is available on this system.",
  };
}

/**
 * Open a URL in the user's default browser.
 * @param url - URL to open
 */
export function openUrlInBrowser(url: string): OperationResult {
  const command =
    process.platform === "darwin"
      ? { command: "open", args: [url] }
      : process.platform === "win32"
        ? { command: "cmd", args: ["/c", "start", "", url] }
        : { command: "xdg-open", args: [url] };

  const result = spawnSync(command.command, command.args, { stdio: "ignore" });

  if (result.status === 0) {
    return { success: true };
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return {
    success: false,
    error: `Command failed: ${command.command}`,
  };
}
