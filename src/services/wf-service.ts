import Puppeteer from "koishi-plugin-puppeteer";
import {
  ExportMissionTypes,
  ExportRelics,
  ExportRewards,
  dict_zh,
  ExportRegions as regions,
} from "warframe-public-export-plus";

import dict_zh_ex from "../assets/zh.json";
import dict_en_ex from "../assets/en.json";
import arbyRewards from "../assets/arbyRewards";
import arbys from "../assets/arbys";
import { incarnonRewards, warframeRewards } from "../assets/circuitRewards";

import { getHtmlImageBase64, OutputImage } from "../components/wfm";
import {
  ArbitrationTable,
  CircuitTable,
  FissureTable,
  RelicComponent,
  WeeklyTable,
} from "../components/wf";
import { getWorldState } from "../api/wf-api";
import {
  createAsyncCache,
  fissureTierName,
  fissureTierNumToNumber,
  fixRelicRewardKey,
  getMissionTypeKey,
  getSolNodeKey,
  normalizeName,
  regionToShort,
  removeSpace,
} from "../utils";

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

// ================ features ===================

export const wfOnReady = async () => {
  loadRelics();
};

export const getRelic = async (input: string): Promise<Relic | string> => {
  if (!relics) {
    return "遗物数据未加载完成，请稍后再试";
  }

  input = removeSpace(input);
  if (!input) {
    return "请提供正确的遗物名称";
  }

  input = normalizeName(input);

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
  console.log(key);
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

export const getRegionTime = async (): Promise<string> => {
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
