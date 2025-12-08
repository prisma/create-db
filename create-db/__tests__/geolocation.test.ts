import { describe, it, expect } from "vitest";
import { execa } from "execa";
import {
  calculateHaversineDistance,
  getRegionClosestToLocation,
  REGION_COORDINATES,
} from "../src/geolocation.js";

describe("calculateHaversineDistance", () => {
  it("calculates distance between two points", () => {
    // Distance from New York to Los Angeles (approximately 3944 km)
    const distance = calculateHaversineDistance(
      40.7128,
      -74.006, // New York
      34.0522,
      -118.2437 // Los Angeles
    );
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  it("returns 0 for same location", () => {
    const distance = calculateHaversineDistance(
      35.6762,
      139.6503,
      35.6762,
      139.6503
    );
    expect(distance).toBe(0);
  });
});

describe("getRegionClosestToLocation", () => {
  it("selects ap-southeast-1 for Singapore coordinates", () => {
    const region = getRegionClosestToLocation({
      latitude: 1.3521,
      longitude: 103.8198,
    });
    expect(region).toBe("ap-southeast-1");
  });

  it("selects ap-northeast-1 for Tokyo coordinates", () => {
    const region = getRegionClosestToLocation({
      latitude: 35.6762,
      longitude: 139.6503,
    });
    expect(region).toBe("ap-northeast-1");
  });

  it("selects eu-central-1 for Frankfurt coordinates", () => {
    const region = getRegionClosestToLocation({
      latitude: 50.1109,
      longitude: 8.6821,
    });
    expect(region).toBe("eu-central-1");
  });

  it("selects eu-west-3 for Paris coordinates", () => {
    const region = getRegionClosestToLocation({
      latitude: 48.8566,
      longitude: 2.3522,
    });
    expect(region).toBe("eu-west-3");
  });

  it("selects us-east-1 for Virginia coordinates", () => {
    const region = getRegionClosestToLocation({
      latitude: 38.9072,
      longitude: -77.0369,
    });
    expect(region).toBe("us-east-1");
  });

  it("selects us-west-1 for California coordinates", () => {
    const region = getRegionClosestToLocation({
      latitude: 37.7749,
      longitude: -122.4194,
    });
    expect(region).toBe("us-west-1");
  });

  it("selects closest region for location between regions", () => {
    // London coordinates - should be closest to eu-central-1 or eu-west-3
    const region = getRegionClosestToLocation({
      latitude: 51.5074,
      longitude: -0.1278,
    });
    expect(region).toMatch(/^eu-(central-1|west-3)$/);
  });

  it("handles string coordinates", () => {
    const region = getRegionClosestToLocation({
      latitude: "35.6762",
      longitude: "139.6503",
    });
    expect(region).toBe("ap-northeast-1");
  });

  it("returns null for invalid coordinates", () => {
    expect(getRegionClosestToLocation(null)).toBe(null);
    expect(
      getRegionClosestToLocation({ latitude: undefined, longitude: undefined })
    ).toBe(null);
    expect(
      getRegionClosestToLocation({ latitude: NaN, longitude: NaN })
    ).toBe(null);
    expect(
      getRegionClosestToLocation({ latitude: "invalid", longitude: "invalid" })
    ).toBe(null);
  });
});

describe("REGION_COORDINATES", () => {
  it("contains all expected regions", () => {
    const expectedRegions = [
      "ap-southeast-1",
      "ap-northeast-1",
      "eu-central-1",
      "eu-west-3",
      "us-east-1",
      "us-west-1",
    ];

    for (const region of expectedRegions) {
      expect(REGION_COORDINATES).toHaveProperty(region);
      expect(REGION_COORDINATES[region as keyof typeof REGION_COORDINATES]).toHaveProperty("lat");
      expect(REGION_COORDINATES[region as keyof typeof REGION_COORDINATES]).toHaveProperty("lng");
    }
  });

  it("has valid coordinate values", () => {
    for (const [regionId, coords] of Object.entries(REGION_COORDINATES)) {
      expect(coords.lat).toBeGreaterThanOrEqual(-90);
      expect(coords.lat).toBeLessThanOrEqual(90);
      expect(coords.lng).toBeGreaterThanOrEqual(-180);
      expect(coords.lng).toBeLessThanOrEqual(180);
    }
  });
});

describe("CLI database creation with explicit regions", () => {
  it("creates database in ap-southeast-1 (Singapore)", async () => {
    const { stdout } = await execa("node", ["./dist/cli.mjs", "create", "--region", "ap-southeast-1", "--json"]);
    const result = JSON.parse(stdout);

    expect(result.success).toBe(true);
    expect(result.region).toBe("ap-southeast-1");
    expect(result.connectionString).toBeTruthy();
    expect(result.claimUrl).toBeTruthy();
  }, 30000);

  it("creates database in ap-northeast-1 (Tokyo)", async () => {
    const { stdout } = await execa("node", ["./dist/cli.mjs", "create", "--region", "ap-northeast-1", "--json"]);
    const result = JSON.parse(stdout);

    expect(result.success).toBe(true);
    expect(result.region).toBe("ap-northeast-1");
    expect(result.connectionString).toBeTruthy();
    expect(result.claimUrl).toBeTruthy();
  }, 30000);

  it("creates database in eu-central-1 (Frankfurt)", async () => {
    const { stdout } = await execa("node", ["./dist/cli.mjs", "create", "--region", "eu-central-1", "--json"]);
    const result = JSON.parse(stdout);

    expect(result.success).toBe(true);
    expect(result.region).toBe("eu-central-1");
    expect(result.connectionString).toBeTruthy();
    expect(result.claimUrl).toBeTruthy();
  }, 30000);

  it("creates database in eu-west-3 (Paris)", async () => {
    const { stdout } = await execa("node", ["./dist/cli.mjs", "create", "--region", "eu-west-3", "--json"]);
    const result = JSON.parse(stdout);

    expect(result.success).toBe(true);
    expect(result.region).toBe("eu-west-3");
    expect(result.connectionString).toBeTruthy();
    expect(result.claimUrl).toBeTruthy();
  }, 30000);

  it("creates database in us-east-1 (Virginia)", async () => {
    const { stdout } = await execa("node", ["./dist/cli.mjs", "create", "--region", "us-east-1", "--json"]);
    const result = JSON.parse(stdout);

    expect(result.success).toBe(true);
    expect(result.region).toBe("us-east-1");
    expect(result.connectionString).toBeTruthy();
    expect(result.claimUrl).toBeTruthy();
  }, 30000);

  it("creates database in us-west-1 (California)", async () => {
    const { stdout } = await execa("node", ["./dist/cli.mjs", "create", "--region", "us-west-1", "--json"]);
    const result = JSON.parse(stdout);

    expect(result.success).toBe(true);
    expect(result.region).toBe("us-west-1");
    expect(result.connectionString).toBeTruthy();
    expect(result.claimUrl).toBeTruthy();
  }, 30000);
});
