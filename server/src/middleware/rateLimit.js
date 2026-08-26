/**
 * Minimal in-memory per-IP sliding-window rate limiter. There is no Redis or
 * other shared cache layer anywhere in this repository (see
 * utils/simpleCache.js), so this is deliberately the simplest thing that
 * protects a publicly reachable, provider-billed endpoint like the AI
 * Advisor -- process-local, reset on restart, and not shared across
 * multiple server instances. That is an accepted limitation for this
 * prototype, not a production-grade rate limiter.
 */
export function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map(); // ip -> array of request timestamps within the window

  return function rateLimit(req, res, next) {
    const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;

    const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart);

    if (recent.length >= max) {
      res.status(429).json({
        success: false,
        error: { message: message ?? "Too many requests. Please wait a moment and try again." },
      });
      return;
    }

    recent.push(now);
    hits.set(ip, recent);

    // Lazily bound memory growth: once the map gets large, drop entries
    // that have aged out of every realistic window instead of running a
    // separate cleanup timer for a prototype-scale limiter.
    if (hits.size > 5000) {
      for (const [key, timestamps] of hits) {
        if (timestamps.every((t) => t <= windowStart)) hits.delete(key);
      }
    }

    next();
  };
}
