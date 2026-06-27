interface ItemI18NDTO {
  name: string;
  description: string;
  wikiLink: string;
  icon: string;
  thumb: string;
  subIcon: string;
}

export interface ItemDTO {
  id: string;
  tags: string[];
  slug: string;
  gameRef: string;
  tradable: boolean;
  setRoot: boolean;
  setParts: string[];
  quantityInSet: number;
  i18n: Partial<Record<WFMLangDTO, ItemI18NDTO>>;
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

export interface ItemShortDTO {
  id: string;
  slug: string;
  gameRef: string;
  tags: string[];
  i18n: Partial<Record<WFMLangDTO, ItemI18NDTO>>;
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

export interface RivenItemDTO {
  id: string;
  slug: string;
  gameRef: string;
  group?: string;
  rivenType?: string;
  disposition: number;
  reqMasteryRank: number;
  i18n?: Record<string, RivenItemI18NDTO | null>;
}

interface RivenItemI18NDTO {
  name?: string;
  wikiLink?: string;
  icon: string;
  thumb: string;
}

interface ClosedStatisticsEntryDTO {
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

interface LiveStatisticsEntryDTO {
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

export interface StatisticsCollectionDTO {
  statistics_closed: {
    "48hours": ClosedStatisticsEntryDTO[];
    "90days": ClosedStatisticsEntryDTO[];
  };
  statistics_live: {
    "48hours": LiveStatisticsEntryDTO[];
    "90days": LiveStatisticsEntryDTO[];
  };
}
