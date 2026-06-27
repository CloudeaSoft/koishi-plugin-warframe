import { Logger } from "koishi";
import {
  ofetch,
  FetchError,
  type MappedResponseType,
  type ResponseType,
} from "ofetch";

const logger = new Logger("warframe-http");

// Realistic browser headers to reduce unnecessary validation challenges
const defaultHeaders = {
  Accept: "text/html,application/json;q=0.9,image/*;q=0.8,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh-Hans;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Language: "zh-hans",
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

// Shared core: single retry/timeout/error-log policy for all entry points.
// Any failure (HTTP 4xx/5xx, timeout, retries exhausted, parse error) is
// logged and resolves to undefined, so callers only handle one contract.
async function request<T, R extends ResponseType>(
  url: string,
  method: HttpMethod,
  responseType: R,
): Promise<MappedResponseType<R, T> | undefined> {
  try {
    return await ofetch<T, R>(url, {
      method,
      headers: defaultHeaders,
      responseType,
      timeout: 10_000,
      retry: 3,
      retryDelay: 500,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
    });
  } catch (err) {
    const e = err as FetchError;
    logger.error(
      `[HTTP] ${method} ${url} -> ${e.statusCode ?? "network"} ${e.data ?? e.message ?? ""}`.trimEnd(),
    );
    return undefined;
  }
}

export const fetchAsyncText = (url: string, method: HttpMethod = "GET") =>
  request<string, "text">(url, method, "text");

export const fetchAsyncData = <T>(url: string, method: HttpMethod = "GET") =>
  request<T, "json">(url, method, "json");

export const fetchAsyncImage = (url: string, method: HttpMethod = "GET") =>
  request<Blob, "blob">(url, method, "blob");
