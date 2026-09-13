import { Type, type AdministrativeUnit } from "@/types";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};
export type PageResponse<T> = { data: T[]; pagination: PaginationMeta };

const CACHE_TTL = 5 * 60 * 1000;
const MAX_ENTRIES = 100;
const responses = new Map<string, { data: unknown; expires: number }>();
const pending = new Map<string, Promise<unknown>>();

/** Share in-flight requests and recent successful responses across mounted pages. */
export async function fetchApi<T>(url: string): Promise<T> {
  const cached = responses.get(url);
  if (cached && cached.expires > Date.now()) return structuredClone(cached.data) as T;
  responses.delete(url);
  let request = pending.get(url);
  if (!request) {
    request = (async (): Promise<unknown> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(response.status === 429
          ? "Too many requests. Please wait a minute and try again."
          : "Unable to load this data. Please try again.");
      }
      const data: unknown = await response.json();
      if (responses.size >= MAX_ENTRIES) {
        const oldest = responses.keys().next().value;
        if (oldest !== undefined) responses.delete(oldest);
      }
      responses.set(url, { data, expires: Date.now() + CACHE_TTL });
      return data;
    })().finally(() => pending.delete(url));
    pending.set(url, request);
  }
  return structuredClone(await request) as T;
}

export function fetchChildPage(code: string, type: Type, page: number): Promise<PageResponse<AdministrativeUnit>> {
  const route = type === Type.PROVINCE || type === Type.MUNICIPALTY
    ? "districts?province" : type === Type.DISTRICT ? "communes?district" : "villages?commune";
  return fetchApi(`/api/v1/${route}=${encodeURIComponent(code)}&page=${page}&limit=20`);
}
