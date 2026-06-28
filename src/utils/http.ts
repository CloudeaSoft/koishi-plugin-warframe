import { createCache } from "async-cache-dedupe";
import Bottleneck from "bottleneck";
import { logger } from "./logger";
import {
  ofetch,
  FetchError,
  type MappedResponseType,
  type ResponseType,
} from "ofetch";

const defaultHeaders = {
  Accept: "text/html,application/json;q=0.9,image/*;q=0.8,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh-Hans;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Language: "zh-hans",
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

interface DomainPolicy {
  limiter?: Bottleneck;
  cacheTtl?: number;
}

interface DomainCache {
  fetch: (key: string) => Promise<unknown>;
}

const policies = new Map<string, DomainPolicy>();
const domainCaches = new Map<string, DomainCache>();

export function registerDomainPolicy(domain: string, policy: DomainPolicy) {
  policies.set(domain, policy);
}

function getDomainCache(domain: string): DomainCache | undefined {
  const cached = domainCaches.get(domain);
  if (cached) return cached;

  const policy = policies.get(domain);
  if (!policy?.cacheTtl) return undefined;

  const cache = createCache({
    storage: { type: "memory", options: { size: 1024 } },
  });

  const defined = cache.define(
    "fetch",
    { ttl: policy.cacheTtl },
    async (key: string): Promise<unknown> => {
      const sep = key.indexOf("|");
      const responseType = key.slice(0, sep) as ResponseType;
      const url = key.slice(sep + 1);

      const doFetch = () =>
        ofetch(url, {
          method: "GET",
          headers: defaultHeaders,
          responseType,
          timeout: 10_000,
          retry: 3,
          retryDelay: 500,
          retryStatusCodes: [408, 429, 500, 502, 503, 504],
        });

      const p = policies.get(domain)!;
      if (p.limiter) return p.limiter.schedule(doFetch);
      return doFetch();
    },
  );

  domainCaches.set(domain, defined);
  return defined;
}

async function request<T, R extends ResponseType>(
  url: string,
  method: HttpMethod,
  responseType: R,
): Promise<MappedResponseType<R, T> | undefined> {
  const domain = new URL(url).hostname;
  const policy = policies.get(domain);

  try {
    if (method === "GET") {
      const cache = getDomainCache(domain);
      if (cache) {
        const promiseCache = await cache.fetch(`${responseType}|${url}`);
        return promiseCache as MappedResponseType<R, T>;
      }
    }

    const doFetch = () =>
      ofetch<T, R>(url, {
        method,
        headers: defaultHeaders,
        responseType,
        timeout: 10_000,
        retry: 3,
        retryDelay: 500,
        retryStatusCodes: [408, 429, 500, 502, 503, 504],
      });

    if (policy?.limiter) {
      return await policy.limiter.schedule(doFetch);
    }

    return await doFetch();
  } catch (err) {
    const e = err as FetchError;
    const status = e.statusCode ?? "network";
    const detail =
      e.data && typeof e.data === "object"
        ? JSON.stringify(e.data)
        : ((e.data as string | undefined) ?? e.message ?? "");
    logger.error(`[HTTP] ${method} ${url} -> ${status} ${detail}`.trimEnd());
    return undefined;
  }
}

export const fetchAsyncText = (url: string, method: HttpMethod = "GET") =>
  request<string, "text">(url, method, "text");

export const fetchAsyncData = <T>(url: string, method: HttpMethod = "GET") =>
  request<T, "json">(url, method, "json");

export const fetchAsyncImage = (url: string, method: HttpMethod = "GET") =>
  request<Blob, "blob">(url, method, "blob");
