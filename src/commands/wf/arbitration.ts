import { Argv } from "koishi";
import { generateArbitrationsOutput, getArbitrations } from "../../services";

export const arbitrationCommand = (action: Argv, input?: number) => {
  const result = getArbitrations(input);
  if (!result) {
    return "内部错误";
  }

  if (typeof result === "string") {
    return result;
  }

  return generateArbitrationsOutput(action.session.app.puppeteer, result);
};
