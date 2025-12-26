type RivenStatCountType = "3_1" | "2_0" | "2_1" | "3_0";

interface RivenStatFixFactor {
  buffFactor: number;
  buffCount: number;
  curseFactor: number;
  curseCount: number;
}

type RivenStatFixFactorMap = Record<RivenStatCountType, RivenStatFixFactor>;

interface RivenStatAnalyzsis {
  name: string;
  unit: RivenAttributeUnit;
  percent: number;
  value: number;
  max: number;
  min: number;
}

interface RivenStatAnalyzeResult {
  name: string;
  disposition: number;
  buffs: RivenStatAnalyzsis[];
  curses: RivenStatAnalyzsis[];
}
