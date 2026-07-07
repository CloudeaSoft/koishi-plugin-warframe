import { Argv } from "koishi";
import type { PluginDependencies } from "../types/config";
import {
  getItemOrders,
  getRivenOrders,
  primedModHistory,
  updateCache,
} from "../services";
import {
  ItemOrderComponent,
  RivenOrderComponent,
  PrimedModHistoryComponent,
} from "../components/wfm";

export function createWfmCommands(deps: PluginDependencies) {
  const { render } = deps;

  return {
    wmCommand: async (_action: Argv, input: string) => {
      const result = await getItemOrders(input);
      if (!result) {
        return `Item not found: ${input}`;
      }

      return await render(ItemOrderComponent(result.item, result.orders));
    },

    wmrCommand: async (_action: Argv, input: string) => {
      const result = await getRivenOrders(input);
      if (!result) {
        return `Item not found: ${input}`;
      }

      return await render(RivenOrderComponent(result.item, result.orders));
    },

    wmuCommand: async (_action: Argv, _input: string) => {
      return await updateCache();
    },

    pmodhistoryCommand: async (_action: Argv, _input: string) => {
      const history = await primedModHistory.get();
      return await render(PrimedModHistoryComponent(history));
    },
  };
}
