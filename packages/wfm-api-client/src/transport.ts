import Bottleneck from "bottleneck";
import { ofetch } from "ofetch";
import type { WfmFetcher } from "./types";

export const defaultFetcher: WfmFetcher = async <T>(
  url: string,
): Promise<T> => {
  return ofetch<T>(url, {
    headers: {
      Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      Language: "zh-hans",
    },
    retry: 3,
    retryDelay: 500,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    timeout: 10_000,
  });
};

export function fetchWithLimiter<T>(
  fetcher: WfmFetcher,
  url: string,
  limiter: Bottleneck | undefined,
): Promise<T> {
  const run = () => fetcher<T>(url);
  return limiter ? limiter.schedule(run) : run();
}
