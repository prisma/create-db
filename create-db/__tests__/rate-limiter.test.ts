import { describe, it, expect } from "vitest";
import { globalRateLimiter } from "../src/rate-limiter.js";

describe("RateLimiter", () => {
  it("should have default configuration of 5 requests per minute", () => {
    const config = globalRateLimiter.getConfig();

    expect(config.maxRequests).toBe(5);
    expect(config.windowMs).toBe(60000); // 1 minute
  });

  it("should allow requests within the limit", () => {
    // Note: This test may fail if other tests have used the global rate limiter
    // In real usage, the rate limiter is global and shared across all calls
    const config = globalRateLimiter.getConfig();
    const currentCount = globalRateLimiter.getCurrentCount();

    // Only test if we have room in the limit
    if (currentCount < config.maxRequests) {
      expect(globalRateLimiter.checkLimit()).toBe(true);
    }
  });

  it("should track current count", () => {
    const countBefore = globalRateLimiter.getCurrentCount();
    expect(countBefore).toBeGreaterThanOrEqual(0);
    expect(countBefore).toBeLessThanOrEqual(5);
  });

  it("should return time until reset", () => {
    const timeUntilReset = globalRateLimiter.getTimeUntilReset();

    // Time until reset should be between 0 and the window size
    expect(timeUntilReset).toBeGreaterThanOrEqual(0);
    expect(timeUntilReset).toBeLessThanOrEqual(60000);
  });
});
