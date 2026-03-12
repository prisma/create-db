import { describe, it, expect } from "vitest";
import { fetchRegions } from "../src/core/services.js";

// These tests hit the real API but do NOT create databases
// Set RUN_INTEGRATION_TESTS=true to run these tests

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";

describe.skipIf(!runIntegration)("services (integration)", () => {
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
      
      // Optionally check for a specific region if EXPECTED_REGION is set
      const expectedRegion = process.env.EXPECTED_REGION;
      if (expectedRegion) {
        const regionIds = regions.map((r) => r.id);
        expect(regionIds).toContain(expectedRegion);
      }
    }, 10000);
  });
});
