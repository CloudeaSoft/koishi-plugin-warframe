import { Argv } from "koishi";
import { generateRelicOutput, getRelic, applyRelicData } from "../../services";

export const relicCommand = async (action: Argv, input: string) => {
  const result = await getRelic(input);
  if (typeof result === "string") {
    return result;
  }
  const relic = await applyRelicData(result);

  return await generateRelicOutput(action.session.app.puppeteer, relic);
};
