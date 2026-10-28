import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  writeEnvFile,
  withOutputMode,
  formatJsonResult,
  printClaimReminder,
} from "../src/cli/output.js";
import type { DatabaseResult } from "../src/types.js";

describe("writeEnvFile", () => {
  let tempDir: string;
  let envFilePath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "output-test-"));
    envFilePath = path.join(tempDir, ".env");
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("creates new env file with DATABASE_URL and CLAIM_URL", () => {
    const result = writeEnvFile(
      envFilePath,
      "postgresql://user:pass@host:5432/db",
      "https://example.com/claim"
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(envFilePath)).toBe(true);

    const content = fs.readFileSync(envFilePath, "utf8");
    expect(content).toContain('DATABASE_URL="postgresql://user:pass@host:5432/db"');
    expect(content).toContain('CLAIM_URL="https://example.com/claim"');
  });

  it("handles null connectionString", () => {
    const result = writeEnvFile(envFilePath, null, "https://example.com/claim");

    expect(result.success).toBe(true);

    const content = fs.readFileSync(envFilePath, "utf8");
    expect(content).toContain('DATABASE_URL=""');
    expect(content).toContain('CLAIM_URL="https://example.com/claim"');
  });

  it("appends to existing file with trailing newline", () => {
    fs.writeFileSync(envFilePath, "EXISTING=value\n");

    const result = writeEnvFile(
      envFilePath,
      "postgresql://test",
      "https://claim"
    );

    expect(result.success).toBe(true);

    const content = fs.readFileSync(envFilePath, "utf8");
    expect(content).toBe(
      'EXISTING=value\nDATABASE_URL="postgresql://test"\nCLAIM_URL="https://claim"\n'
    );
  });

  it("appends newline prefix when existing file lacks trailing newline", () => {
    fs.writeFileSync(envFilePath, "EXISTING=value");

    const result = writeEnvFile(
      envFilePath,
      "postgresql://test",
      "https://claim"
    );

    expect(result.success).toBe(true);

    const content = fs.readFileSync(envFilePath, "utf8");
    expect(content).toBe(
      'EXISTING=value\nDATABASE_URL="postgresql://test"\nCLAIM_URL="https://claim"\n'
    );
  });

  it("handles empty existing file", () => {
    fs.writeFileSync(envFilePath, "");

    const result = writeEnvFile(
      envFilePath,
      "postgresql://test",
      "https://claim"
    );

    expect(result.success).toBe(true);

    const content = fs.readFileSync(envFilePath, "utf8");
    expect(content).toBe('DATABASE_URL="postgresql://test"\nCLAIM_URL="https://claim"\n');
  });

  it("returns error for invalid path", () => {
    const invalidPath = path.join(tempDir, "nonexistent", "deep", "path", ".env");

    const result = writeEnvFile(
      invalidPath,
      "postgresql://test",
      "https://claim"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe("string");
    }
  });

  it.skipIf(process.platform === "win32")("returns error for read-only directory", () => {
    const readOnlyDir = path.join(tempDir, "readonly");
    fs.mkdirSync(readOnlyDir);
    fs.chmodSync(readOnlyDir, 0o444);

    const readOnlyPath = path.join(readOnlyDir, ".env");
    const result = writeEnvFile(
      readOnlyPath,
      "postgresql://test",
      "https://claim"
    );

    // Restore permissions for cleanup
    fs.chmodSync(readOnlyDir, 0o755);

    expect(result.success).toBe(false);
  });

  it("preserves special characters in connection string", () => {
    const connectionString = "postgresql://user:p@ss=word!@host:5432/db?ssl=true";
    
    const result = writeEnvFile(
      envFilePath,
      connectionString,
      "https://claim"
    );

    expect(result.success).toBe(true);

    const content = fs.readFileSync(envFilePath, "utf8");
    expect(content).toContain(`DATABASE_URL="${connectionString}"`);
  });
});

const sampleResult: DatabaseResult = {
  success: true,
  connectionString: "postgresql://user:pass@host:5432/postgres",
  claimUrl:
    "https://create-db.prisma.io/claim?projectID=proj_123&utm_source=create-db&utm_medium=cli",
  deletionDate: "2026-10-29T12:00:00.000Z",
  region: "us-east-1",
  name: "2026-10-28T12:00:00.000Z",
  projectId: "proj_123",
};

describe("withOutputMode", () => {
  it("appends the output mode to the claim URL as utm_content", () => {
    const tagged = withOutputMode(sampleResult, "json");
    expect(tagged.claimUrl).toBe(`${sampleResult.claimUrl}&utm_content=json`);
    expect(new URL(tagged.claimUrl).searchParams.get("projectID")).toBe("proj_123");
  });

  it("leaves the input result unchanged", () => {
    withOutputMode(sampleResult, "quiet");
    expect(sampleResult.claimUrl).not.toContain("utm_content");
  });
});

describe("formatJsonResult", () => {
  it("keeps every result field and adds a nextStep with the claim URL and deletion time", () => {
    const json = formatJsonResult(sampleResult);
    expect(json).toMatchObject(sampleResult);
    expect(json.nextStep).toContain(sampleResult.claimUrl);
    expect(json.nextStep).toContain(sampleResult.deletionDate);
    expect(json.nextStep.endsWith(sampleResult.claimUrl)).toBe(true);
  });
});

describe("printClaimReminder", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints the claim URL to stdout by default", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    printClaimReminder(sampleResult);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain(sampleResult.claimUrl);
    expect(error).not.toHaveBeenCalled();
  });

  it("prints to stderr when asked, keeping stdout clean", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    printClaimReminder(sampleResult, "stderr");
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toContain(sampleResult.claimUrl);
    expect(log).not.toHaveBeenCalled();
  });
});
