import { describe, it, expect } from "vitest";
import { execa } from "execa";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, "../dist/cli.mjs");

const runCli = async (
  args: string[] = [],
  options: { env?: Record<string, string>; timeout?: number } = {}
) => {
  const result = await execa("node", [CLI_PATH, ...args], {
    env: { ...process.env, ...options.env },
    reject: false,
    timeout: options.timeout ?? 20000,
  });
  return {
    ...result,
    all: result.stdout + result.stderr,
  };
};

// ============================================================================
// UNIT TESTS - No database creation, tests CLI structure and help only
// ============================================================================

describe("CLI help and version", () => {
  it("displays help with --help flag", async () => {
    const result = await runCli(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.all).toContain("create-db");
    expect(result.all).toContain("Create a new Prisma Postgres database");
    expect(result.all).toContain("regions");
  });

  it("displays help with -h flag", async () => {
    const result = await runCli(["-h"]);
    expect(result.exitCode).toBe(0);
    expect(result.all).toContain("create-db");
  });

  it("displays version with --version flag", async () => {
    const result = await runCli(["--version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it("displays version with -V flag", async () => {
    const result = await runCli(["-V"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it("displays create command help", async () => {
    const result = await runCli(["create", "--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.all).toContain("--region");
    expect(result.all).toContain("--interactive");
    expect(result.all).toContain("--json");
    expect(result.all).toContain("--env");
    expect(result.all).toContain("--ttl");
    expect(result.all).toContain("--copy");
    expect(result.all).toContain("--quiet");
    expect(result.all).toContain("--open");
  });

  it("displays regions command help", async () => {
    const result = await runCli(["regions", "--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.all).toContain("List available Prisma Postgres regions");
    expect(result.all).toContain("--json");
  });
});

describe("CLI error handling", () => {
  it("fails with invalid region (no DB created)", async () => {
    const result = await runCli(["--region", "invalid-region"]);
    expect(result.exitCode).not.toBe(0);
  }, 10000);

  it("shows error for unknown command", async () => {
    const result = await runCli(["unknown-command"]);
    expect(result.exitCode).not.toBe(0);
  });

  it("shows error for unknown flag", async () => {
    const result = await runCli(["--unknown-flag"]);
    expect(result.exitCode).not.toBe(0);
  });
});
