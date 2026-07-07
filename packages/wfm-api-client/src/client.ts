import Bottleneck from "bottleneck";
import { ofetch } from "ofetch";
import type {
  Auction,
  Ducatnator,
  ItemShort,
  OrderWithUser,
  RivenAttribute,
  RivenItem,
  RivenOrder,
  StatisticsCollection,
  WfmApiClient,
  WfmApiClientOptions,
  WfmCacheOptions,
  WFMResponse,
  WFMResponseV1,
  WfmFetcher,
  WfmRateLimitOptions,
} from "./types";

const wfmApiV1Base = "https://api.warframe.market/v1/";
const wfmApiV2Base = "https://api.warframe.market/v2/";

const defaultCacheOptions: WfmCacheOptions = {
  maxSize: 1024,
  itemListTtl: 3600,
  orderListTtl: 30,
  statisticsTtl: 60,
  rivenItemListTtl: 3600,
  rivenOrderListTtl: 30,
  rivenAttributeListTtl: 3600,
  ducatnatorTtl: 60,
};

const defaultRateLimitOptions: WfmRateLimitOptions = {
  minTime: 500,
};

const defaultFetcher: WfmFetcher = async <T>(url: string): Promise<T> => {
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

export function createWfmApiClient(
  options: WfmApiClientOptions = {},
): WfmApiClient {
  const fetcher = options.fetcher ?? defaultFetcher;
  const cacheOptions = resolveCacheOptions(options.cache);
  const limiter = resolveLimiter(options.rateLimit);
  const cache = cacheOptions
    ? new WfmMemoryCache(cacheOptions.maxSize)
    : undefined;

  async function get<T>(url: string, ttl: number): Promise<T | undefined> {
    try {
      if (!cache || ttl <= 0) {
        return await fetchWithLimiter<T>(fetcher, url, limiter);
      }

      return await cache.get(
        url,
        ttl,
        () => fetchWithLimiter<T>(fetcher, url, limiter),
      ) as T;
    } catch {
      return undefined;
    }
  }

  return {
    items: {
      getList: async () => {
        const response = await get<WFMResponse<ItemShort[]>>(
          `${wfmApiV2Base}items`,
          cacheOptions?.itemListTtl ?? 0,
        );
        return response?.data;
      },
      getStatistics: async (itemId: string) => {
        const response = await get<WFMResponseV1<StatisticsCollection>>(
          `${wfmApiV1Base}items/${itemId}/statistics`,
          cacheOptions?.statisticsTtl ?? 0,
        );
        return response?.payload;
      },
      getOrders: async (itemId: string) => {
        const response = await get<WFMResponse<OrderWithUser[]>>(
          `${wfmApiV2Base}orders/item/${itemId}`,
          cacheOptions?.orderListTtl ?? 0,
        );
        return response?.data;
      },
    },
    rivens: {
      getItems: async () => {
        const response = await get<WFMResponse<RivenItem[]>>(
          `${wfmApiV2Base}riven/weapons`,
          cacheOptions?.rivenItemListTtl ?? 0,
        );
        return response?.data;
      },
      getOrders: async (itemId: string) => {
        const response = await get<WFMResponseV1<Auction<RivenOrder>>>(
          `${wfmApiV1Base}auctions/search?type=riven&sort_by=price_asc&weapon_url_name=${itemId}`,
          cacheOptions?.rivenOrderListTtl ?? 0,
        );
        return response?.payload.auctions;
      },
      getAttributes: async () => {
        const response = await get<WFMResponse<RivenAttribute[]>>(
          `${wfmApiV2Base}riven/attributes`,
          cacheOptions?.rivenAttributeListTtl ?? 0,
        );
        return response?.data;
      },
    },
    tools: {
      getDucatnator: async () => {
        const response = await get<WFMResponseV1<{
          previous_day: Ducatnator[];
          previous_hour: Ducatnator[];
        }>>(
          `${wfmApiV1Base}tools/ducats`,
          cacheOptions?.ducatnatorTtl ?? 0,
        );

        if (!response?.payload) return undefined;

        return {
          day: response.payload.previous_day,
          hour: response.payload.previous_hour,
        };
      },
    },
  };
}

function resolveCacheOptions(
  cache: WfmApiClientOptions["cache"],
): WfmCacheOptions | undefined {
  if (cache === false) return undefined;
  if (cache === true || cache === undefined) return defaultCacheOptions;
  return { ...defaultCacheOptions, ...cache };
}

function resolveLimiter(rateLimit: WfmApiClientOptions["rateLimit"]): Bottleneck | undefined {
  if (rateLimit === false) return undefined;
  const options =
    rateLimit === true || rateLimit === undefined
      ? defaultRateLimitOptions
      : { ...defaultRateLimitOptions, ...rateLimit };
  return new Bottleneck({ minTime: options.minTime });
}

function fetchWithLimiter<T>(
  fetcher: WfmFetcher,
  url: string,
  limiter: Bottleneck | undefined,
): Promise<T> {
  const run = () => fetcher<T>(url);
  return limiter ? limiter.schedule(run) : run();
}

class WfmMemoryCache {
  private readonly storage = new Map<
    string,
    { expiresAt: number; promise: Promise<unknown> }
  >();

  constructor(private readonly maxSize: number) {}

  get<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.storage.get(key);

    if (existing && existing.expiresAt > now) {
      this.storage.delete(key);
      this.storage.set(key, existing);
      return existing.promise as Promise<T>;
    }

    if (existing) {
      this.storage.delete(key);
    }

    const promise = factory().catch((err) => {
      this.storage.delete(key);
      throw err;
    });

    this.storage.set(key, {
      expiresAt: now + ttlSeconds * 1000,
      promise,
    });

    while (this.storage.size > this.maxSize) {
      const oldest = this.storage.keys().next().value as string | undefined;
      if (!oldest) break;
      this.storage.delete(oldest);
    }

    return promise;
  }
}
