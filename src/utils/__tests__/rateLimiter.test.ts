import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter, createLastAppRateLimiter } from '@/utils/rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequestsPer10Min: 5,
      maxRequestsPerSecond: 2,
    });
  });

  it('starts with no requests tracked', () => {
    const status = limiter.getStatus();
    expect(status.requestsLast10Min).toBe(0);
    expect(status.requestsLastSecond).toBe(0);
    expect(status.available10Min).toBe(5);
    expect(status.availablePerSecond).toBe(2);
  });

  it('canMakeRequest returns true when under limits', () => {
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('tracks requests after waitForSlot', async () => {
    await limiter.waitForSlot();
    const status = limiter.getStatus();
    expect(status.requestsLast10Min).toBe(1);
  });

  it('reset clears all tracked timestamps', async () => {
    await limiter.waitForSlot();
    await limiter.waitForSlot();
    limiter.reset();
    const status = limiter.getStatus();
    expect(status.requestsLast10Min).toBe(0);
  });

  it('getEstimatedWaitTime returns 0 when under limits', () => {
    expect(limiter.getEstimatedWaitTime()).toBe(0);
  });

  it('canMakeRequest returns false after reaching per-second limit', async () => {
    // Fill up per-second limit (2 requests)
    await limiter.waitForSlot();
    await limiter.waitForSlot();
    expect(limiter.canMakeRequest()).toBe(false);
  });

  it('getEstimatedWaitTime returns >0 when per-second limit reached', async () => {
    await limiter.waitForSlot();
    await limiter.waitForSlot();
    const waitTime = limiter.getEstimatedWaitTime();
    expect(waitTime).toBeGreaterThan(0);
    expect(waitTime).toBeLessThanOrEqual(1000);
  });
});

describe('createLastAppRateLimiter', () => {
  it('creates a limiter with Last.app default config', () => {
    const limiter = createLastAppRateLimiter();
    const status = limiter.getStatus();
    expect(status.available10Min).toBe(1500);
    expect(status.availablePerSecond).toBe(15);
  });
});
