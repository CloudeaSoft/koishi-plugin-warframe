type RelicTier = "Lith" | "Meso" | "Neo" | "Axi" | "Requiem" | "Vanguard";
type RelicQuality = "Intact" | "Exceptional" | "Flawless" | "Radiant";

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
  num: string;
  items: RelicReward[];
}

interface RelicReward {
  name: string;
  rate: Record<RelicQuality, number>;
}

interface OutputRelic extends Relic {
  tier: string;
  num: string;
  items: OutputRelicReward[];
}

interface OutputRelicReward extends RelicReward {
  ducats: number;
}
