import { Argv } from "koishi";
import { getItemOrders, getRivenOrders, updateCache } from "../services";
import { generateImageOutput } from "../utils";
import { ItemOrderComponent, RivenOrderComponent } from "../components/wfm";

export const wmCommand = async (action: Argv, input: string) => {
  const result = await getItemOrders(input);
  if (!result) {
    return `Item not found: ${input}`;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    ItemOrderComponent(result.item, result.orders),
  );
};

export const wmrCommand = async (action: Argv, input: string) => {
  const result = await getRivenOrders(input);
  if (!result) {
    return `Item not found: ${input}`;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    RivenOrderComponent(result.item, result.orders),
  );
};

export const wmuCommand = async (action: Argv, input: string) => {
  try {
    await updateCache();
  } catch (ex) {
    console.error(ex);
    return "更新失败, 请检查控制台报错";
  }

  return "更新成功";
};
