import Puppeteer from "koishi-plugin-puppeteer";
import arbyRewards from "../assets/arbyRewards";
import arbys from "../assets/arbys";
import dict from "../assets/dict.zh.json";
import regions from "../assets/ExportRegions.json";
import { getHtmlImageBase64, OutputImage } from "../components/wfm";
import { Arby, ArbyShort } from "../types/arby";
import { ArbiTable } from "../components/wf";
import { Region } from "../types/region";

const arbysSchedule: ArbyShort[] = arbys
  .split("\n")
  .map((line) => line.split(","))
  .filter((arr) => arr.length == 2)
  .map((arr) => {
    return {
      time: parseInt(arr[0]),
      node: arr[1],
    };
  });

export const getArbysWeek = (day: number = 3): Arby[] | string => {
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
      const region = regions[a.node] as Region;
      const obj = {
        value: dict[region.name] + " " + dict[region.systemName],
        type: dict[region.missionName],
        faction: dict[region.factionName],
      };
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

export const generateArbyWeekOutput = async (
  puppe: Puppeteer,
  arby: Arby[]
) => {
  const element = ArbiTable(arby);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};
