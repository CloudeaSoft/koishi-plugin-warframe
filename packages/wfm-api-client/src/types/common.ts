export type WFMLang =
  | "ko"
  | "ru"
  | "de"
  | "fr"
  | "pt"
  | "zh-hans"
  | "zh-hant"
  | "es"
  | "it"
  | "pl"
  | "uk"
  | "en";

export interface WfmApiClientOptions {
  fetcher?: WfmFetcher;
  cache?: boolean | Partial<WfmCacheOptions>;
  rateLimit?: boolean | Partial<WfmRateLimitOptions>;
}

export interface WfmCacheOptions {
  maxSize: number;
  itemListTtl: number;
  orderListTtl: number;
  statisticsTtl: number;
  rivenItemListTtl: number;
  rivenOrderListTtl: number;
  rivenAttributeListTtl: number;
  ducatnatorTtl: number;
}

export interface WfmRateLimitOptions {
  minTime: number;
}

export type WfmFetcher = <T>(url: string) => Promise<T>;

export interface WFMResponse<T> {
  data: T;
}

export interface WFMResponseV1<T> {
  payload: T;
}

export interface Auction<T> {
  auctions: T[];
}
