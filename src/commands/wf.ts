import { Argv, Dict } from "koishi";
import {
  applyRelicData,
  getAnalyzedRiven,
  getArbitrations,
  getCircuitWeek,
  getFissures,
  getRailjackFissures,
  getEnvironment,
  getRelic,
  getSteelPathFissures,
  getVoidTrader,
  getWeekly,
  getStaticRivenStats,
} from "../services";
import { generateImageOutput } from "../components/render";
import {
  ArbitrationComponent,
  CircuitComponent,
  FissureComponent,
  RelicComponent,
  RivenComponent,
  RivenStatComponent,
  VoidTraderComponent,
  WeeklyComponent,
} from "../components/wf";

export const arbitrationCommand = async (action: Argv, input?: number) => {
  const result = getArbitrations(input);
  if (!result) {
    return "获取失败, 请稍后再试";
  }

  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    ArbitrationComponent(result),
  );
};

export const circuitCommand = async (action: Argv) => {
  const result = getCircuitWeek();
  return await generateImageOutput(
    action.session!.app.puppeteer,
    CircuitComponent(result.currentIncarnons, result.currentWarframes, result.allIncarnons, result.allWarframes),
  );
};

export const voidtraderCommand = async (action: Argv) => {
  const result = await getVoidTrader();
  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    VoidTraderComponent(result),
  );
};

export const fissureCommand = async (action: Argv) => {
  const result = await getFissures();
  if (!result) {
    return "内部错误";
  }

  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    FissureComponent(result, "fissure"),
  );
};

export const steelPathFissureCommand = async (action: Argv) => {
  const result = await getSteelPathFissures();
  if (!result) {
    return "内部错误";
  }

  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    FissureComponent(result, "sp-fissure"),
  );
};

export const railjackFissureCommand = async (action: Argv) => {
  const result = await getRailjackFissures();
  if (!result) {
    return "内部错误";
  }

  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    FissureComponent(result, "rj-fissure"),
  );
};

export const relicCommand = async (action: Argv, input: string) => {
  const result = await getRelic(input);
  if (typeof result === "string") {
    return result;
  }
  const relic = await applyRelicData(result);

  return await generateImageOutput(
    action.session!.app.puppeteer,
    RelicComponent(relic),
  );
};

export const rivenCommand = async (
  action: Argv,
  input: Dict,
  secret: OcrAPISecret,
) => {
  // input example
  // {
  //   src: 'https://multimedia.nt.qq.com.cn/download?appid=1407&fileid=EhSbiKlNhenZ15S4s8g3fKbWnigO_xiq1zQg_woo_ITZ2cPTkQMyBHByb2RQgL2jAVoQYr6GFTzpYU9ru9vH3KRquXoCnkGCAQJuag&rkey=CAISONPsN0nSR8aLvM1wiFc17l9Vp25vzGKOI3P88HGlfq2gum-kDb4TI0oJR8m_2-p4vB6cudJCb-C-&spec=0'
  // }

  if (!input?.src) {
    return "未检测到图片";
  }

  const result = await getAnalyzedRiven(secret, input.src);
  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    RivenComponent(result),
  );
};

export const rivenStatCommand = async (
  action: Argv,
  weaponType: string,
  statType: string,
  disposition: number,
) => {
  if (!weaponType || !statType || !disposition) {
    return "请输入正确参数";
  }

  const result = await getStaticRivenStats(weaponType, statType, disposition);
  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    RivenStatComponent(result),
  );
};

export const weeklyCommand = async (action: Argv) => {
  const result = await getWeekly();
  if (!result) {
    return "内部错误";
  }

  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    WeeklyComponent(
      result.archonHunt,
      result.deepArchimedea,
      result.temporalArchimedea,
    ),
  );
};

export const environmentCommand = async () => {
  return await getEnvironment();
};
