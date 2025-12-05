import { Argv } from "koishi";
import {
  generateFissureOutput,
  getFissures,
  getRailjackFissures,
  getSteelPathFissures,
} from "../services";

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
