import fs from "fs";
import { CliValidationError, type TrpcCliRunParams } from "trpc-cli";

import { createDbCli } from "./index.js";

type OptionLike = {
  flags?: string;
  long?: string;
};

type CommandLike = {
  options?: OptionLike[];
  commands?: CommandLike[];
};

function simplifyHelpFlags(command: CommandLike) {
  for (const option of command.options ?? []) {
    if (!option.flags) {
      continue;
    }

    option.flags = option.flags
      .replace(" [boolean]", "")
      .replace(" [string]", " [value]")
      .replace(" <string>", " <value>");

    if (option.long === "--ttl" || option.flags.includes("--ttl")) {
      option.flags = option.flags
        .replace("<value>", "<duration>")
        .replace("[value]", "[duration]");
    }
  }

  for (const subcommand of command.commands ?? []) {
    simplifyHelpFlags(subcommand);
  }
}

/** Whether the arguments ask for JSON: `--json`, `-j`, or `-j` in a short-flag group such as `-jq`. */
function requestsJson(args: string[]) {
  return args.some(
    (arg) => arg === "--json" || arg === "--json=true" || /^-[a-z]*j[a-z]*$/i.test(arg)
  );
}

/**
 * Report errors raised outside the command as JSON when --json was asked for:
 * argument errors (an unknown region, a bad --ttl) are raised while parsing,
 * before the command can print its own JSON. The message also goes to stderr;
 * the usage text is left out, since it's for people.
 */
function jsonCliErrors(): TrpcCliRunParams {
  let message: string | undefined;
  // Commander's parse errors skip formatError; trpc-cli passes it input
  // validation failures (CliValidationError) and errors thrown by the command.
  let error = "invalid_arguments";
  return {
    formatError: (cause) => {
      if (!(cause instanceof CliValidationError)) error = "unexpected_error";
      return cause instanceof Error ? cause.message : String(cause);
    },
    logger: {
      error: (...parts) => {
        // trpc-cli appends the command's help to validation errors.
        message ??= parts
          .join(" ")
          .replace(/\n+Usage: [\s\S]*$/, "")
          .trim()
          .replace(/^error: /, "");
      },
    },
    process: {
      exit: (code) => {
        if (code !== 0 && message) {
          // Written synchronously, so the JSON isn't cut off by the exit.
          fs.writeSync(
            1,
            `${JSON.stringify({ success: false, error, message }, null, 2)}\n`
          );
          console.error(message);
        }
        process.exit(code);
      },
    },
  };
}

// Subcommands take their error output and exit from buildProgram's params,
// the root command from run's, so both get the same ones.
const runParams = requestsJson(process.argv.slice(2)) ? jsonCliErrors() : undefined;
const cli = createDbCli();
const program = cli.buildProgram(runParams) as unknown as CommandLike;
simplifyHelpFlags(program);
void cli.run(runParams, program as never);
