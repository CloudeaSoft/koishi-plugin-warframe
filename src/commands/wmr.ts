import { Argv } from "koishi";
import { generateRivenOrderOutput, getRivenOrders } from "../services";

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
