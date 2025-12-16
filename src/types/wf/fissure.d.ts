interface Fissure {
  category: string;
  hard: boolean;
  /** Expire time. Timestamp in miliseconds  */
  activation: number;
  /** Expire time. Timestamp in miliseconds */
  expiry: number;
  node: WFRegionShort;
  tier: string;
  tierNum: number;
}
