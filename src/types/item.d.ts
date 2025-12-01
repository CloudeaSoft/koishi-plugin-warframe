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
  i18n: { [key: string]: ItemI18N };
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
  public id: string;
  public slug: string;
  public gameRef: string;
  public tags: string[];
  public i18n: { [key: string]: ItemI18N };
  public maxRank: number;
  public maxCharges: number;
  public vaulted: boolean;
  public ducats: number;
  public amberStars: number;
  public cyanStars: number;
  public baseEndo: number;
  public endoMultiplier: number;
  public subtypes: string[];
}
