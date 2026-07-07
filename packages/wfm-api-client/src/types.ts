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

interface ItemI18N {
  name: string;
  description: string;
  wikiLink: string;
  icon: string;
  thumb: string;
  subIcon: string;
}

export interface ItemShort {
  id: string;
  slug: string;
  gameRef: string;
  tags: string[];
  i18n: Partial<Record<WFMLang, ItemI18N>>;
  maxRank: number;
  maxCharges: number;
  vaulted: boolean;
  ducats: number;
  amberStars: number;
  cyanStars: number;
  baseEndo: number;
  endoMultiplier: number;
  subtypes: string[];
}

export interface RivenItem {
  id: string;
  slug: string;
  gameRef: string;
  group?: string;
  rivenType?: string;
  disposition: number;
  reqMasteryRank: number;
  i18n?: Record<string, { name?: string; wikiLink?: string; icon: string; thumb: string } | null>;
}

export interface ClosedStatisticsEntry {
  datetime: string;
  volume: number;
  min_price: number;
  max_price: number;
  open_price: number;
  closed_price: number;
  avg_price: number;
  wa_price: number;
  median: number;
  moving_avg: number;
  donch_top: number;
  donch_bot: number;
  id: string;
  mod_rank: number;
}

export interface LiveStatisticsEntry {
  datetime: string;
  volume: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  wa_price: number;
  median: number;
  order_type: "buy" | "sell";
  moving_avg: number;
  id: string;
  mod_rank: number;
}

export interface StatisticsCollection {
  statistics_closed: {
    "48hours": ClosedStatisticsEntry[];
    "90days": ClosedStatisticsEntry[];
  };
  statistics_live: {
    "48hours": LiveStatisticsEntry[];
    "90days": LiveStatisticsEntry[];
  };
}

export interface UserShort {
  id: string;
  ingameName: string;
  avatar: string;
  reputation: number;
  locale: string;
  platform: string;
  crossplay: boolean;
  status: string | "offline" | "online" | "ingame";
  activity: {
    type: string;
    details: string;
    startedAt: string;
  };
  lastSeen: string;
}

export interface OrderWithUser {
  id: string;
  type: string;
  platinum: number;
  quantity: number;
  perTrade: number;
  rank: number;
  charges: number;
  subtype: string;
  amberStars: number;
  cyanStars: number;
  vosfor: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  itemId: string;
  user: UserShort;
}

export type RivenAttributeUnit = "percent" | "multiply" | "seconds" | string;

export interface RivenAttribute {
  id: string;
  slug: string;
  gameRef: string;
  group: string;
  prefix: string;
  suffix: string;
  exclusiveTo: Array<"shotgun" | "rifle" | "pistol" | "kitgun" | string>;
  positiveIsNegative: boolean;
  positiveOnly: boolean;
  negativeOnly: boolean;
  unit: RivenAttributeUnit;
  i18n: Record<WFMLang, { name: string; icon: string; thumb: string }>;
}

interface Riven {
  polarity: string;
  mod_rank: number;
  re_rolls: number;
  attributes: Array<{
    value: number;
    positive: boolean;
    url_name: string;
  }>;
  type: string;
  name: string;
  weapon_url_name: string;
  mastery_level: number;
}

interface RivenUser {
  reputation: number;
  platform: string;
  locale: string;
  avatar: string | null;
  last_seen: string;
  crossplay: boolean;
  ingame_name: string;
  slug: string;
  status: "offline" | "online" | "ingame" | string;
  id: string;
  region: string;
}

export interface RivenOrder {
  buyout_price: number | null;
  visible: boolean;
  minimal_reputation: number;
  starting_price: number;
  note: string;
  platform: string;
  crossplay: boolean;
  closed: boolean;
  top_bid: number | null;
  is_marked_for: string | null;
  marked_operation_at: string | null;
  created: string;
  updated: string;
  note_raw: string;
  is_direct_sell: boolean;
  id: string;
  owner: RivenUser;
  winner: RivenUser | null;
  item: Riven;
  private: boolean;
}

export interface Ducatnator {
  datetime: Date;
  position_change_month: number;
  position_change_week: number;
  position_change_day: number;
  plat_worth: number;
  volume: number;
  ducats_per_platinum: number;
  ducats_per_platinum_wa: number;
  item: string;
  ducats: number;
  median: number;
  wa_price: number;
  id: string;
}
