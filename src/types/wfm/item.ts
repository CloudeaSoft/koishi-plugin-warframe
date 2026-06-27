import { WFMLang } from "./lang";

interface ItemI18N {
  name: string;
  description: string;
  wikiLink: string;
  icon: string;
  thumb: string;
  subIcon: string;
}

export interface Item {
  id: string;
  tags: string[];
  slug: string;
  gameRef: string;
  tradable: boolean;
  setRoot: boolean;
  setParts: string[];
  quantityInSet: number;
  i18n: Partial<Record<WFMLang, ItemI18N>>;
  rarity: string;
  maxRank: number;
  maxCharges: number;
  bulkTradable: boolean;
  subtypes: string[];
  maxAmberStars: number;
  maxCyanStars: number;
  baseEndo: number;
  endoMultiplier: number;
  ducats: number;
  reqMasteryRank: number;
  vaulted: boolean;
  tradingTax: number;
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
  i18n?: Record<string, RivenItemI18N | null>;
}

interface RivenItemI18N {
  name?: string;
  wikiLink?: string;
  icon: string;
  thumb: string;
}

interface ClosedStatisticsEntry {
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

interface LiveStatisticsEntry {
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

export interface PrimedModHistoryItem {
  name: string | undefined;
  last: string;
  plats?: number;
}
