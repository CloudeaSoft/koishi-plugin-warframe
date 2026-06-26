import { Argv } from "koishi";
import {
  getItemOrders,
  getRivenOrders,
  primedModHistory,
  updateCache,
} from "../services";
import { generateImageOutput } from "../components/render";
import {
  ItemOrderComponent,
  RivenOrderComponent,
  PrimedModHistoryComponent,
} from "../components/wfm";

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
  return await updateCache();
};

export const pmodhistoryCommand = async (action: Argv, input: string) => {
  const history = await primedModHistory.get();
  return await generateImageOutput(
    action.session!.app.puppeteer,
    PrimedModHistoryComponent(history),
  );
};
