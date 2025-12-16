import Puppeteer from "koishi-plugin-puppeteer";
import { WorldState } from "warframe-worldstate-parser";
import {
  dict_zh as i18nDict,
  ExportRegions as regions,
} from "warframe-public-export-plus";

import arbyRewards from "../assets/arbyRewards";
import arbys from "../assets/arbys";
import { incarnonRewards, warframeRewards } from "../assets/circuitRewards";

import { getHtmlImageBase64, OutputImage } from "../components/wfm";
import { ArbitrationTable, CircuitTable, FissureTable } from "../components/wf";
import { getWorldState } from "../api/wf-api";
import {
  fissureTierName,
  fissureTierNumToNumber,
  getSolNodeKey,
  regionToShort,
} from "../utils";

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

var worldState: WorldState = null;
var worldStateLastUpdatedAt: Date = null;
var worldstateUpdating: boolean = false;
var fissures: Fissure[] = [];
var spFissures: Fissure[] = [];
var rjFissures: Fissure[] = [];

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
      const obj = regionToShort(regions[a.node], i18nDict);
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
    (i) => i18nDict[i]
  );
  const warframes = warframeRewards[week % warframeRewards.length].map(
    (i) => i18nDict[i]
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
  if (!(await updateWorldState())) {
    return "内部错误，获取最新信息失败";
  }

  return fissures;
};

export const getSteelPathFissures = async () => {
  if (!(await updateWorldState())) {
    return "内部错误，获取最新信息失败";
  }

  return spFissures;
};

export const getRailjackFissures = async () => {
  if (!(await updateWorldState())) {
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

const updateWorldState = async () => {
  if (worldstateUpdating) return true;
  if (
    worldState &&
    worldStateLastUpdatedAt &&
    Date.now() - worldStateLastUpdatedAt.getTime() < 120000
  )
    return true;

  try {
    worldState = await getWorldState();
    worldStateLastUpdatedAt = new Date();
    worldstateUpdating = true;
    fissures = [];
    rjFissures = [];
    spFissures = [];
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
        node: regionToShort(regions[nodeKey], i18nDict),
        tier: i18nDict[fissureTierName[fissure.tierNum]],
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
  } catch {
  } finally {
    worldstateUpdating = false;
    return (
      worldState &&
      worldStateLastUpdatedAt &&
      Date.now() - worldStateLastUpdatedAt.getTime() < 120000
    );
  }
};
