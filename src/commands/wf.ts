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
} from "../services";
import { generateImageOutput } from "../utils";
import {
  ArbitrationTable,
  CircuitTable,
  FissureTable,
  RelicComponent,
  RivenComponent,
  VoidTraderComponent,
  WeeklyTable,
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
    action.session.app.puppeteer,
    ArbitrationTable(result)
  );
};

export const circuitCommand = (action: Argv) => {
  const result = getCircuitWeek();
  return generateImageOutput(
    action.session.app.puppeteer,
    CircuitTable(result.incarnons, result.warframes)
  );
};

export const voidtraderCommand = async (action: Argv) => {
  const result = await getVoidTrader();
  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session.app.puppeteer,
    VoidTraderComponent(result)
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
    action.session.app.puppeteer,
    FissureTable(result, "fissure")
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
    action.session.app.puppeteer,
    FissureTable(result, "sp-fissure")
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
    action.session.app.puppeteer,
    FissureTable(result, "rj-fissure")
  );
};

export const relicCommand = async (action: Argv, input: string) => {
  const result = await getRelic(input);
  if (typeof result === "string") {
    return result;
  }
  const relic = await applyRelicData(result);

  return await generateImageOutput(
    action.session.app.puppeteer,
    RelicComponent(relic)
  );
};

export const rivenCommand = async (
  action: Argv,
  input: Dict,
  secret: OcrAPISecret
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
    action.session.app.puppeteer,
    RivenComponent(result)
  );
};

export const weeklyCommand = async (action: Argv) => {
  const result = await getWeekly();
  if (!result || typeof result === "string") {
    return "None.";
  }

  return await WeeklyTable(
    result.archonHunt,
    result.deepArchimedea,
    result.temporalArchimedea
  );
};

export const environmentCommand = async () => {
  return await getEnvironment();
};
