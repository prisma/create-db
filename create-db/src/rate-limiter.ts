/**
 * Simple in-memory rate limiter for database creation
 * Security feature - always enabled with fixed limits
 */

interface RequestRecord {
  timestamp: number;
}

// Fixed configuration for security
const MAX_REQUESTS = 5;
const WINDOW_MS = 60000; // 1 minute

class RateLimiter {
  private requests: RequestRecord[] = [];

  /**
   * Check if a new request is allowed under the rate limit
   * @returns true if allowed, false if rate limit exceeded
   */
  checkLimit(): boolean {
    const now = Date.now();

    // Remove expired requests outside the time window
    this.requests = this.requests.filter(
      (record) => now - record.timestamp < WINDOW_MS
    );

    // Check if we've exceeded the limit
    if (this.requests.length >= MAX_REQUESTS) {
      return false;
    }

    // Add this request to the tracking
    this.requests.push({ timestamp: now });
    return true;
  }

  /**
   * Get the time in milliseconds until the rate limit resets
   */
  getTimeUntilReset(): number {
    if (this.requests.length === 0) {
      return 0;
    }

    const oldestRequest = this.requests[0];
    if (!oldestRequest) {
      return 0;
    }

    const timeSinceOldest = Date.now() - oldestRequest.timestamp;
    const timeUntilReset = WINDOW_MS - timeSinceOldest;

    return Math.max(0, timeUntilReset);
  }

  /**
   * Get the current number of requests in the window
   */
  getCurrentCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      (record) => now - record.timestamp < WINDOW_MS
    );
    return this.requests.length;
  }

  /**
   * Get the current configuration (read-only)
   * @internal
   */
  getConfig(): { maxRequests: number; windowMs: number } {
    return {
      maxRequests: MAX_REQUESTS,
      windowMs: WINDOW_MS,
    };
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter();

export { globalRateLimiter };
