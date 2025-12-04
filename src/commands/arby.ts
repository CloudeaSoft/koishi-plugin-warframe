import { Argv } from "koishi";
import { generateArbyWeekOutput, getArbysWeek } from "../services";

export const ArbyCommand = (action: Argv) => {
  const result = getArbysWeek();
  return generateArbyWeekOutput(action.session.app.puppeteer, result);
};
