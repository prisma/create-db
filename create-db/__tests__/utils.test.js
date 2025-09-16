import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCommandName } from "../index.js";

describe("utils", () => {
  describe("getCommandName()", () => {
    const originalArgv = process.argv;

    beforeEach(() => {
      vi.resetModules();
      process.argv = [...originalArgv];
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it("detects create-db command", () => {
      process.argv[1] = "../index.js";
      expect(getCommandName()).toBe("create-db");
    });

    it("detects create-pg command", () => {
      process.argv[1] = "../../create-pg/index.js";
      expect(getCommandName()).toBe("create-pg");
    });

    it("detects create-postgres command", () => {
      process.argv[1] = "../../create-postgres/index.js";
      expect(getCommandName()).toBe("create-postgres");
    });
  });
});
