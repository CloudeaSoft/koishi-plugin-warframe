interface ItemI18N {
  name: string;
  description: string;
  wikiLink: string;
  icon: string;
  thumb: string;
  subIcon: string;
}

interface Item {
  id: string;
  tags: string[];
  slug: string;
  gameRef: string;
  tradable: boolean;
  setRoot: boolean;
  setParts: string[];
  quantityInSet: number;
  i18n: { [key: WFMLang]: ItemI18N };
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

interface ItemShort {
  id: string;
  slug: string;
  gameRef: string;
  tags: string[];
  i18n: { [key: WFMLang]: ItemI18N };
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

interface RivenItem {
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
