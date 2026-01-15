import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { writeEnvFile } from "../src/cli/output.js";

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

  it("returns error for read-only directory", () => {
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
