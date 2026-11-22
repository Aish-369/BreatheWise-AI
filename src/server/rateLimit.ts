import type { RequestHandler } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number
  ) {
    if (!Number.isInteger(max) || max < 1) throw new Error('Rate limit max must be a positive integer.');
    if (!Number.isFinite(windowMs) || windowMs < 1000) throw new Error('Rate limit window must be at least one second.');
  }

  consume(key: string, now = Date.now()): RateLimitDecision {
    const normalizedKey = key.trim() || 'unknown';
    let bucket = this.buckets.get(normalizedKey);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(normalizedKey, bucket);
    }

    bucket.count += 1;

    // Opportunistically prune expired entries to bound memory without timers.
    if (this.buckets.size > 5000) {
      for (const [entryKey, entry] of this.buckets) {
        if (entry.resetAt <= now) this.buckets.delete(entryKey);
      }
    }

    const allowed = bucket.count <= this.max;
    return {
      allowed,
      remaining: Math.max(0, this.max - bucket.count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      resetAt: bucket.resetAt,
    };
  }
}

export function createRateLimitMiddleware(options: {
  windowMs: number;
  max: number;
  name: string;
}): RequestHandler {
  const limiter = new FixedWindowRateLimiter(options.max, options.windowMs);

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const decision = limiter.consume(key);
    res.setHeader('RateLimit-Policy', `${options.max};w=${Math.ceil(options.windowMs / 1000)}`);
    res.setHeader('RateLimit-Limit', String(options.max));
    res.setHeader('RateLimit-Remaining', String(decision.remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(decision.resetAt / 1000)));

    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds));
      res.status(429).json({
        error: 'Too many requests. Please wait before trying again.',
        code: 'RATE_LIMITED',
        scope: options.name,
        retryAfterSeconds: decision.retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
