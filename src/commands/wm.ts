import { Argv } from "koishi";
import { generateOrderOutput, getItemOrders } from "../services";

export const wmCommand = async (action: Argv, input: string) => {
  const result = await getItemOrders(input);
  if (!result) {
    return `Item not found: ${input}`;
  }

  return await generateOrderOutput(
    action.session.app.puppeteer,
    result.item,
    result.orders
  );
};
