import { describe, it, expect } from "vitest";
import { CreateFlags, type CreateFlagsInput } from "../src/cli/flags.js";
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
        expect(result.data.userAgent).toBeUndefined();
      }
    });
  });

  describe("type inference", () => {
    it("CreateFlagsInput type matches schema output", () => {
      const input: CreateFlagsInput = {
        region: "us-east-1",
        interactive: false,
        json: true,
        env: ".env",
        userAgent: "test/1.0",
      };

      const result = CreateFlags.parse(input);
      expect(result.region).toBe(input.region);
      expect(result.interactive).toBe(input.interactive);
      expect(result.json).toBe(input.json);
      expect(result.env).toBe(input.env);
      expect(result.userAgent).toBe(input.userAgent);
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
