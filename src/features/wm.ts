import {
  toTimeStamp,
  compareCNOrderName,
  compareENOrderName,
  compareRivenItemName,
} from "../utils";
import {
  getWFMItemList,
  getWFMOrderList,
  getWFMRivenAttributeList,
  getWFMRivenItemList,
  getWFMRivenOrderList,
} from "../api/wfm-api";

let globalItemList: ItemShort[] = [];
let globalRivenItemList: RivenItem[] = [];
let globalRivenAttributeList: RivenAttribute[] = [];

export const wmOnReady = async () => {
  const data = await getWFMItemList();
  if (!data) {
    throw new Error("Failed to fetch items from Warframe Market API.");
  }

  globalItemList = data.data;

  const rivenData = await getWFMRivenItemList();
  if (!rivenData) {
    throw new Error("Failed to fetch riven items from Warframe Market API.");
  }

  globalRivenItemList = rivenData.data;

  const rivenAttributeData = await getWFMRivenAttributeList();
  if (!rivenAttributeData) {
    throw new Error(
      "Failed to fetch riven attributes from Warframe Market API."
    );
  }

  globalRivenAttributeList = rivenAttributeData.data;
};

export const wmCommand = async (_: never, input: string) => {
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

  const data = await getWFMOrderList(itemId);
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

export const wmrCommand = async (_: never, input: string) => {
  const targetItem =
    globalRivenItemList.find((item) =>
      compareRivenItemName(input, item.i18n["zh-hans"].name)
    ) ??
    globalRivenItemList.find((item) =>
      compareRivenItemName(input, item.i18n["en"].name)
    );
  if (!targetItem) {
    return `未找到物品: ${input}`;
  }

  const itemId = targetItem.slug;
  const data = await getWFMRivenOrderList(itemId);
  if (!data) {
    return `未找到物品: ${input}`;
  }

  const top10 = data.payload.auctions
    .filter(
      (order) =>
        order.owner.status === "ingame" &&
        order.visible &&
        !order.private &&
        !order.closed &&
        order.is_direct_sell
    )
    .sort((a, b) => toTimeStamp(b.updated) - toTimeStamp(a.updated)) // Update Time DESC
    .sort((a, b) => a.starting_price - b.starting_price) // Price ASC
    .slice(0, 10); // Top 10

  const itemNameCN = targetItem.i18n["zh-hans"].name;
  const itemNameEN = targetItem.i18n["en"].name;
  let result = `裂罅MOD: ${itemNameCN} / ${itemNameEN} (ID: ${itemId})\n`;
  for (const order of top10) {
    result += `玩家: ${order.owner.ingame_name} 状态: ${order.owner.status} 价格: ${order.starting_price} 等级: ${order.item.mod_rank} 次数: ${order.item.re_rolls}`;

    order.item.attributes.forEach((attr) => {
      result += " || ";
      const obj = globalRivenAttributeList.find((e) => e.slug == attr.url_name);
      result += `${obj.i18n["zh-hans"].name} ${attr.positive ? "" : "-"}${
        attr.value
      }`;
    });

    result += "\n";
  }
  // result += JSON.stringify(top10[0], null, 4);

  return result;
};
