import Puppeteer from "koishi-plugin-puppeteer";
import arbyRewards from "../assets/arbyRewards";
import arbys from "../assets/arbys";
import dict from "../assets/dict.zh.json";
import regions from "../assets/ExportRegions.json";
import { getHtmlImageBase64, OutputImage } from "../components/wfm";
import { ArbitrationTable, CircuitTable, FissureTable } from "../components/wf";
import { incarnonRewards, warframeRewards } from "../assets/circuitRewards";
import { getWorldState } from "../api/wf-api";

const arbysSchedule: ArbitrationShort[] = arbys
  .split("\n")
  .map((line) => line.split(","))
  .filter((arr) => arr.length == 2)
  .map((arr) => {
    return {
      time: parseInt(arr[0]),
      node: arr[1],
    };
  });

var worldState: WorldState = null;
var worldStateLastUpdatedAt: Date = null;
var fissures: Fissure[] = [];
var spFissures: Fissure[] = [];
var rjFissures: Fissure[] = [];
const fissureTierName = {
  VoidT1: "古纪(T1)",
  VoidT2: "前纪(T2)",
  VoidT3: "中纪(T3)",
  VoidT4: "后纪(T4)",
  VoidT5: "安魂(T5)",
  VoidT6: "全能(T6)",
};

export const regionToShort = (region: WFRegion, dict: any) => {
  return {
    name: dict[region.name],
    system: dict[region.systemName],
    type: dict[region.missionName],
    faction: dict[region.factionName],
    maxLevel: region.maxEnemyLevel,
    minLevel: region.minEnemyLevel,
  };
};

export const getArbitrations = (day: number = 3): Arbitration[] | string => {
  if (day > 14 || day <= 0) {
    return "天数需小于等于14且大于0";
  }

  const currentHourTimeStamp = Math.floor(
    new Date().setMinutes(0, 0, 0) / 1000
  );
  const currentHourIndex = arbysSchedule.findIndex(
    (a) => a.time === currentHourTimeStamp
  );
  const weekArbys = arbysSchedule.slice(
    currentHourIndex,
    currentHourIndex + 24 * day
  );
  return weekArbys
    .filter((a) => arbyRewards[a.node])
    .map((a) => {
      const obj = regionToShort(regions[a.node], dict);
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

export const getCircuitWeek = (): {
  incarnons: string[];
  warframes: string[];
} => {
  const EPOCH = 1734307200 * 1000;
  const week = Math.trunc((Date.now() - EPOCH) / 604800000);
  const incarnons = incarnonRewards[week % incarnonRewards.length].map(
    (i) => dict[i]
  );
  const warframes = warframeRewards[week % warframeRewards.length].map(
    (i) => dict[i]
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

export const updateFissues = async () => {
  if (
    !worldState ||
    !worldStateLastUpdatedAt ||
    Date.now() - worldStateLastUpdatedAt.getTime() > 120000
  ) {
    worldState = await getWorldState();
    worldStateLastUpdatedAt = new Date();
    for (const fissure of worldState.ActiveMissions) {
      const obj = {
        category: fissure.Hard ? "sp-fissures" : "fissures",
        hard: fissure.Hard,
        activation: parseInt(fissure.Activation.$date.$numberLong),
        expiry: parseInt(fissure.Expiry.$date.$numberLong),
        node: regionToShort(regions[fissure.Node], dict),
        modifier: fissure.Modifier,
        tier: fissureTierName[fissure.Modifier],
      };
      if (obj.hard) {
        spFissures.push(obj);
      } else {
        fissures.push(obj);
      }
    }
    for (const fissure of worldState.VoidStorms) {
      rjFissures.push({
        category: "rj-fissures",
        hard: false,
        activation: parseInt(fissure.Activation.$date.$numberLong),
        expiry: parseInt(fissure.Expiry.$date.$numberLong),
        node: regionToShort(regions[fissure.Node], dict),
        modifier: fissure.ActiveMissionTier,
        tier: fissureTierName[fissure.ActiveMissionTier],
      });
    }
    fissures.sort(
      (a, b) => a.modifier.charCodeAt(5) - b.modifier.charCodeAt(5)
    );
    spFissures.sort(
      (a, b) => a.modifier.charCodeAt(5) - b.modifier.charCodeAt(5)
    );
    rjFissures.sort(
      (a, b) => a.modifier.charCodeAt(5) - b.modifier.charCodeAt(5)
    );
  }

  return worldState && Date.now() - worldStateLastUpdatedAt.getTime() < 120000;
};

export const getFissures = async () => {
  if (!(await updateFissues())) {
    return "内部错误，获取最新信息失败";
  }

  return fissures;
};

export const getSteelPathFissures = async () => {
  if (!(await updateFissues())) {
    return "内部错误，获取最新信息失败";
  }

  return spFissures;
};

export const getRailjackFissures = async () => {
  if (!(await updateFissues())) {
    return "内部错误，获取最新信息失败";
  }

  return rjFissures;
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
