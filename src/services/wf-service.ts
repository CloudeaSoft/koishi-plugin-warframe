import Puppeteer from "koishi-plugin-puppeteer";
import arbyRewards from "../assets/arbyRewards";
import arbys from "../assets/arbys";
import solNodes from "../assets/solNodes.json";
import { getHtmlImageBase64, OutputImage } from "../components/wfm";
import { Arby, ArbyShort } from "../types/arby";
import { ArbiTable } from "../components/wf";

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

export const getArbysWeek = (): Arby[] => {
  const currentHourTimeStamp = Math.floor(
    new Date().setMinutes(0, 0, 0) / 1000
  );
  const currentHourIndex = arbysSchedule.findIndex(
    (a) => a.time === currentHourTimeStamp
  );
  const weekArbys = arbysSchedule.slice(
    currentHourIndex,
    currentHourIndex + 24 * 7
  );
  return weekArbys
    .filter((a) => arbyRewards[a.node])
    .map((a) => {
      return {
        ...solNodes[a.node],
        time: new Date(a.time * 1000).toLocaleString("zh-cn", {
          // 日期部分
          year: "numeric", // 2025
          month: "numeric", // 12 (或 '2025年12月'，取决于 locale 和其他设置)
          day: "numeric", // 4

          // 时间部分
          hour: "numeric", // 17 (或 5 PM)
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
