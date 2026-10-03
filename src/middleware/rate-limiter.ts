import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Creates an in-memory rate limiter middleware for public endpoints.
 * @param windowMs Time window in milliseconds (e.g. 10 minutes)
 * @param maxRequests Maximum requests allowed within window
 */
export function createRateLimiter(windowMs: number = 10 * 60 * 1000, maxRequests: number = 10) {
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-client';

    const now = Date.now();
    const existing = store.get(clientIp);

    if (!existing || now > existing.resetTime) {
      store.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: 'Too many survey submissions from this network. Please wait a moment before trying again.',
      });
    }

    existing.count += 1;
    return next();
  };
}
