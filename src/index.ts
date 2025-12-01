import { Context, Schema } from "koishi";
import {
  fetchAsyncData,
  toTimeStamp,
  compareCNOrderName,
  compareENOrderName,
} from "./utils";
import { aboutCommand, timeCommand } from "./base-commands";

export const name = "wfm-helper";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command("about").action(aboutCommand);
  ctx.command("time <Region:text>").action(timeCommand);

  ctx.on("ready", readyHandler);
  ctx.command("wm <itemId:text>").action(wmCommand);
  ctx.command("wmr <itemId:text>").action(wmrCommand);
}

const wmApiBase = "https://api.warframe.market/v2/";

let globalItemList: ItemShort[] = [];
let globalRivenItemList: RivenItem[] = [];

const readyHandler = async () => {
  const data = await fetchAsyncData<WFMResponse<ItemShort[]>>(
    `${wmApiBase}items`
  );

  if (!data) {
    throw new Error("Failed to fetch items from Warframe Market API.");
  }

  globalItemList = data.data;

  const rivenData = await fetchAsyncData<WFMResponse<RivenItem[]>>(
    `${wmApiBase}riven/weapons`
  );

  if (!rivenData) {
    throw new Error("Failed to fetch riven items from Warframe Market API.");
  }

  globalRivenItemList = rivenData.data;
};

const wmCommand = async (_: never, input: string) => {
  // const testItemId = "abating_link";
  const targetItem =
    globalItemList.find((item) =>
      compareCNOrderName(input, item.i18n["zh-hans"].name)
    ) ??
    globalItemList.find((item) =>
      compareENOrderName(input, item.i18n["en"].name)
    );
  if (!targetItem) {
    return `未找到物品: ${input}`;
  }

  const itemId = targetItem.slug;
  const itemNameCN = targetItem.i18n["zh-hans"].name;
  const itemNameEN = targetItem.i18n["en"].name;

  const data = await fetchAsyncData<WFMResponse<OrderWithUser[]>>(
    `${wmApiBase}orders/item/${itemId}`
  );

  if (!data) {
    return `未找到物品: ${input}`;
  }

  const result = data.data
    .filter(
      (order) =>
        order.user.status === "ingame" && order.visible && order.type === "sell"
    )
    .sort((a, b) => toTimeStamp(b.updatedAt) - toTimeStamp(a.updatedAt)) // Update Time DESC
    .sort((a, b) => a.platinum - b.platinum) // Price ASC
    .slice(0, 5); // Top 5

  let result2 = `物品: ${itemNameCN} / ${itemNameEN} (ID: ${itemId})\n`;
  for (const order of result) {
    result2 += `玩家: ${order.user.ingameName} 状态: ${order.user.status} 价格: ${order.platinum}\n`;
  }

  return result2;
};

const wmrCommand = async (_: never, input: string) => {
  const targetItem =
    globalRivenItemList.find((item) =>
      compareCNOrderName(input, item.i18n["zh-hans"].itemName)
    ) ??
    globalRivenItemList.find((item) =>
      compareENOrderName(input, item.i18n["en"].itemName)
    );
  if (!targetItem) {
    return `未找到物品: ${input}`;
  }

  const itemId = targetItem.slug;
  const itemNameCN = targetItem.i18n["zh-hans"].itemName;
  const itemNameEN = targetItem.i18n["en"].itemName;

  // https://api.warframe.market/v1/auctions/
  // https://api.warframe.market/v1/auctions/search?type=riven&sort_by=price_asc&weapon_url_name=cerata
  const data = await fetchAsyncData<WFMResponse<OrderWithUser[]>>(
    `${wmApiBase}riven/weapon/${itemId}`
  );

  if (!data) {
    return `未找到物品: ${input}`;
  }

  const result = data.data
    .filter(
      (order) =>
        order.user.status === "ingame" && order.visible && order.type === "sell"
    )
    .sort((a, b) => toTimeStamp(b.updatedAt) - toTimeStamp(a.updatedAt)) // Update Time DESC
    .sort((a, b) => a.platinum - b.platinum) // Price ASC
    .slice(0, 5); // Top 5

  let result2 = `物品: ${itemNameCN} / ${itemNameEN} (ID: ${itemId})\n`;
  for (const order of result) {
    result2 += `玩家: ${order.user.ingameName} 状态: ${order.user.status} 价格: ${order.platinum}\n`;
  }

  return result2;
};
