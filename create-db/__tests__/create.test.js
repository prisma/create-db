import { describe, it, expect } from "vitest";
import { execa } from "execa";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, "../index.js");

const runCli = async (args = [], options = {}) => {
  return execa("node", [CLI_PATH, ...args], {
    ...options,
    env: { ...process.env, ...options.env },
    reject: false,
    timeout: 15000, // 15 second timeout
  });
};

describe("database creation", () => {
  ["create-db", "create-postgres", "create-pg"].forEach((command) => {
    it(`creates database with ${command}`, async () => {
      const { stdout } = await runCli([], {
        env: {
          ...process.env,
          npm_package_name: command,
        },
      });

      expect(stdout).toContain("Database created successfully!");
    }, 20000);
  });
});
