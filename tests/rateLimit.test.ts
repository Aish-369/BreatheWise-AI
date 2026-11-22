import { describe, expect, it } from 'vitest';
import { FixedWindowRateLimiter } from '../src/server/rateLimit';

describe('FixedWindowRateLimiter', () => {
  it('allows the configured number of requests and rejects the next request', () => {
    const limiter = new FixedWindowRateLimiter(2, 60_000);

    expect(limiter.consume('client-a', 1_000)).toMatchObject({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    });
    expect(limiter.consume('client-a', 2_000)).toMatchObject({
      allowed: true,
      remaining: 0,
    });
    expect(limiter.consume('client-a', 3_000)).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 58,
    });
  });

  it('isolates clients and resets expired windows', () => {
    const limiter = new FixedWindowRateLimiter(1, 10_000);

    expect(limiter.consume('client-a', 1_000).allowed).toBe(true);
    expect(limiter.consume('client-b', 1_000).allowed).toBe(true);
    expect(limiter.consume('client-a', 2_000).allowed).toBe(false);
    expect(limiter.consume('client-a', 11_000).allowed).toBe(true);
  });

  it('validates its configuration', () => {
    expect(() => new FixedWindowRateLimiter(0, 60_000)).toThrow();
    expect(() => new FixedWindowRateLimiter(1, 999)).toThrow();
  });
});
