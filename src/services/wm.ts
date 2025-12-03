import {
  toTimeStamp,
  fullWidthToHalfWidth,
} from "../utils";
import {
  getWFMItemList,
  getWFMOrderList,
  getWFMRivenAttributeList,
  getWFMRivenItemList,
  getWFMRivenOrderList,
} from "../api/wfm-api";
import Puppeteer from "koishi-plugin-puppeteer";
import {
  getHtmlImageBase64,
  getHtmlString,
  ItemOrderOutput,
  OutputImage,
  RivenOrderOutput,
} from "../components/wm";

let globalItemList: ItemShort[] = [];
let globalRivenItemList: RivenItem[] = [];
let globalRivenAttributeList: RivenAttribute[] = [];

export { globalRivenAttributeList };

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

export const getItemOrders = async (
  itemName: string
): Promise<{ item: ItemShort; orders: OrderWithUser[] }> => {
  // const testItemId = "abating_link";
  const targetItem =
    globalItemList.find((item) =>
      compareCNOrderName(itemName, item.i18n["zh-hans"].name)
    ) ??
    globalItemList.find((item) =>
      compareENOrderName(itemName, item.i18n["en"].name)
    );
  if (!targetItem) {
    return null;
  }

  const itemId = targetItem.slug;
  const data = await getWFMOrderList(itemId);
  if (!data) {
    return null;
  }

  const result = data.data
    .filter(
      (order) =>
        order.user.status === "ingame" && order.visible && order.type === "sell"
    )
    .sort((a, b) => toTimeStamp(b.updatedAt) - toTimeStamp(a.updatedAt)) // Update Time DESC
    .sort((a, b) => a.platinum - b.platinum) // Price ASC
    .slice(0, 5); // Top 5

  return {
    item: targetItem,
    orders: result,
  };
};

export const generateItemOrderOutput = async (
  puppe: Puppeteer,
  item: ItemShort,
  orders: OrderWithUser[]
) => {
  const element = ItemOrderOutput(item, orders);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

export const getRivenOrders = async (
  input: string
): Promise<{ item: RivenItem; orders: RivenOrder[] }> => {
  const targetItem =
    globalRivenItemList.find((item) =>
      compareRivenItemName(input, item.i18n["zh-hans"].name)
    ) ??
    globalRivenItemList.find((item) =>
      compareRivenItemName(input, item.i18n["en"].name)
    );
  if (!targetItem) {
    return null;
  }

  const itemId = targetItem.slug;
  const data = await getWFMRivenOrderList(itemId);
  if (!data) {
    return null;
  }

  const top5 = data.payload.auctions
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
    .slice(0, 5); // Top 5

  return { item: targetItem, orders: top5 };
};

export const generateRivenOrderOutput = async (
  puppe: Puppeteer,
  item: RivenItem,
  orders: RivenOrder[]
) => {
  const element = RivenOrderOutput(item, orders);
  const imgBase64 = await getHtmlImageBase64(puppe, element.toString());
  return OutputImage(imgBase64);
};

// ================ privates ===================

const compareCNOrderName = (input: string, standard: string) => {
  // 1. 边界校验：空值/空字符串直接返回false（避免replace报错）
  if (
    !input ||
    !standard ||
    typeof input !== "string" ||
    typeof standard !== "string"
  ) {
    return false;
  }

  // 2. 标准化名称
  const normalizedInput = normalizeOrderName(input);
  const normalizedStandard = normalizeOrderName(standard);

  // 3. 避免空字符串匹配
  if (!normalizedInput || !normalizedStandard) return false;

  // 4. 特殊处理
  // 移除“一套”
  const normalizedStandardNoSet = normalizedStandard.replace(/一套/g, "");
  const normalizedStandardNoSetSimplifiedPrime =
    normalizedStandardNoSet.replace(/prime/g, "p");
  // 移除“蓝图”
  const normalizedStandardNoBlueprint = normalizedStandard.replace(/蓝图/g, "");
  const normalizedStandardNoBlueprintSimplifiedPrime =
    normalizedStandardNoBlueprint.replace(/prime/g, "p");
  // 替换“头部神经光源”
  const normalizedStandardNoNeu =
    normalizedStandardNoBlueprintSimplifiedPrime.replace(/头部神经光元/g, "头");

  return (
    normalizedInput === normalizedStandard ||
    normalizedInput === normalizedStandardNoSet ||
    normalizedInput === normalizedStandardNoSetSimplifiedPrime ||
    normalizedInput === normalizedStandardNoBlueprintSimplifiedPrime ||
    normalizedInput === normalizedStandardNoNeu
  );
};

const compareENOrderName = (input: string, standard: string) => {
  if (
    !input ||
    !standard ||
    typeof input !== "string" ||
    typeof standard !== "string"
  ) {
    return false;
  }

  const endWithSet = standard.toLowerCase().endsWith(" set");
  const standardNoSet = endWithSet ? standard.slice(0, -4) : standard;
  const endWithBlueprint = standard.toLocaleLowerCase().endsWith("blueprint");
  const standardNoBlueprint = endWithBlueprint
    ? standard.slice(0, -10)
    : standard;

  const standardSimplifiedPrime = standardNoSet.replace(/ Prime/g, "p");
  const standardNoBlueprintSimplifiedPrime = standardNoBlueprint.replace(
    / Prime/g,
    "p"
  );

  const normalizedInput = normalizeOrderName(input);
  const normalizedStandard = normalizeOrderName(standard);
  if (!normalizedInput || !normalizedStandard) return false;

  const normalizedStandardNoSet = normalizeOrderName(standardNoSet);
  const normalizedStandardSimplifiedPrime = normalizeOrderName(
    standardSimplifiedPrime
  );
  const normalizedStandardNoBlueprint = normalizeOrderName(
    standardNoBlueprintSimplifiedPrime
  );

  return (
    normalizedInput === normalizedStandard ||
    normalizedInput === normalizedStandardNoSet ||
    normalizedInput === normalizedStandardSimplifiedPrime ||
    normalizedInput === normalizedStandardNoBlueprint
  );
};

const compareRivenItemName = (input: string, standard: string) => {
  if (
    !input ||
    !standard ||
    typeof input !== "string" ||
    typeof standard !== "string"
  ) {
    return false;
  }

  // 2. 标准化名称
  const normalizedInput = normalizeOrderName(input);
  const normalizedStandard = normalizeOrderName(standard);

  if (!normalizedInput || !normalizedStandard) return false;

  return normalizedInput === normalizedStandard;
};

const normalizeOrderName = (str: string) => {
  // 全角转半角 → 转小写 → 过滤特殊字符 → 移除所有空白
  const normalize = (str: string) => {
    return fullWidthToHalfWidth(str)
      .toLowerCase() // 统一大小写
      .replace(/[·'\-+()【】\[\]{}，。！？；：_]/g, "") // 过滤冗余符号
      .replace(/\s+/g, ""); // 移除所有空白
  };

  return normalize(str);
};
