import { Argv } from "koishi";
import { generateArbyWeekOutput, getArbysWeek } from "../services";

export const arbyCommand = (action: Argv, input?: number) => {
  const result = getArbysWeek(input);
  if (!result) {
    return "内部错误";
  }

  if (typeof result === "string") {
    return result;
  }

  return generateArbyWeekOutput(action.session.app.puppeteer, result);
};
