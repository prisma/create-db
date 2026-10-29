import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// The Prisma 8 CLI and Postgres ORM each request installs into a scratch project.
const PRISMA_VERSION = "8.0.0-rc.28";
const ORM_POSTGRES_VERSION = "8.0.0-rc.21";

const CONTRACT_FILE = "contract.prisma";
// Prisma 8 only reads PSL files that start with this directive.
const CONTRACT_DIRECTIVE = "// use prisma-8";

const PRISMA_CONFIG = `import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./${CONTRACT_FILE}",
    db: { connection: process.env.DATABASE_URL! },
  }),
});
`;

/** Something `prisma db update` asks before it loses data, e.g. `public.User.name`. */
export interface Consent {
  subject: string;
  verbs: string[];
}

export interface PrismaError {
  code: string;
  summary?: string;
  why?: string;
  meta?: {
    unanswered?: Consent[];
    // Findings from interpreting the PSL, e.g. an unsupported block.
    diagnostics?: { code?: string; message: string; span?: { start?: { line?: number } } }[];
  };
}

/** The result envelope Prisma prints as the last line of `--json` output. */
export interface PrismaEnvelope {
  ok: boolean;
  error?: PrismaError;
  // Findings from parsing the PSL, e.g. an unknown type.
  diagnostics?: {
    severity?: string;
    summary?: string;
    where?: { line?: number };
    meta?: { code?: string };
  }[];
}

export interface PrismaProject {
  /** Run a Prisma command against the database and return its result envelope. */
  run(args: string[]): Promise<PrismaEnvelope>;
  /** Read the project's PSL contract. */
  readContract(): Promise<string>;
  /** A readable message for a failed command, with lines numbered as the caller's schema. */
  describe(envelope: PrismaEnvelope): string;
}

/**
 * Prepend the Prisma 8 directive unless the schema already starts with it.
 * @returns The schema to write, and how many lines were added above it
 */
function withDirective(schema: string) {
  return schema.trimStart().startsWith(CONTRACT_DIRECTIVE)
    ? { contract: schema, lineOffset: 0 }
    : { contract: `${CONTRACT_DIRECTIVE}\n\n${schema}`, lineOffset: 2 };
}

function describeEnvelope(envelope: PrismaEnvelope, lineOffset: number) {
  const findings = [
    ...(envelope.error?.meta?.diagnostics ?? []).map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      line: diagnostic.span?.start?.line,
    })),
    ...(envelope.diagnostics ?? [])
      .filter((diagnostic) => diagnostic.severity === "error")
      .map((diagnostic) => {
        const code = diagnostic.meta?.code;
        const summary = diagnostic.summary ?? "";
        // The summary reads "<file>:<line>:<column> <CODE>: <message>".
        const message = code ? summary.split(`${code}: `)[1] ?? summary : summary;
        return { code, message, line: diagnostic.where?.line };
      }),
  ];
  if (findings.length === 0) return describeError(envelope.error);

  // Prisma can report one finding in both places; keep the first.
  const unique = new Map<string, (typeof findings)[number]>();
  for (const finding of findings) {
    const key = `${finding.line}:${finding.message}`;
    if (!unique.has(key)) unique.set(key, finding);
  }

  return [...unique.values()]
    .map(({ code, message, line }) => {
      const where = line === undefined ? "" : `Line ${Math.max(1, line - lineOffset)}: `;
      const hint =
        code === "PSL_UNSUPPORTED_TOP_LEVEL_BLOCK"
          ? " Prisma 8 schemas have no generator or datasource blocks; remove them."
          : "";
      const sentence = /[.!?]$/.test(message) ? message : `${message}.`;
      return `${where}${sentence}${hint}`;
    })
    .join("\n");
}

function parseEnvelope(stdout: string): PrismaEnvelope | undefined {
  const lines = stdout.trim().split("\n");
  for (const line of lines.reverse()) {
    try {
      const frame = JSON.parse(line) as { kind?: string; envelope?: PrismaEnvelope };
      if (frame.kind === "result" && frame.envelope) return frame.envelope;
    } catch {
      // Progress frames and log lines come before the result.
    }
  }
  return undefined;
}

/** A readable message for a failed Prisma command. */
function describeError(error: PrismaError | undefined) {
  if (!error) return "Prisma command failed";
  return [error.summary, error.why].filter(Boolean).join("\n");
}

/**
 * Run `task` in a scratch Prisma 8 project for the database, removing the
 * project afterwards. Vercel functions can only write to the temp directory,
 * so npm's home and cache live there too.
 */
export async function withPrismaProject<T>(
  connectionString: string,
  schema: string | undefined,
  task: (project: PrismaProject) => Promise<T>
): Promise<T> {
  const tempDir = tmpdir();
  const projectDir = await mkdtemp(path.join(tempDir, "prisma-"));
  const env = {
    ...process.env,
    DATABASE_URL: connectionString,
    HOME: tempDir,
    npm_config_cache: path.join(tempDir, ".npm-cache"),
    npm_config_userconfig: path.join(tempDir, ".npmrc"),
  };

  try {
    const packageJson = {
      name: "temp-prisma-project",
      private: true,
      type: "module",
      dependencies: {
        prisma: PRISMA_VERSION,
        "@prisma/orm-postgres": ORM_POSTGRES_VERSION,
      },
    };
    await writeFile(path.join(projectDir, "package.json"), JSON.stringify(packageJson));
    await writeFile(path.join(projectDir, "prisma.config.ts"), PRISMA_CONFIG);
    const { contract, lineOffset } = withDirective(schema ?? "");
    if (schema !== undefined) {
      await writeFile(path.join(projectDir, CONTRACT_FILE), contract);
    }

    await execFileAsync("npm", ["install", "--no-audit", "--no-fund"], {
      cwd: projectDir,
      env,
    });

    return await task({
      run: async (args) => {
        // A failing command exits non-zero but still prints its envelope.
        const { stdout, stderr } = await execFileAsync(
          "npx",
          ["prisma", ...args, "--json"],
          { cwd: projectDir, env, maxBuffer: 10 * 1024 * 1024 }
        ).catch((error: { stdout?: string; stderr?: string }) => ({
          stdout: error.stdout ?? "",
          stderr: error.stderr ?? "",
        }));
        const envelope = parseEnvelope(stdout);
        if (!envelope) {
          throw new Error(stderr.trim() || `prisma ${args.join(" ")} printed no result`);
        }
        return envelope;
      },
      readContract: () => readFile(path.join(projectDir, CONTRACT_FILE), "utf8"),
      describe: (envelope) => describeEnvelope(envelope, lineOffset),
    });
  } finally {
    await rm(projectDir, { recursive: true, force: true }).catch((cleanupError) => {
      console.error("Cleanup error:", cleanupError);
    });
  }
}
