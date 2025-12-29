import Puppeteer from "koishi-plugin-puppeteer";
import {
  ExportMissionTypes,
  ExportRelics,
  ExportRewards,
  ExportWeapons,
  dict_en,
  dict_zh,
  ExportRegions as regions,
} from "warframe-public-export-plus";

import dict_zh_ex from "../assets/zh.json";
import dict_en_ex from "../assets/en.json";
import arbyRewards from "../assets/arbyRewards";
import arbys from "../assets/arbys";
import { incarnonRewards, warframeRewards } from "../assets/circuitRewards";
import rivenCalc from "../assets/rivencalc.json";
import rivenAttrValues from "../assets/rivenAttrValues.json";

import { getHtmlImageBase64, OutputImage } from "../components/wfm";
import {
  ArbitrationTable,
  CircuitTable,
  FissureTable,
  RelicComponent,
  RivenComponent,
  VoidTraderComponent,
  WeeklyTable,
} from "../components/wf";
import { getWorldState } from "../api/wf-api";
import {
  createAsyncCache,
  fetchAsyncImage,
  fissureTierName,
  fissureTierNumToNumber,
  fixRelicRewardKey,
  getMissionTypeKey,
  getSolNodeKey,
  getVoidTraderItem,
  listToDict,
  msToHumanReadable,
  normalizeName,
  normalSimilarity,
  regionToShort,
  removeSpace,
  tokenSimilarity,
} from "../utils";
import { Dict } from "koishi";
import { extractTextFromImage } from "./ocr-service";
import { GeneralAccurateOCRResponse } from "tencentcloud-sdk-nodejs-ocr/tencentcloud/services/ocr/v20181119/ocr_models";
import { globalRivenAttributeList } from "./wfm-service";

// ================ initialization ===================

const arbitrationSchedule: ArbitrationShort[] = arbys
  .split("\n")
  .map((line) => line.split(","))
  .filter((arr) => arr.length == 2)
  .map((arr) => {
    return {
      time: parseInt(arr[0]),
      node: arr[1],
    };
  });

const globalWorldState = createAsyncCache(async () => {
  const worldState = await getWorldState();
  const fissures = [];
  const rjFissures = [];
  const spFissures = [];
  for (const fissure of worldState.fissures) {
    const nodeKey = await getSolNodeKey(fissure.nodeKey);
    const obj = {
      category: fissure.isStorm
        ? "rj-fissures"
        : fissure.isHard
        ? "sp-fissures"
        : "fissures",
      hard: fissure.isHard,
      activation: fissure.activation.getTime(),
      expiry: fissure.expiry.getTime(),
      node: regionToShort(regions[nodeKey], dict_zh),
      tier: dict_zh[fissureTierName[fissure.tierNum]],
      tierNum: fissureTierNumToNumber(fissure.tierNum),
    };

    if (fissure.isStorm) {
      rjFissures.push(obj);
    } else if (fissure.isHard) {
      spFissures.push(obj);
    } else {
      fissures.push(obj);
    }
  }

  fissures.sort((a, b) => a.tierNum - b.tierNum);
  spFissures.sort((a, b) => a.tierNum - b.tierNum);
  rjFissures.sort((a, b) => a.tierNum - b.tierNum);
  return { raw: worldState, fissures, spFissures, rjFissures };
}, 120_000);

const loadRelics = () => {
  const result: Record<string, Relic> = {};
  for (const key in ExportRelics) {
    const exportRelic = ExportRelics[key];
    const exportRewards = ExportRewards[exportRelic.rewardManifest];

    const era = "/Lotus/Language/Relics/Era_" + exportRelic.era.toUpperCase();
    const relicKey = normalizeName(exportRelic.era + exportRelic.category);

    const rewards = (exportRewards[0] ?? []).map((r) => {
      const item = fixRelicRewardKey(r.type);
      return {
        name: item,
        rarity: r.rarity as any,
        quantity: r.itemCount,
      };
    });

    const relic: Relic = {
      tier: exportRelic.era,
      tierKey: era,
      num: exportRelic.category,
      items: rewards,
    };
    result[relicKey] = relic;
  }

  relics = result;
};

let relics: Record<string, Relic> = null;

const tierListForMatch = [
  "古纪",
  "前纪",
  "中纪",
  "后纪",
  "安魂",
  "先锋",
  "Lith",
  "Meso",
  "Neo",
  "Axi",
  "Requiem",
  "Vanguard",
].map((t) => normalizeName(t));

export const rivenAttrValueDict: Record<
  string,
  Record<string, number>
> = (function () {
  const dict: any = {};
  for (const key in rivenAttrValues) {
    const attrs = rivenAttrValues[key];
    dict[key] = {};
    for (const attrKey in attrs) {
      const removeDamageSuffix =
        attrKey.endsWith("Damage") &&
        attrKey !== "Damage" &&
        attrKey !== "Finisher Damage" &&
        !attrKey.startsWith("Critical");
      const wfmKey = removeDamageSuffix
        ? normalizeName(attrKey.replace("Damage", ""))
        : normalizeName(attrKey);
      dict[key][wfmKey] = attrs[attrKey];
    }
  }
  return dict;
})();

const weaponRivenDispositionDict = (function () {
  const mapped = rivenCalc.weapons.reduce<
    {
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
      weapon: any;
    }[]
  >((prev, element) => {
    let mapped = undefined;
    for (const weaponKey in ExportWeapons) {
      const weapon = ExportWeapons[weaponKey];

      const splited = weapon.name.split("/");
      if (splited.length <= 0) {
        continue;
      }

      const keyName = splited[splited.length - 1];
      const normalizedCalcName = normalizeName(element.name);
      if (normalizeName(keyName) === normalizedCalcName) {
        mapped = weapon;
        break;
      }

      const weaponEN = dict_en[weapon.name];
      if (weaponEN && normalizeName(weaponEN) === normalizedCalcName) {
        mapped = weapon;
        break;
      }
    }

    if (!mapped) {
      return prev;
    }

    const weaponEN = dict_en[mapped.name];
    const weaponZH = dict_zh[mapped.name];
    const result = {
      name: {
        en: weaponEN,
        zh: weaponZH,
      },
      calc: element,
      weapon: mapped,
    };

    prev.push(result);

    return prev;
  }, []);

  return listToDict(mapped, (e) => [
    normalizeName(e.name.zh),
    normalizeName(e.name.en),
  ]);
})();

const rivenStatFixFactor: RivenStatFixFactorMap = {
  "2_0": { buffFactor: 0.99, buffCount: 2, curseFactor: 0, curseCount: 0 },
  "2_1": {
    buffFactor: 1.2375,
    buffCount: 2,
    curseFactor: -0.495,
    curseCount: 1,
  },
  "3_0": {
    buffFactor: 0.75,
    buffCount: 3,
    curseFactor: 0,
    curseCount: 0,
  },
  "3_1": {
    buffFactor: 0.9375,
    buffCount: 3,
    curseFactor: -0.75,
    curseCount: 1,
  },
};

// ================ features ===================

export const wfOnReady = async () => {
  loadRelics();
};

export const getRelic = async (input: string): Promise<Relic | string> => {
  if (!input) {
    return "请提供正确的遗物名称";
  }

  input = normalizeName(input);
  if (!input) {
    return "请提供正确的遗物名称";
  }

  if (!relics) {
    return "遗物数据未加载完成，请稍后再试";
  }

  const tier = tierListForMatch.find((t) => input.startsWith(t));
  if (!tier) {
    return "请提供正确的遗物名称";
  }

  let category = input
    .replace(new RegExp(`^${tier}`), "")
    .replace(/遗物$|relic$/, "");

  const zhTierMap = {
    古纪: "Lith",
    前纪: "Meso",
    中纪: "Neo",
    后纪: "Axi",
    安魂: "Requiem",
    先锋: "Vanguard",
  };
  const enTier = zhTierMap[tier] ?? tier;
  const key = normalizeName(enTier + category);
  return relics[key] ?? "未找到对应遗物信息";
};

export const generateRelicOutput = async (
  puppe: Puppeteer,
  relic: OutputRelic
) => {
  const element = RelicComponent(relic);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

export const getArbitrations = (day: number = 3): Arbitration[] | string => {
  if (day > 14 || day <= 0) {
    return "天数需小于等于14且大于0";
  }

  const currentHourTimeStamp = Math.floor(
    new Date().setMinutes(0, 0, 0) / 1000
  );
  const currentHourIndex = arbitrationSchedule.findIndex(
    (a) => a.time === currentHourTimeStamp
  );
  const weekArbys = arbitrationSchedule.slice(
    currentHourIndex,
    currentHourIndex + 24 * day
  );
  return weekArbys
    .filter((a) => arbyRewards[a.node])
    .map((a) => {
      const obj = regionToShort(regions[a.node], dict_zh);
      return {
        ...obj,
        time: new Date(a.time * 1000).toLocaleString("zh-cn", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          // minute: 'numeric', // 保持注释或删除，以去除分钟
          // second: 'numeric', // 保持注释或删除，以去除秒
          hour12: false, // 统一使用 24 小时制
          // hourCycle: 'h23' // 另一种设置 24 小时制的方法
          timeZone: "Asia/Shanghai",
        }),
        rewards: arbyRewards[a.node],
      };
    });
};

export const generateArbitrationsOutput = async (
  puppe: Puppeteer,
  arby: Arbitration[]
) => {
  const element = ArbitrationTable(arby);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

export const getWeekly = async () => {
  const { raw: worldState } = await globalWorldState.get();
  if (!worldState) {
    return "内部错误，获取最新信息失败";
  }

  const archon =
    dict_zh[
      "/Lotus/Language/Narmer/" + removeSpace(worldState.archonHunt.boss)
    ];

  const stringToDebuff = (
    key: string,
    name: string,
    prefix: string
  ): ArchiMedeaDebuff => {
    const keyToName = dict_zh_ex[`${prefix}${key}`];

    if (!keyToName) {
      for (const transKey in dict_en_ex) {
        if (dict_en_ex[transKey] === name) {
          return {
            name: dict_zh_ex[transKey],
            desc: dict_zh_ex[transKey + "_Desc"],
          };
        }
      }
    }

    const riskDesc = dict_zh_ex[`${prefix}${key}_Desc`];
    return {
      name: keyToName,
      desc: riskDesc,
    };
  };

  const deepArchim = worldState.archimedeas[0];
  const deepArchimMissions = await Promise.all(
    deepArchim.missions.map(async (m): Promise<ArchiMedeaMission> => {
      const receivedType = await getMissionTypeKey(m.missionType);
      const type =
        dict_zh[ExportMissionTypes[receivedType]?.name] ?? m.missionType;
      const diviation = stringToDebuff(
        m.diviation.key,
        m.diviation.name,
        "/Lotus/Language/Conquest/MissionVariant_LabConquest_"
      );
      const risks = m.risks.map((r) =>
        stringToDebuff(r.key, r.name, "/Lotus/Language/Conquest/Condition_")
      );

      return {
        type,
        diviation,
        risks,
      };
    })
  );
  const deepArchimPersonalModifier = deepArchim.personalModifiers.map((p) =>
    stringToDebuff(p.key, p.name, "/Lotus/Language/Conquest/PersonalMod_")
  );
  const deepArchimRes: ArchiMedea = {
    name: "深层科研",
    missions: deepArchimMissions,
    peronal: deepArchimPersonalModifier,
  };

  const temporalArchim = worldState.archimedeas[1];
  const temporalArchimMissions = await Promise.all(
    temporalArchim.missions.map(async (m): Promise<ArchiMedeaMission> => {
      const receivedType = await getMissionTypeKey(m.missionType);
      const type =
        dict_zh[ExportMissionTypes[receivedType]?.name] ?? receivedType;
      const diviation = stringToDebuff(
        m.diviation.key,
        m.diviation.name,
        "/Lotus/Language/Conquest/MissionVariant_HexConquest_"
      );
      const risks = m.risks.map((r) =>
        stringToDebuff(r.key, r.name, "/Lotus/Language/Conquest/Condition_")
      );

      return {
        type,
        diviation,
        risks,
      };
    })
  );
  const temporalArchimPersonalModifier = temporalArchim.personalModifiers.map(
    (p) =>
      stringToDebuff(p.key, p.name, "/Lotus/Language/Conquest/PersonalMod_")
  );
  const temporalArchimRes: ArchiMedea = {
    name: "时光科研",
    missions: temporalArchimMissions,
    peronal: temporalArchimPersonalModifier,
  };

  return {
    archonHunt: archon,
    deepArchimedea: deepArchimRes,
    temporalArchimedea: temporalArchimRes,
  };
};

export const generateWeeklyOutput = async (
  puppe: Puppeteer,
  archon: string,
  deepArchimedea: ArchiMedea,
  temporalArchimedea: ArchiMedea
) => {
  const element = await WeeklyTable(archon, deepArchimedea, temporalArchimedea);
  // const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  // return OutputImage(imgBase64);
  return element;
};

export const getEnvironment = async (): Promise<string> => {
  const { raw: worldState } = await globalWorldState.get();
  if (!worldState) {
    return "内部错误，获取最新信息失败";
  }

  const cetusDay = worldState.cetusCycle.isDay ? "白天" : "黑夜";
  const cetus = `地球/夜灵平野: ${cetusDay} ${worldState.cetusCycle.timeLeft}`;

  const vallisState = worldState.vallisCycle.isWarm ? "温暖" : "寒冷";
  const vallis = `奥布山谷: ${vallisState} ${worldState.vallisCycle.timeLeft}`;

  const cambionState = worldState.cambionCycle.state
    ? worldState.cambionCycle.state.charAt(0).toUpperCase() +
      worldState.cambionCycle.state.slice(1)
    : "未知";
  const cambion = `魔胎之境: ${cambionState} ${worldState.cambionCycle.timeLeft}`;

  const duviriStateTransDict = {
    sorrow: "悲伤",
    fear: "恐惧",
    joy: "喜悦",
    anger: "愤怒",
    envy: "嫉妒",
  };
  const duviriState =
    duviriStateTransDict[worldState.duviriCycle.state] ??
    worldState.duviriCycle.state;
  const duviri = `双衍王境: ${duviriState} ${worldState.duviriCycle.endString}`;

  const zarimanFaction = worldState.zarimanCycle.isCorpus
    ? "Corpus"
    : "Grineer";
  const zariman = `扎里曼号: ${zarimanFaction} ${worldState.zarimanCycle.timeLeft}`;

  return `当前环境:\n${cetus}\n${vallis}\n${cambion}\n${duviri}\n${zariman}`;
};

export const getCircuitWeek = (): {
  incarnons: string[];
  warframes: string[];
} => {
  const EPOCH = 1734307200 * 1000;
  const week = Math.trunc((Date.now() - EPOCH) / 604800000);
  const incarnons = incarnonRewards[week % incarnonRewards.length].map(
    (i) => dict_zh[i]
  );
  const warframes = warframeRewards[week % warframeRewards.length].map(
    (i) => dict_zh[i]
  );
  return {
    incarnons,
    warframes,
  };
};

export const generateCircuitWeekOutput = async (
  puppe: Puppeteer,
  data: {
    incarnons: string[];
    warframes: string[];
  }
) => {
  const element = CircuitTable(data.incarnons, data.warframes);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

export const getFissures = async () => {
  const { fissures } = await globalWorldState.get();
  return fissures ?? "内部错误，获取最新信息失败";
};

export const getSteelPathFissures = async () => {
  const { spFissures } = await globalWorldState.get();
  return spFissures ?? "内部错误，获取最新信息失败";
};

export const getRailjackFissures = async () => {
  const { rjFissures } = await globalWorldState.get();
  return rjFissures ?? "内部错误，获取最新信息失败";
};

export const generateFissureOutput = async (
  puppe: Puppeteer,
  fissures: Fissure[],
  type: "fissure" | "sp-fissure" | "rj-fissure"
) => {
  const element = FissureTable(fissures, type);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

export const getWeaponRivenDisposition = (name: string) => {
  const normalizedName = normalizeName(name);
  const normalRes = weaponRivenDispositionDict[normalizedName];
  if (normalRes) {
    return normalRes;
  }

  const withPrimeSuffix = normalizedName + "prime";
  const withPrimeRes = weaponRivenDispositionDict[withPrimeSuffix];
  if (withPrimeRes) {
    return withPrimeRes;
  }

  return undefined;
};

export const getAnalyzedRiven = async (
  secret: OcrAPISecret,
  dict: Dict
): Promise<string | RivenStatAnalyzeResult> => {
  const img = await fetchAsyncImage(dict.src);
  if (!img) {
    return "获取图片失败";
  }

  const extractResult = await extractTextFromImage(img, secret);
  if (!extractResult) {
    return "解析图片失败";
  }

  const parseResult = parseOCRResult(extractResult);
  if (
    !parseResult ||
    parseResult.attributes.length < 2 ||
    parseResult.attributes.length > 4
  ) {
    return "解析图片失败";
  }

  return analyzeRivenStat(parseResult as any);
};

export const generateAnalyzedRivenOutput = async (
  puppe: Puppeteer,
  data: RivenStatAnalyzeResult
) => {
  const element = RivenComponent(data);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

export const parseOCRResult = (ocrResult: GeneralAccurateOCRResponse) => {
  const list = ocrResult.TextDetections;
  if (!list) {
    return;
  }

  function similarity(standard: string, input: string): number {
    if (!standard || !input) {
      return 0;
    }

    standard = normalizeName(standard);
    input = normalizeName(input);

    if (input === "伤害") {
      return standard === "基础伤害" ? 1 : 0;
    }

    if (standard === "基础伤害" && input.match(/^伤害$|近战伤害/)) {
      return 1;
    }

    if (standard === "暴击率") {
      standard = "暴击几率";
    }

    if (
      standard.includes(input) ||
      input.includes(standard) ||
      standard.split("/").find((x) => !!x && input.includes(x))
    ) {
      return 1;
    }

    const t = tokenSimilarity(standard, input);
    const s = normalSimilarity(standard, input);
    return Math.max(t, s);
  }

  const texts = list.map((item) => item.DetectedText);
  const attributes: {
    attr: RivenAttribute;
    value: number;
    prefix: string;
  }[] = [];
  const statLines = [];
  for (const t of texts) {
    if (!t || !t.match(/^[x+-]|^[0-9]/)) {
      continue;
    }

    const prefix = t.match(/^[x+-]/) ? t[0] : "";

    const attrNamePart = removeSpace(t ?? "").replace(/^[^一-龥]+/, "");
    const attr = globalRivenAttributeList.find((a) => {
      if (!a) return false;

      let zhName = a.i18n["zh-hans"]?.name;
      if (!zhName) return false;
      const sim = similarity(zhName, attrNamePart);
      if (sim < 0.8) return false;

      return true;
    });

    if (!attr) {
      continue;
    }

    statLines.push(t);

    const value = (function extractStatValue(text) {
      // Normalize
      const t = text.replace(/\s+/g, "");

      // Case 1: multiply format like "x1.07"
      const multMatch = t.match(/x(\d+(\.\d+)?)/i);
      if (multMatch) {
        return {
          value: parseFloat(multMatch[1]),
          type: "multiply",
        };
      }

      // Case 2: percentage format like "+15.8%" or "-12%"
      const percentMatch = t.match(/([+-]?\d+(\.\d+)?)%/);
      if (percentMatch) {
        return {
          value: parseFloat(percentMatch[1]),
          type: "percent",
        };
      }

      // Case 3: plain number (rare but possible)
      const numMatch = t.match(/([+-]?\d+(\.\d+)?)/);
      if (numMatch) {
        return {
          value: parseFloat(numMatch[1]),
          type: "number",
        };
      }

      return undefined;
    })(t);
    if (!value) {
      return undefined;
    }

    attributes.push({ attr, value: value.value, prefix });
  }

  const weaponName = (function extractWeaponName(ocrData: string[]) {
    const rejectPatterns = [
      /%/,
      /x\d/i,
      /\d/, // numbers, %, multipliers
      /伤害/,
      /暴击/,
      /射速/,
      /攻击/,
      /后坐力/,
      /段位/,
      /加倍/,
      /效/,
      /武器/,
      /果/,
      /\)/,
      /\(/, // junk OCR fragments
    ];

    // Step 1: filter out obvious non-name items
    const candidates = ocrData.filter((str) => {
      const s = str.trim();

      // reject pure numbers
      if (/^\d+$/.test(s)) return false;

      // reject lines with % or multipliers
      if (/[+%]/.test(s)) return false;

      // must contain at least some letters (Latin or Chinese)
      if (!/[A-Za-z\u4e00-\u9fa5]/.test(s)) return false;

      // reject anything containing stat words or junk
      if (rejectPatterns.some((p) => p.test(s))) return false;

      return true;
    });

    // Step 2: merge adjacent fragments (common OCR issue)
    const merged = candidates.join("");

    function removeRivenSuffix(name: string) {
      // Remove spaces
      let s = name.replace(/\s+/g, "");

      // Pattern: <latin>-<latin> at the end
      // Example: Pura-cronitis | Acricron | Visisaticron
      const rivenPattern = /[A-Za-z]+-?[A-Za-z]+$/;

      return s.replace(rivenPattern, "");
    }

    return merged ? removeRivenSuffix(merged) : null;
  })(texts.filter((t) => !statLines.some((l) => l === t)));

  if (!weaponName || !attributes.length) {
    return undefined;
  }

  return {
    name: weaponName,
    attributes,
  };
};

export const analyzeRivenStat = (parseResult: {
  name: string;
  attributes: {
    attr: RivenAttribute;
    value: number;
    prefix: string;
  }[];
}): RivenStatAnalyzeResult | string => {
  const weaponRiven = getWeaponRivenDisposition(parseResult.name);
  if (!weaponRiven) {
    return "未找到武器: " + parseResult.name;
  }

  const disposition = weaponRiven.calc.disposition;
  const weaponType = weaponRiven.calc.riventype;
  const rivenStatCountType: RivenStatCountType = (function () {
    if (parseResult.attributes.length === 4) {
      return "3_1";
    } else if (parseResult.attributes.length === 2) {
      return "2_0";
    }

    const firstStat = parseResult.attributes[0];
    const firstStatBaseValue =
      rivenAttrValueDict[weaponType][
        normalizeName(firstStat.attr.i18n["en"].name)
      ];

    // Use the lowest value of 2_1 type riven to check the first stat
    if (firstStat.value >= firstStatBaseValue * 1.2375 * 0.9 * disposition) {
      return "2_1";
    } else {
      return "3_0";
    }
  })();

  const { buffFactor, buffCount, curseFactor, curseCount } =
    rivenStatFixFactor[rivenStatCountType];

  const buffs: RivenStatAnalyzsis[] = [];
  for (let i = 0; i < buffCount; i++) {
    const attr = parseResult.attributes[i];
    const baseValue =
      rivenAttrValueDict[weaponType][normalizeName(attr.attr.i18n["en"].name)];
    const value = attr.attr.unit === "multiply" ? attr.value - 1 : attr.value;
    const standardValue = baseValue * buffFactor * disposition;
    const percent = (value - standardValue) / standardValue;
    buffs.push({
      name: attr.attr.i18n["zh-hans"].name,
      unit: attr.attr.unit,
      value: attr.value,
      percent,
      max: standardValue * 1.1,
      min: standardValue * 0.9,
    });
  }

  const curses: RivenStatAnalyzsis[] = [];
  if (curseCount > 0) {
    for (let i = buffCount; i < buffCount + curseCount; i++) {
      const attr = parseResult.attributes[i];
      const baseValue =
        rivenAttrValueDict[weaponType][
          normalizeName(attr.attr.i18n["en"].name)
        ];
      const value = attr.attr.unit === "multiply" ? attr.value - 1 : attr.value;
      const standardValue = baseValue * curseFactor * disposition;
      const percent = ((value - standardValue) / standardValue) * -1;
      curses.push({
        name: attr.attr.i18n["zh-hans"].name,
        unit: attr.attr.unit,
        value: attr.value,
        percent,
        max: standardValue * 0.9,
        min: standardValue * 1.1,
      });
    }
  }

  return {
    name: weaponRiven.name.zh,
    disposition,
    buffs,
    curses,
  };
};

export const getVoidTrader = async (): Promise<string | VoidTrader> => {
  const { raw: worldState } = await globalWorldState.get();
  if (worldState.voidTraders.length === 0) {
    return "虚空商人仍在未知地带漂流...";
  }

  if (worldState.voidTraders[0].activation.getTime() > Date.now()) {
    const diff = worldState.voidTraders[0].activation.getTime() - Date.now();
    return "距离虚空商人到达还有: " + msToHumanReadable(diff);
  }

  const diff = worldState.voidTraders[0].expiry.getTime() - Date.now();
  const trader = worldState.voidTraders[0];
  const items = trader.inventory.map(getVoidTraderItem);

  return { expiry: msToHumanReadable(diff), items };
};

export const generateVoidTraderOutput = async (
  puppe: Puppeteer,
  data: VoidTrader
) => {
  const element = VoidTraderComponent(data);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

export const getAlerts = async () => {
  const { raw } = await globalWorldState.get();
  const { alerts, invasions, steelPath } = raw;
  const incursion = steelPath.incursions;
  return JSON.stringify(
    alerts.map((a) => a.reward.countedItems),
    null,
    4
  );
};
