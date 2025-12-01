interface RivenItem {
  id: string;
  slug: string;
  gameRef: string;
  group?: string;
  rivenType?: string;
  disposition: number;
  reqMasteryRank: number;
  i18n?: Record<string, RivenI18N | null>;
}

interface RivenI18N {
  itemName?: string;
  wikiLink?: string;
  icon: string;
  thumb: string;
}
