import { fuzzySearchCount } from "~/db/queries";
import type { DatabaseType } from "~/db";

/** Share exact totals across pages and caller types for one hour. Bump on dataset refresh. */
export async function getSearchCount(db: DatabaseType, query: string): Promise<number> {
  const key = new URL("https://cambo-gazetteer.internal/search-count");
  key.searchParams.set("q", query);
  let countCache: Cache | undefined;
  try {
    if (typeof caches !== "undefined") {
      countCache = await caches.open("search-counts-v1");
      const response = await countCache.match(key.toString());
      if (response) return await response.json<number>();
    }
  } catch (error) {
    console.error("Search count cache read failed", error);
  }
  const total = await fuzzySearchCount(db, query);
  if (countCache) {
    try {
      await countCache.put(key.toString(), Response.json(total, {
        headers: { "Cache-Control": "public, max-age=3600" },
      }));
    } catch (error) {
      console.error("Search count cache write failed", error);
    }
  }
  return total;
}
