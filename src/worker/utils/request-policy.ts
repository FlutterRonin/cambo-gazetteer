import type { Context } from "hono";

export const EXTERNAL_RESULT_LIMIT = 20;

/** Browser origin classification, not authentication: non-browser clients can spoof headers. */
export function isSameOriginRequest(c: Context): boolean {
  const origin = c.req.header("Origin");
  const fetchSite = c.req.header("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  if (origin !== undefined) return origin === new URL(c.req.url).origin;
  // Same-origin browser GET requests commonly omit Origin.
  return fetchSite === "same-origin";
}

export function getRequestMaxLimit(c: Context): number {
  return isSameOriginRequest(c) ? 100 : EXTERNAL_RESULT_LIMIT;
}
