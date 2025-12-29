import { Argv } from "koishi";
import { generateVoidTraderOutput, getVoidTrader } from "../../services";

export const voidtraderCommand = async (action: Argv) => {
  const result = await getVoidTrader();
  if (typeof result === "string") {
    return result;
  }

  return await generateVoidTraderOutput(action.session.app.puppeteer, result);
};
