import { describe, it, expect } from "vitest";
import { fetchRegions } from "../src/services.js";

// These tests hit the real API but do NOT create databases

describe("services", () => {
  describe("fetchRegions", () => {
    it("returns an array of regions with required properties", async () => {
      const regions = await fetchRegions();
      
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBeGreaterThan(0);
      
      // Check structure
      for (const region of regions) {
        expect(region).toHaveProperty("id");
        expect(region).toHaveProperty("status");
        expect(typeof region.id).toBe("string");
        expect(typeof region.status).toBe("string");
      }
      
      // Check known region exists
      const regionIds = regions.map((r) => r.id);
      expect(regionIds).toContain("us-east-1");
    }, 10000);
  });
});
