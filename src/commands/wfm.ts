import { Argv } from "koishi";
import { getItemOrders, getRivenOrders } from "../services";
import { generateImageOutput } from "../utils";
import { ItemOrderOutput, RivenOrderOutput } from "../components/wfm";

export const wmCommand = async (action: Argv, input: string) => {
  const result = await getItemOrders(input);
  if (!result) {
    return `Item not found: ${input}`;
  }

  return await generateImageOutput(
    action.session.app.puppeteer,
    ItemOrderOutput(result.item, result.orders)
  );
};

export const wmrCommand = async (action: Argv, input: string) => {
  const result = await getRivenOrders(input);
  if (!result) {
    return `Item not found: ${input}`;
  }

  return await generateImageOutput(
    action.session.app.puppeteer,
    RivenOrderOutput(result.item, result.orders)
  );
};
