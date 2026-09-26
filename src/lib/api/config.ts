import { env } from "@/lib/env";

export const API_PREFIX = "/api/v1";

export type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParams = Record<
  string,
  QueryParamValue | readonly QueryParamValue[]
>;

export function buildUrl(path: string, query?: QueryParams): string {
  const url = `${env.apiBaseUrl}${API_PREFIX}${path}`;
  if (!query) {
    return url;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== null && item !== undefined && item !== "") {
        search.append(key, String(item));
      }
    }
  }

  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}
