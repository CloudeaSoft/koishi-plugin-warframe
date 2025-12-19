import { Argv } from "koishi";
import {
  generateWeeklyOutput,
  getWeekly,
} from "../../services";

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
