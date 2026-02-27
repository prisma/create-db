import { describe, it, expect } from "vitest";
import {
  CreateFlags,
  RegionsFlags,
  type CreateFlagsInput,
  type RegionsFlagsInput,
} from "../src/cli/flags.js";
import { RegionSchema } from "../src/types.js";

describe("CreateFlags schema", () => {
  describe("region field", () => {
    it("accepts valid region IDs", () => {
      const validRegions = [
        "us-east-1",
        "us-west-1",
        "eu-central-1",
        "eu-west-3",
        "ap-southeast-1",
        "ap-northeast-1",
      ];

      for (const region of validRegions) {
        const result = CreateFlags.safeParse({ region });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.region).toBe(region);
        }
      }
    });

    it("rejects invalid region IDs", () => {
      const result = CreateFlags.safeParse({ region: "invalid-region" });
      expect(result.success).toBe(false);
    });

    it("allows undefined region", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.region).toBeUndefined();
      }
    });
  });

  describe("interactive field", () => {
    it("defaults to false", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interactive).toBe(false);
      }
    });

    it("accepts true", () => {
      const result = CreateFlags.safeParse({ interactive: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interactive).toBe(true);
      }
    });

    it("accepts false", () => {
      const result = CreateFlags.safeParse({ interactive: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interactive).toBe(false);
      }
    });
  });

  describe("json field", () => {
    it("defaults to false", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.json).toBe(false);
      }
    });

    it("accepts true", () => {
      const result = CreateFlags.safeParse({ json: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.json).toBe(true);
      }
    });
  });

  describe("env field", () => {
    it("accepts string path", () => {
      const result = CreateFlags.safeParse({ env: ".env" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.env).toBe(".env");
      }
    });

    it("accepts full path", () => {
      const result = CreateFlags.safeParse({ env: "/path/to/.env.local" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.env).toBe("/path/to/.env.local");
      }
    });

    it("allows undefined", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.env).toBeUndefined();
      }
    });
  });

  describe("ttl field", () => {
    it("accepts valid ttl strings", () => {
      const validTtls = [
        { input: "30m", expectedMs: 1_800_000 },
        { input: "1h", expectedMs: 3_600_000 },
        { input: "6h", expectedMs: 21_600_000 },
        { input: "12h", expectedMs: 43_200_000 },
        { input: "24h", expectedMs: 86_400_000 },
      ];

      for (const { input, expectedMs } of validTtls) {
        const result = CreateFlags.safeParse({ ttl: input });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.ttl).toBe(expectedMs);
        }
      }
    });

    it("rejects invalid ttl strings", () => {
      const ttlInputs = ["25h", "7d", "10s", "45s", "one-hour", "24"];

      for (const ttl of ttlInputs) {
        const result = CreateFlags.safeParse({ ttl });
        expect(result.success).toBe(false);
      }
    });

    it("rejects missing ttl values", () => {
      const result = CreateFlags.safeParse({ ttl: true });
      expect(result.success).toBe(false);
    });

    it("allows undefined", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ttl).toBeUndefined();
      }
    });
  });

  describe("copy field", () => {
    it("defaults to false", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.copy).toBe(false);
      }
    });

    it("accepts true", () => {
      const result = CreateFlags.safeParse({ copy: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.copy).toBe(true);
      }
    });
  });

  describe("quiet field", () => {
    it("defaults to false", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quiet).toBe(false);
      }
    });

    it("accepts true", () => {
      const result = CreateFlags.safeParse({ quiet: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quiet).toBe(true);
      }
    });
  });

  describe("open field", () => {
    it("defaults to false", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.open).toBe(false);
      }
    });

    it("accepts true", () => {
      const result = CreateFlags.safeParse({ open: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.open).toBe(true);
      }
    });
  });

  describe("userAgent field", () => {
    it("accepts custom user agent string", () => {
      const result = CreateFlags.safeParse({ userAgent: "myapp/1.0.0" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userAgent).toBe("myapp/1.0.0");
      }
    });

    it("allows undefined", () => {
      const result = CreateFlags.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userAgent).toBeUndefined();
      }
    });
  });

  describe("combined fields", () => {
    it("parses all fields together", () => {
      const input = {
        region: "eu-central-1",
        interactive: true,
        json: false,
        env: ".env.local",
        ttl: "12h",
        copy: true,
        quiet: false,
        open: true,
        userAgent: "test/2.0.0",
      };

      const result = CreateFlags.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          region: "eu-central-1",
          interactive: true,
          json: false,
          env: ".env.local",
          ttl: 43_200_000,
          copy: true,
          quiet: false,
          open: true,
          userAgent: "test/2.0.0",
        });
      }
    });

    it("applies defaults for missing optional fields", () => {
      const result = CreateFlags.safeParse({ region: "us-east-1" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.region).toBe("us-east-1");
        expect(result.data.interactive).toBe(false);
        expect(result.data.json).toBe(false);
        expect(result.data.env).toBeUndefined();
        expect(result.data.ttl).toBeUndefined();
        expect(result.data.copy).toBe(false);
        expect(result.data.quiet).toBe(false);
        expect(result.data.open).toBe(false);
        expect(result.data.userAgent).toBeUndefined();
      }
    });
  });

  describe("type inference", () => {
    it("CreateFlagsInput type matches schema output", () => {
      const result = CreateFlags.parse({
        region: "us-east-1",
        interactive: false,
        json: true,
        env: ".env",
        ttl: "24h",
        copy: true,
        quiet: false,
        open: true,
        userAgent: "test/1.0",
      });

      const typedResult: CreateFlagsInput = result;
      expect(typedResult.region).toBe("us-east-1");
      expect(typedResult.interactive).toBe(false);
      expect(typedResult.json).toBe(true);
      expect(typedResult.env).toBe(".env");
      expect(typedResult.ttl).toBe(86_400_000);
      expect(typedResult.copy).toBe(true);
      expect(typedResult.quiet).toBe(false);
      expect(typedResult.open).toBe(true);
      expect(typedResult.userAgent).toBe("test/1.0");
    });
  });
});

describe("RegionSchema", () => {
  it("validates all supported regions", () => {
    const regions = [
      "us-east-1",
      "us-west-1",
      "eu-central-1",
      "eu-west-3",
      "ap-southeast-1",
      "ap-northeast-1",
    ];

    for (const region of regions) {
      expect(RegionSchema.safeParse(region).success).toBe(true);
    }
  });

  it("rejects unsupported regions", () => {
    const invalidRegions = [
      "us-east-2",
      "eu-west-1",
      "ap-south-1",
      "sa-east-1",
      "",
      "invalid",
    ];

    for (const region of invalidRegions) {
      expect(RegionSchema.safeParse(region).success).toBe(false);
    }
  });

  it("rejects non-string values", () => {
    expect(RegionSchema.safeParse(123).success).toBe(false);
    expect(RegionSchema.safeParse(null).success).toBe(false);
    expect(RegionSchema.safeParse(undefined).success).toBe(false);
    expect(RegionSchema.safeParse({}).success).toBe(false);
  });
});

describe("RegionsFlags schema", () => {
  it("defaults json to false", () => {
    const result = RegionsFlags.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.json).toBe(false);
    }
  });

  it("accepts json=true", () => {
    const result = RegionsFlags.safeParse({ json: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.json).toBe(true);
    }
  });

  it("infers RegionsFlagsInput correctly", () => {
    const input: RegionsFlagsInput = { json: true };
    const result = RegionsFlags.parse(input);
    expect(result.json).toBe(true);
  });
});
