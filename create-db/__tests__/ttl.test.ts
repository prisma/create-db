import { describe, it, expect } from "vitest";
import { parseTtlToMilliseconds } from "../src/utils/ttl.js";

describe("parseTtlToMilliseconds", () => {
  it("parses supported ttl values", () => {
    expect(parseTtlToMilliseconds("30m")).toBe(1_800_000);
    expect(parseTtlToMilliseconds("1h")).toBe(3_600_000);
    expect(parseTtlToMilliseconds("6h")).toBe(21_600_000);
    expect(parseTtlToMilliseconds("24h")).toBe(86_400_000);
  });

  it("is case-insensitive", () => {
    expect(parseTtlToMilliseconds("30M")).toBe(1_800_000);
    expect(parseTtlToMilliseconds("2H")).toBe(7_200_000);
    expect(parseTtlToMilliseconds("24H")).toBe(86_400_000);
  });

  it("rejects values outside the allowed range", () => {
    expect(parseTtlToMilliseconds("")).toBeNull();
    expect(parseTtlToMilliseconds("0h")).toBeNull();
    expect(parseTtlToMilliseconds("9s")).toBeNull();
    expect(parseTtlToMilliseconds("10s")).toBeNull();
    expect(parseTtlToMilliseconds("45s")).toBeNull();
    expect(parseTtlToMilliseconds("1d")).toBeNull();
    expect(parseTtlToMilliseconds("25h")).toBeNull();
    expect(parseTtlToMilliseconds("7d")).toBeNull();
    expect(parseTtlToMilliseconds("abc")).toBeNull();
  });
});
