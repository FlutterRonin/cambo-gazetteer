import { cache } from "hono/cache";
import { isSameOriginRequest } from "~/utils/request-policy";

// Keep every parameter that affects the response; ignore cache-busting extras.
const CACHE_PARAMS: Record<string, readonly string[]> = {
  provinces: ["page", "limit"],
  districts: ["province", "page", "limit"],
  communes: ["district", "page", "limit"],
  villages: ["commune", "page", "limit"],
  code: [],
  stats: [],
  "stats-detail": [],
  lookup: ["lat", "lng"],
  search: ["q", "page", "limit"],
  autocomplete: ["q"],
};

export function cacheKey(requestUrl: string, name: string): string {
  const url = new URL(requestUrl);
  const allowed = CACHE_PARAMS[name];
  if (allowed) {
    const params = new URLSearchParams();
    for (const key of allowed) {
      const value = url.searchParams.get(key);
      // Preserve raw values: invalid inputs must not hit a valid response.
      if (value !== null) params.set(key, value);
    }
    url.search = params.toString();
  }
  url.searchParams.sort();
  return url.toString();
}

export const addCache = (
  name: string,
  time: "5min" | "1hr" | "4hr" | "12hr",
) => {
  const ttl = { "5min": 300, "1hr": 3600, "4hr": 14400, "12hr": 43200 };
  return cache({
    cacheName: (c) => {
      const variesByOrigin = ["provinces", "districts", "communes", "villages"].includes(name);
      const audience = variesByOrigin ? (isSameOriginRequest(c) ? "site" : "external") : "shared";
      return `${name}-v4-${audience}`;
    },
    vary: ["Origin", "Sec-Fetch-Site"],
    // Workers Cache API does not support stale-while-revalidate.
    cacheControl: `public, max-age=${ttl[time]}`,
    keyGenerator: (c) => cacheKey(c.req.url, name),
  });
};

export const addSearchCache = (name: string) => addCache(name, "1hr");
