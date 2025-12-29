import { Argv } from "koishi";
import {
  generateItemOrderOutput,
  generateRivenOrderOutput,
  getItemOrders,
  getRivenOrders,
} from "../services";

export const wmCommand = async (action: Argv, input: string) => {
  const result = await getItemOrders(input);
  if (!result) {
    return `Item not found: ${input}`;
  }

  return await generateItemOrderOutput(
    action.session.app.puppeteer,
    result.item,
    result.orders
  );
};

export const wmrCommand = async (action: Argv, input: string) => {
  const result = await getRivenOrders(input);
  if (!result) {
    return `Item not found: ${input}`;
  }

  return generateRivenOrderOutput(
    action.session.app.puppeteer,
    result.item,
    result.orders
  );
};
