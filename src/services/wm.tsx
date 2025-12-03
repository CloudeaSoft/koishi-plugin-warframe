import {
  toTimeStamp,
  fullWidthToHalfWidth,
  getHtmlImageBase64,
} from "../utils";
import {
  getWFMItemList,
  getWFMOrderList,
  getWFMRivenAttributeList,
  getWFMRivenItemList,
  getWFMRivenOrderList,
} from "../api/wfm-api";
import Element from "@satorijs/element";
import Puppeteer from "koishi-plugin-puppeteer";

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

export const generateOrderOutput = async (
  puppe: Puppeteer,
  item: ItemShort,
  orders: OrderWithUser[]
): Promise<Element> => {
  const itemNameCN = item.i18n["zh-hans"].name;
  const itemNameEN = item.i18n["en"].name;
  let result = `物品: ${itemNameCN} / ${itemNameEN} (ID: ${item.slug})\n`;
  for (const order of orders) {
    result += `玩家: ${order.user.ingameName} 状态: ${order.user.status} 价格: ${order.platinum}\n`;
  }
  const bodyElement: Element = (
    <div style={"display:flex; flex-direction: column;"}>
      <style>
        {`
        th {
          align-items: center;
          width:33%;
          font-size: 1.8rem;
        }

        td {
          text-align: center;
          font-size: 1.5rem;
        }

        tr {
          height: 3rem;
        }
        `}
      </style>
      <h1 style={"text-align: center;"}>
        {itemNameCN} / {itemNameEN} (ID: {item.slug})
      </h1>
      <table style={"width:100%;"}>
        <tr>
          <th>玩家名</th>
          <th>状态</th>
          <th>价格</th>
        </tr>
        {orders.map((order) => (
          <tr>
            <td>{order.user.ingameName}</td>
            <td>{order.user.status}</td>
            <td>{order.platinum}</td>
          </tr>
        ))}
      </table>
    </div>
  );

  const imgBase64 = await getHtmlImageBase64(puppe, bodyElement.toString());

  return <img src={`data:image/png;base64,${imgBase64}`} />;
};

export const wmrCommandImpl = async (
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

  return { item: targetItem, orders: top10 };
};

export const generateRivenOrderOutput = async (
  puppe: Puppeteer,
  item: RivenItem,
  orders: RivenOrder[]
): Promise<Element> => {
  const itemNameCN = item.i18n["zh-hans"].name;
  const itemNameEN = item.i18n["en"].name;
  const bodyElement: Element = (
    <div style={"display:flex; flex-direction: column;"}>
      <style>
        {`
        th {
          align-items: center;
          width:33%;
          font-size: 1.8rem;
        }

        td {
          text-align: center;
          font-size: 1.2rem;
        }

        tr {
          height: 3rem;
        }
        `}
      </style>
      <h1 style={"text-align: center;"}>
        {itemNameCN} / {itemNameEN} (ID: {item.slug})
      </h1>
      <table style={"width:100%;"}>
        <tr>
          <th style={`width:65%;`}>属性</th>
          <th style={`width:4%;`}>价格</th>
          <th style={`width:16%;`}>玩家名</th>
          <th style={`width:4%;`}>状态</th>
          <th style={`width:2%`}>段位</th>
          <th style={`width:4%`}>等级</th>
          <th style={`width:3%`}>循环</th>
          <th style={`width:2%`}>极性</th>
        </tr>
        {orders.map((order) => {
          return (
            <tr>
              <td style={"display:flex;justify-content:center;gap:10px"}>
                {order.item.attributes.map((attr, index) => {
                  const attrInfo = globalRivenAttributeList.find(
                    (e) => e.slug == attr.url_name
                  );
                  const attrName = attrInfo.i18n["zh-hans"].name;
                  const attrValuePrefix =
                    attrInfo.unit === "multiply" ? "x" : "";
                  const unitSuffixMap = {
                    percent: "%",
                    second: "s",
                    multiply: "",
                  };
                  const attrValueSuffix =
                    unitSuffixMap[
                      attrInfo.unit as keyof typeof unitSuffixMap
                    ] || "";
                  const attrValue =
                    attrValuePrefix + attr.value + attrValueSuffix;
                  return (
                    <p>
                      <span>{index !== 0 ? " | " : ""}</span>
                      <span
                        style={`color:${attr.positive ? "darkgreen" : "red"};`}
                      >
                        {`${attrName} ${attrValue}`}
                      </span>
                    </p>
                  );
                })}
              </td>
              <td>{order.starting_price}</td>
              <td>{order.owner.ingame_name}</td>
              <td>{order.owner.status}</td>
              <td>{order.item.mastery_level}</td>
              <td>{order.item.mod_rank}</td>
              <td>{order.item.re_rolls}</td>
              <td>{order.item.polarity}</td>
            </tr>
          );
        })}
      </table>
    </div>
  );

  const imgBase64 = await getHtmlImageBase64(puppe, bodyElement.toString());

  return <img src={`data:image/png;base64,${imgBase64}`} />;
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
