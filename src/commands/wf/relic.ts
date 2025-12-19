import { Argv } from "koishi";
import { generateRelicOutput, getRelic, loadRelicData } from "../../services";

export const relicCommand = async (action: Argv, input: string) => {
  const result = await getRelic(action.session.app.puppeteer, input);
  if (typeof result === "string") {
    return result;
  }
  const relic = loadRelicData(result);

  return await generateRelicOutput(action.session.app.puppeteer, relic);
};
