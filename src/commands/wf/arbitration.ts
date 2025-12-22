import { Argv } from "koishi";
import { generateArbitrationsOutput, getArbitrations } from "../../services";

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
