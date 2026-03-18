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

const cli = createDbCli();
const program = cli.buildProgram() as unknown as CommandLike;
simplifyHelpFlags(program);
void cli.run(undefined, program as never);
