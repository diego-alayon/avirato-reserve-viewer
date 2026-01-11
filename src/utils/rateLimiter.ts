/**
 * Rate Limiter for Last.app API
 *
 * Enforces API rate limits:
 * - 1500 requests per 10 minutes (600 seconds)
 * - 15 requests per second per entity
 *
 * Usage:
 * ```typescript
 * const rateLimiter = new RateLimiter({
 *   maxRequestsPer10Min: 1500,
 *   maxRequestsPerSecond: 15
 * });
 *
 * await rateLimiter.waitForSlot(); // Wait for available slot
 * // Make API request here
 * ```
 */

import type { RateLimiterConfig, RateLimiterStatus } from '@/types/lastapp.types';

export class RateLimiter {
  private requestTimestamps: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig = {
    maxRequestsPer10Min: 1500,
    maxRequestsPerSecond: 15
  }) {
    this.config = config;
  }

  /**
   * Wait until a request slot is available
   * Returns a promise that resolves when it's safe to make a request
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Clean up old timestamps (older than 10 minutes)
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 600000 // 10 minutes in milliseconds
    );

    // Check 10-minute limit
    if (this.requestTimestamps.length >= this.config.maxRequestsPer10Min) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = 600000 - (now - oldestTimestamp);

      if (waitTime > 0) {
        console.warn(
          `[RateLimiter] 10-minute limit reached (${this.requestTimestamps.length}/${this.config.maxRequestsPer10Min}). ` +
          `Waiting ${Math.ceil(waitTime / 1000)}s...`
        );
        await this.sleep(waitTime);
      }
    }

    // Check per-second limit
    const lastSecondRequests = this.requestTimestamps.filter(
      timestamp => now - timestamp < 1000
    );

    if (lastSecondRequests.length >= this.config.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - lastSecondRequests[0]);

      if (waitTime > 0) {
        console.warn(
          `[RateLimiter] Per-second limit reached (${lastSecondRequests.length}/${this.config.maxRequestsPerSecond}). ` +
          `Waiting ${waitTime}ms...`
        );
        await this.sleep(waitTime);
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimiterStatus {
    const now = Date.now();

    const last10Min = this.requestTimestamps.filter(ts => now - ts < 600000);
    const lastSecond = this.requestTimestamps.filter(ts => now - ts < 1000);

    return {
      requestsLast10Min: last10Min.length,
      requestsLastSecond: lastSecond.length,
      available10Min: this.config.maxRequestsPer10Min - last10Min.length,
      availablePerSecond: this.config.maxRequestsPerSecond - lastSecond.length
    };
  }

  /**
   * Reset all tracked timestamps
   */
  reset(): void {
    this.requestTimestamps = [];
  }

  /**
   * Check if a request can be made without waiting
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    const last10Min = this.requestTimestamps.filter(ts => now - ts < 600000);
    const lastSecond = this.requestTimestamps.filter(ts => now - ts < 1000);

    return (
      last10Min.length < this.config.maxRequestsPer10Min &&
      lastSecond.length < this.config.maxRequestsPerSecond
    );
  }

  /**
   * Get estimated wait time in milliseconds
   */
  getEstimatedWaitTime(): number {
    const now = Date.now();

    // Check 10-minute limit
    const last10Min = this.requestTimestamps.filter(ts => now - ts < 600000);
    if (last10Min.length >= this.config.maxRequestsPer10Min) {
      const oldestTimestamp = last10Min[0];
      return Math.max(0, 600000 - (now - oldestTimestamp));
    }

    // Check per-second limit
    const lastSecond = this.requestTimestamps.filter(ts => now - ts < 1000);
    if (lastSecond.length >= this.config.maxRequestsPerSecond) {
      return Math.max(0, 1000 - (now - lastSecond[0]));
    }

    return 0;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log current status (for debugging)
   */
  logStatus(): void {
    // Method kept for backward compatibility but does nothing in production
  }
}

/**
 * Create a default rate limiter instance for Last.app
 */
export const createLastAppRateLimiter = (): RateLimiter => {
  return new RateLimiter({
    maxRequestsPer10Min: 1500,
    maxRequestsPerSecond: 15
  });
};

export default RateLimiter;
