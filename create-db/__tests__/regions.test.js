import { describe, it, expect, vi } from "vitest";
import {
  validateRegion,
  getRegions,
  getRegionClosestToLocation,
} from "../index.js";

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        { id: "eu-central-1", name: "Frankfurt", status: "available" },
        { id: "us-east-1", name: "N. Virginia", status: "available" },
        { id: "ap-southeast-1", name: "Singapore", status: "available" },
      ]),
  })
);

describe("regions", () => {
  describe("validateRegion()", () => {
    it("validates existing regions", async () => {
      expect(await validateRegion("eu-central-1", true)).toBe("eu-central-1");
      expect(await validateRegion("us-east-1", true)).toBe("us-east-1");
      expect(await validateRegion("ap-southeast-1", true)).toBe(
        "ap-southeast-1"
      );
    });

    it("rejects invalid regions", async () => {
      await expect(validateRegion("invalid-region", true)).rejects.toThrow();
      await expect(validateRegion("", true)).rejects.toThrow();
      await expect(validateRegion(null, true)).rejects.toThrow();
    });
  });

  describe("getRegions()", () => {
    it("returns available regions", async () => {
      const regions = await getRegions();
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBeGreaterThan(0);
      expect(regions[0]).toHaveProperty("id");
    });
  });

  describe("getRegionClosestToLocation()", () => {
    it("finds closest region", () => {
      const berlin = { latitude: 52.52, longitude: 13.405 };
      expect(getRegionClosestToLocation(berlin)).toBe("eu-central-1");
    });

    it("handles invalid input", () => {
      expect(getRegionClosestToLocation(null)).toBe(null);
      expect(getRegionClosestToLocation({})).toBe(null);
      expect(getRegionClosestToLocation({ lat: "invalid" })).toBe(null);
    });
  });
});
