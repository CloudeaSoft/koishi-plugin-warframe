import { Argv, Dict } from "koishi";
import {
  applyRelicData,
  generateAnalyzedRivenOutput,
  generateArbitrationsOutput,
  generateCircuitWeekOutput,
  generateFissureOutput,
  generateRelicOutput,
  generateVoidTraderOutput,
  generateWeeklyOutput,
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

export const arbitrationCommand = (action: Argv, input?: number) => {
  const result = getArbitrations(input);
  if (!result) {
    return "获取失败, 请稍后再试";
  }

  if (typeof result === "string") {
    return result;
  }

  return generateArbitrationsOutput(action.session.app.puppeteer, result);
};

export const circuitCommand = (action: Argv) => {
  const result = getCircuitWeek();
  return generateCircuitWeekOutput(action.session.app.puppeteer, result);
};

export const voidtraderCommand = async (action: Argv) => {
  const result = await getVoidTrader();
  if (typeof result === "string") {
    return result;
  }

  return await generateVoidTraderOutput(action.session.app.puppeteer, result);
};

export const fissureCommand = async (action: Argv) => {
  const result = await getFissures();
  if (!result) {
    return "内部错误";
  }

  if (typeof result === "string") {
    return result;
  }

  return await generateFissureOutput(
    action.session.app.puppeteer,
    result,
    "fissure"
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

  return await generateFissureOutput(
    action.session.app.puppeteer,
    result,
    "sp-fissure"
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

  return await generateFissureOutput(
    action.session.app.puppeteer,
    result,
    "rj-fissure"
  );
};

export const relicCommand = async (action: Argv, input: string) => {
  const result = await getRelic(input);
  if (typeof result === "string") {
    return result;
  }
  const relic = await applyRelicData(result);

  return await generateRelicOutput(action.session.app.puppeteer, relic);
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

  const result = await getAnalyzedRiven(secret, input);
  if (typeof result === "string") {
    return result;
  }

  return await generateAnalyzedRivenOutput(
    action.session.app.puppeteer,
    result
  );
};

export const weeklyCommand = async (action: Argv) => {
  const result = await getWeekly();
  if (!result || typeof result === "string") {
    return "None.";
  }

  return await generateWeeklyOutput(
    action.session.app.puppeteer,
    result.archonHunt,
    result.deepArchimedea,
    result.temporalArchimedea
  );
};

export const environmentCommand = async () => {
  return await getEnvironment();
};
