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
