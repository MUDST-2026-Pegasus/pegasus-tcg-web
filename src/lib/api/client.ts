import { ApiError } from "./errors";
import { buildUrl, type QueryParams } from "./config";
import {
  getAccessToken,
  bootstrapSession,
  isAccessTokenExpired,
  refreshAccessToken,
} from "./session";
import {
  getCartSession,
  getOrCreateCartSession,
  setCartSession,
} from "./cart-session";
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
  credentials?: RequestCredentials;
};

export type FileDownload = {
  blob: Blob;
  filename: string | null;
};

type RequestInput = RequestOptions & {
  method: string;
  body?: unknown;
};

async function request<T>(path: string, input: RequestInput): Promise<T> {
  const { method, body, query, headers, signal, auth = true, credentials } = input;

  if (auth) {
    await bootstrapSession();
    if (isAccessTokenExpired()) await refreshAccessToken();
  }

  const send = () =>
    fetchJson(buildUrl(path, query), {
      method,
      body,
      headers,
      signal,
      auth,
      credentials,
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

async function download(path: string, options: RequestOptions = {}): Promise<FileDownload> {
  const { query, headers, signal, auth = true, credentials } = options;

  if (auth) {
    await bootstrapSession();
    if (isAccessTokenExpired()) await refreshAccessToken();
  }

  const send = () => fetchFile(buildUrl(path, query), { headers, signal, auth, credentials });
  let response = await send();

  if (response.status === 401 && auth && getAccessToken()) {
    const renewed = await refreshAccessToken();
    if (renewed) response = await send();
  }

  if (!response.ok) {
    return unwrap<FileDownload>({
      status: response.status,
      ok: false,
      envelope: await readEnvelope(response),
    }, path);
  }

  return {
    blob: await response.blob(),
    filename: responseFilename(response.headers.get("Content-Disposition")),
  };
}

async function fetchFile(
  url: string,
  init: Pick<RequestOptions, "headers" | "signal" | "auth" | "credentials">,
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/pdf",
    ...init.headers,
  };
  const token = init.auth ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(url, {
      method: "GET",
      headers,
      signal: init.signal,
      credentials: init.credentials,
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
}

function responseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)?.[1];
  const plain = /filename="([^"]+)"/i.exec(contentDisposition)?.[1]
    ?? /filename=([^;]+)/i.exec(contentDisposition)?.[1];
  const candidate = encoded ?? plain;
  if (!candidate) return null;
  try {
    return decodeURIComponent(candidate.trim().replace(/^"|"$/g, ""));
  } catch {
    return candidate.trim().replace(/^"|"$/g, "");
  }
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
    credentials?: RequestCredentials;
  },
): Promise<RawResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...init.headers,
  };

  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = init.auth ? getAccessToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let cartSession = getCartSession();
  if (!token && !cartSession && url.includes("/cart")) {
    cartSession = getOrCreateCartSession();
  }
  if (cartSession && !headers["X-Cart-Session"]) {
    headers["X-Cart-Session"] = cartSession;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
      credentials: init.credentials,
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

  const nextCartSession = response.headers?.get?.("X-Cart-Session");
  if (nextCartSession) {
    setCartSession(nextCartSession);
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
      details: detail?.details,
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

  download,
};
