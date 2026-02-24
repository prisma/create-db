import { describe, it, expect } from "vitest";
import { parseTtlToSeconds } from "../src/utils/ttl.js";

describe("parseTtlToSeconds", () => {
  it("parses supported ttl values", () => {
    expect(parseTtlToSeconds("30m")).toBe(1800);
    expect(parseTtlToSeconds("1h")).toBe(3600);
    expect(parseTtlToSeconds("6h")).toBe(21600);
    expect(parseTtlToSeconds("24h")).toBe(86400);
  });

  it("is case-insensitive", () => {
    expect(parseTtlToSeconds("2H")).toBe(7200);
    expect(parseTtlToSeconds("24H")).toBe(86400);
  });

  it("rejects values outside the allowed range", () => {
    expect(parseTtlToSeconds("")).toBeNull();
    expect(parseTtlToSeconds("0h")).toBeNull();
    expect(parseTtlToSeconds("25h")).toBeNull();
    expect(parseTtlToSeconds("7d")).toBeNull();
    expect(parseTtlToSeconds("45s")).toBeNull();
    expect(parseTtlToSeconds("abc")).toBeNull();
  });
});
