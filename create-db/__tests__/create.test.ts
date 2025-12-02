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
  return execa("node", [CLI_PATH, ...args], {
    ...options,
    env: { ...process.env, ...options.env },
    reject: false,
    timeout: 15000,
  });
};

describe("CLI database creation", () => {
  it("creates database with default command", async () => {
    const { stdout } = await runCli([]);
    expect(stdout).toContain("Database created successfully!");
  }, 20000);

  it("creates database with --json flag", async () => {
    const { stdout } = await runCli(["--json"]);
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("connectionString");
    expect(result).toHaveProperty("claimUrl");
  }, 20000);

  it("lists regions with regions command", async () => {
    const { stdout } = await runCli(["regions"]);
    expect(stdout).toContain("Available Prisma Postgres regions");
  }, 20000);
});
