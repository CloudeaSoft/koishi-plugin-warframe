import { Argv } from "koishi";
import { generateItemOrderOutput, getItemOrders } from "../../services";

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
