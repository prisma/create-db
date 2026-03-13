import { describe, it, expect } from "vitest";
import { regions, RegionSchema } from "../src/index.js";

describe("programmatic regions API", () => {
  it("returns available regions", async () => {
    const result = await regions();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("status");
  }, 10000);

  it("all regions have expected properties", async () => {
    const result = await regions();
    for (const region of result) {
      expect(region).toHaveProperty("id");
      expect(typeof region.id).toBe("string");
      expect(region).toHaveProperty("status");
    }
  }, 10000);
});

describe("RegionSchema", () => {
  it("validates valid region IDs", () => {
    expect(RegionSchema.safeParse("us-east-1").success).toBe(true);
    expect(RegionSchema.safeParse("eu-central-1").success).toBe(true);
    expect(RegionSchema.safeParse("ap-southeast-1").success).toBe(true);
  });

  it("rejects invalid region IDs", () => {
    expect(RegionSchema.safeParse("invalid-region").success).toBe(false);
    expect(RegionSchema.safeParse("").success).toBe(false);
    expect(RegionSchema.safeParse(123).success).toBe(false);
  });
});
