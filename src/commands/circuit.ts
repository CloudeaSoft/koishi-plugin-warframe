import { Argv } from "koishi";
import { generateCircuitWeekOutput, getCircuitWeek } from "../services";

export const circuitCommand = (action: Argv) => {
  const result = getCircuitWeek();
  return generateCircuitWeekOutput(action.session.app.puppeteer, result);
};
