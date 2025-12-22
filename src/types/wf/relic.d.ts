type RelicTier = "Lith" | "Meso" | "Neo" | "Axi" | "Requiem" | "Vanguard";
type RelicQuality = "Intact" | "Exceptional" | "Flawless" | "Radiant";
type RelicRewardRarity = "COMMON" | "UNCOMMON" | "RARE";

interface ExternalRelic {
  tier: RelicTier;
  num: string;
  quality: RelicQuality;
  items: ExternalRelicReward[];
}

interface ExternalRelicReward {
  name: string;
  rate: number;
}

interface Relic {
  tier: RelicTier;
  tierKey: string;
  num: string;
  items: RelicReward[];
}

interface RelicReward {
  name: string;
  rarity: RelicRewardRarity;
  quantity: number;
}

interface OutputRelic {
  tier: string;
  num: string;
  items: OutputRelicReward[];
}

interface OutputRelicReward extends RelicReward {
  ducats: number;
  platinum?: number;
}
