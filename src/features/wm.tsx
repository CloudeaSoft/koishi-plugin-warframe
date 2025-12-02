import { toTimeStamp, fullWidthToHalfWidth } from "../utils";
import {
  getWFMItemList,
  getWFMOrderList,
  getWFMRivenAttributeList,
  getWFMRivenItemList,
  getWFMRivenOrderList,
} from "../api/wfm-api";
import { Context } from "koishi";
import "koishi-plugin-puppeteer";
import Element from "@satorijs/element";

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

export const wmCommand = async (input: string, ctx: Context) => {
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

  return generateOrderOutput(ctx, targetItem, result);
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

const generateOrderOutput = async (
  ctx: Context,
  item: ItemShort,
  data: OrderWithUser[]
) => {
  const itemNameCN = item.i18n["zh-hans"].name;
  const itemNameEN = item.i18n["en"].name;
  let result = `物品: ${itemNameCN} / ${itemNameEN} (ID: ${item.slug})\n`;
  for (const order of data) {
    result += `玩家: ${order.user.ingameName} 状态: ${order.user.status} 价格: ${order.platinum}\n`;
  }
  const document: Element = (
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
      <h1 style={'text-align: center;'}>
        {itemNameCN} / {itemNameEN} (ID: {item.slug})
      </h1>
      <table style={"width:100%;"}>
        <tr>
          <th>玩家名</th>
          <th>状态</th>
          <th>价格</th>
        </tr>
        {data.map((order) => (
          <tr>
            <td>{order.user.ingameName}</td>
            <td>{order.user.status}</td>
            <td>{order.platinum}</td>
          </tr>
        ))}
      </table>
    </div>
  );

  const imgBase64 = await ctx.puppeteer.render(
    getHtmlString(document.toString()),
    async (page, next): Promise<string> => {
      const element = await page.$("body");
      return await element.screenshot({
        type: "png",
        encoding: "base64",
      });
    }
  );

  return <img src={`data:image/png;base64,${imgBase64}`} />;
};

const getHtmlString = (body: string, title?: string) => {
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
      /* 添加一些基础样式确保内容可见 */
      body { font-family: Arial, sans-serif; padding: 20px; }
      ul { list-style: none; padding: 0; }
      li { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
    </style>
  </head>
  <body>
    ${body}
  </body>
  </html>`;
};
