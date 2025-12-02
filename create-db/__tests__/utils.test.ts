import { describe, it, expect } from "vitest";
import {
  isDatabaseError,
  isDatabaseSuccess,
  type CreateDatabaseResult,
} from "../src/index.js";

describe("type guards", () => {
  describe("isDatabaseError()", () => {
    it("returns true for error results", () => {
      const error: CreateDatabaseResult = {
        success: false,
        error: "api_error",
        message: "Something went wrong",
      };
      expect(isDatabaseError(error)).toBe(true);
      expect(isDatabaseSuccess(error)).toBe(false);
    });
  });

  describe("isDatabaseSuccess()", () => {
    it("returns true for success results", () => {
      const success: CreateDatabaseResult = {
        success: true,
        connectionString: "postgresql://...",
        claimUrl: "https://...",
        deletionDate: "2025-01-01",
        region: "us-east-1",
        name: "test-db",
        projectId: "proj_123",
      };
      expect(isDatabaseSuccess(success)).toBe(true);
      expect(isDatabaseError(success)).toBe(false);
    });
  });
});
