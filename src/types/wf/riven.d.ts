import { RivenAttributeUnit } from "../wfm/riven";

type RivenWeaponType = "Rifle" | "Shotgun" | "Pistol" | "Archgun" | "Melee";
type RivenStatCountType = "31" | "2" | "21" | "3";

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

interface RivenWeaponDisposition {
  name: {
    en: string;
    zh: string;
  };
  calc: {
    disposition: number;
    name: string;
    texture: string;
    riventype: string;
  };
  weapon: IWeapon;
}

interface RivenStatResult {
  positive: Record<
    string,
    { name: string; max: number; min: number; unit: RivenAttributeUnit }
  >;
  negative:
    | Record<
        string,
        { name: string; max: number; min: number; unit: RivenAttributeUnit }
      >
    | undefined;
}
