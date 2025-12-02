import { describe, it, expect } from "vitest";
import { execa } from "execa";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, "../dist/cli.mjs");

const runCli = async (
  args: string[] = [],
  options: { env?: Record<string, string>;[key: string]: unknown } = {}
) => {
  const result = await execa("node", [CLI_PATH, ...args], {
    ...options,
    env: { ...process.env, ...options.env },
    reject: false,
    timeout: 20000,
  });
  // Combine stdout and stderr since clack outputs to stderr
  return {
    ...result,
    all: result.stdout + result.stderr,
  };
};

describe("CLI database creation", () => {
  it("creates database with default command", async () => {
    const result = await runCli([]);
    if (result.exitCode !== 0) {
      console.error("CLI failed with exit code:", result.exitCode);
      console.error("stdout:", result.stdout);
      console.error("stderr:", result.stderr);
    }
    expect(result.exitCode).toBe(0);
    // clack outputs to stderr, so check all output
    const allOutput = result.all || result.stdout + result.stderr;
    if (!allOutput.includes("Database created successfully!")) {
      console.error("All output:", allOutput);
    }
    expect(allOutput).toContain("Database created successfully!");
  }, 30000);

  it("creates database with --json flag", async () => {
    const result = await runCli(["--json"]);
    if (result.exitCode !== 0) {
      console.error("CLI failed with exit code:", result.exitCode);
      console.error("stdout:", result.stdout);
      console.error("stderr:", result.stderr);
    }
    expect(result.exitCode).toBe(0);
    // JSON should be in stdout
    expect(result.stdout).toBeTruthy();
    const trimmed = result.stdout.trim();
    if (!trimmed.match(/^\s*\{/)) {
      console.error("stdout doesn't start with JSON:", trimmed);
    }
    expect(trimmed).toMatch(/^\s*\{/);
    const parsed = JSON.parse(trimmed);
    expect(parsed).toHaveProperty("success");
    expect(parsed).toHaveProperty("connectionString");
    expect(parsed).toHaveProperty("claimUrl");
    expect(parsed.success).toBe(true);
  }, 30000);

  it("lists regions with regions command", async () => {
    const result = await runCli(["regions"]);
    if (result.exitCode !== 0) {
      console.error("CLI failed with exit code:", result.exitCode);
      console.error("stdout:", result.stdout);
      console.error("stderr:", result.stderr);
    }
    expect(result.exitCode).toBe(0);
    // clack outputs to stderr
    const allOutput = result.all || result.stdout + result.stderr;
    if (!allOutput.includes("Available Prisma Postgres regions")) {
      console.error("All output:", allOutput);
    }
    expect(allOutput).toContain("Available Prisma Postgres regions");
  }, 20000);
});
