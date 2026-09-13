import type { MiddlewareHandler } from "hono";
import { isSameOriginRequest } from "~/utils/request-policy";

type RateLimitBinding = "API_RATE_LIMITER" | "SEARCH_RATE_LIMITER" | "LOOKUP_RATE_LIMITER";

/** Native counters are shared within a Cloudflare location, without D1 writes. */
export function rateLimit(
  binding: RateLimitBinding = "API_RATE_LIMITER",
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") return next();

    // Keep the existing per-IP ceiling for every caller, including site requests.
    const ip = c.req.header("cf-connecting-ip") || "unknown";
    const { success } = await c.env[binding].limit({ key: `cambo-gazetteer:${ip}` });
    const externalSuccess = success && (binding !== "API_RATE_LIMITER" ||
      isSameOriginRequest(c) ||
      (await c.env.EXTERNAL_RATE_LIMITER.limit({ key: `cambo-gazetteer:${ip}` })).success);
    if (!externalSuccess) {
      c.header("Retry-After", "60");
      c.header("Cache-Control", "no-store");
      return c.json({ error: "Rate limit exceeded. Please retry in 60 seconds." }, 429);
    }
    return next();
  };
}
