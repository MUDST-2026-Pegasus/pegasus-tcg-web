import { ApiError } from "./errors";
import { buildUrl, type QueryParams } from "./config";
import {
  getAccessToken,
  isAccessTokenExpired,
  refreshAccessToken,
} from "./session";
import type { ApiEnvelope, ApiErrorBody } from "./types";
import { CLIENT_ERROR_CODES } from "./types";

/**
 * ตัวเดียวที่คุยกับ backend ทั้งแอป — ต่อ base URL + `/api/v1`, แนบ `Authorization`,
 * แกะซอง `ApiResponse` เหลือแต่ `data`, ต่ออายุ token เมื่อเจอ 401 และโยน `ApiError` เสมอ
 */

export type RequestOptions = {
  query?: QueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  auth?: boolean;
};

type RequestInput = RequestOptions & {
  method: string;
  body?: unknown;
};

async function request<T>(path: string, input: RequestInput): Promise<T> {
  const { method, body, query, headers, signal, auth = true } = input;

  if (auth && isAccessTokenExpired()) {
    await refreshAccessToken();
  }

  const send = () =>
    fetchJson(buildUrl(path, query), {
      method,
      body,
      headers,
      signal,
      auth,
    });

  let response = await send();

  // 401 ทั้งที่แนบ token ไป — ลองต่ออายุแล้วยิงซ้ำ ครั้งเดียวเท่านั้น ไม่วนลูป
  if (response.status === 401 && auth && getAccessToken()) {
    const renewed = await refreshAccessToken();
    if (renewed) {
      response = await send();
    }
  }

  return unwrap<T>(response, path);
}

type RawResponse = {
  status: number;
  ok: boolean;
  envelope: ApiEnvelope<unknown> | null;
};

async function fetchJson(
  url: string,
  init: {
    method: string;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    auth: boolean;
  },
): Promise<RawResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...init.headers,
  };

  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (init.auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new ApiError({
        status: 0,
        code: CLIENT_ERROR_CODES.ABORTED,
        message: "Request was cancelled",
      });
    }
    throw new ApiError({
      status: 0,
      code: CLIENT_ERROR_CODES.NETWORK_ERROR,
      message: "Cannot reach the server. Please check your connection and try again.",
    });
  }

  return {
    status: response.status,
    ok: response.ok,
    envelope: await readEnvelope(response),
  };
}

async function readEnvelope(
  response: Response,
): Promise<ApiEnvelope<unknown> | null> {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as ApiEnvelope<unknown>;
  } catch {
    return null;
  }
}

function unwrap<T>(response: RawResponse, path: string): T {
  const { status, ok, envelope } = response;

  if (ok && envelope === null) {
    return undefined as T;
  }

  if (envelope === null) {
    throw new ApiError({
      status,
      code: CLIENT_ERROR_CODES.MALFORMED_RESPONSE,
      message: `Unexpected response from the server (HTTP ${status})`,
      path,
    });
  }

  if (!ok || !envelope.success) {
    const detail = envelope.data as ApiErrorBody | null;
    throw new ApiError({
      status,
      code: detail?.code ?? `HTTP_${status}`,
      message: envelope.message || `Request failed (HTTP ${status})`,
      violations: detail?.violations ?? [],
      path: detail?.path ?? path,
    });
  }

  return envelope.data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
