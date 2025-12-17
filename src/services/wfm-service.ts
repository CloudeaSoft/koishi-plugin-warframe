import { toTimeStamp, fullWidthToHalfWidth, listToDict } from "../utils";
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
  ItemOrderOutput,
  OutputImage,
  RivenOrderOutput,
} from "../components/wfm";

let globalItemList: ItemShort[] = [];
let globalRivenItemList: RivenItem[] = [];
let globalRivenAttributeList: RivenAttribute[] = [];

let globalItemDict: Record<string, ItemShort> = {};
let globalRivenItemDict: Record<string, RivenItem> = {};
export let globalRivenAttributeDict: Record<string, RivenAttribute> = {};

/** A dictonary with normalized wfm item i18n name as key and corresponding id as value. Initialized on 'ready' event. */
let globalItemNameToIDDict: Record<string, string> = {};

export const wmOnReady = async () => {
  const data = await getWFMItemList();
  if (!data) {
    throw new Error("Failed to fetch items from Warframe Market API.");
  }

  const rivenData = await getWFMRivenItemList();
  if (!rivenData) {
    throw new Error("Failed to fetch riven items from Warframe Market API.");
  }

  const rivenAttributeData = await getWFMRivenAttributeList();
  if (!rivenAttributeData) {
    throw new Error(
      "Failed to fetch riven attributes from Warframe Market API."
    );
  }

  // Basis
  globalItemList = data.data;
  globalRivenItemList = rivenData.data;
  globalRivenAttributeList = rivenAttributeData.data;

  // Post Transform

  // Slug dictionaries
  globalItemDict = listToDict<ItemShort>(data.data, (i) => [i.slug]);
  globalRivenItemDict = listToDict<RivenItem>(rivenData.data, (i) => [i.slug]);
  globalRivenAttributeDict = listToDict<RivenAttribute>(
    rivenAttributeData.data,
    (a) => [a.slug]
  );

  // Normalized i18n name to slug dicts
  globalItemNameToIDDict = ((list) => {
    const result = {};
    for (const item of list) {
      if (item.i18n["zh-hans"]?.name) {
        result[normalizeOrderName(item.i18n["zh-hans"].name)] = item.slug;
      }
      if (item.i18n["en"]?.name) {
        result[normalizeOrderName(item.i18n["en"].name)] = item.slug;
      }
    }
    return result;
  })(globalItemList);
};

export const getItemOrders = async (
  input: string
): Promise<{ item: ItemShort; orders: OrderWithUser[] }> => {
  if (!input) return null;
  input = normalizeOrderName(input);

  // 1. Process global option
  const isFullLevel = /^满级|满级$/.test(input);
  if (isFullLevel) {
    if (input.match(/^满级/)) {
      input = input.slice(2, input.length);
    } else if (input.match(/满级$/)) {
      input = input.slice(0, input.length - 2);
    }
  }

  // 2. Search item
  const targetItem = inputToItem(input);
  if (!targetItem) {
    return null;
  }

  // 3. Fetch orders
  const itemId = targetItem.slug;
  const data = await getWFMOrderList(itemId);
  if (!data) {
    return null;
  }

  // 4. Process result
  const result = data.data
    .filter(
      (order) =>
        order.user.status === "ingame" &&
        order.visible &&
        order.type === "sell" &&
        (!isFullLevel || order.rank == targetItem.maxRank)
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
  if (!orders.length) {
    return OutputImage(imgBase64);
  }

  const firstOrder = orders[0];
  const comment = `/w ${firstOrder.user.ingameName} Hi! I want to buy: "${
    item.i18n["en"].name
  }${
    !item.maxRank || item.maxRank === 0 ? "" : ` (rank ${firstOrder.rank})`
  }" for ${firstOrder.platinum} platinum. (warframe.market)`;
  return OutputImage(imgBase64) + comment;
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

const warframeAlias = {
  Volt: ["电", "电男", "伏特"],
  Trinity: ["奶妈", "奶"],
  Rhino: ["犀牛", "牛", "铁甲犀牛"],
  Mag: ["磁妹", "磁力"],
  Loki: ["洛基"],
  Excalibur: ["咖喱棒", "圣剑", "咖喱"],
  Ember: ["火鸡"],
  Ash: ["灰烬", "灰烬之刃"],
  Nyx: ["脑溢血"],
  Frost: ["冰男", "冰雪寒霜", "冰队", "冰"],
  Saryn: ["毒妈", "毒"],
  Banshee: ["女妖", "女高音"],
  Vauban: ["工程"],
  Nova: ["诺娃", "加速", "加速娃"],
  Nekros: ["摸尸", "摸"],
  Valkyr: ["瓦尔基里", "瓦喵", "瓦"],
  Oberon: ["奶爸", "龙王", "奥伯龙"],
  Zephyr: ["鸟姐", "鸟"],
  Hydroid: ["水男"],
  Mirage: ["小丑", "丑"],
  Limbo: ["小明", "李明博", "明"],
  Mesa: ["女枪"],
  Chroma: ["龙甲", "龙"],
  Equinox: ["阴阳", "双子"],
  Atlas: ["土石魔像", "土"],
  Wukong: ["猴子", "齐天大圣", "悟空", "猴"],
  Ivara: ["弓妹", "弓"],
  Nezha: ["哪吒", "三太子"],
  Inaros: ["沙"],
  Titania: ["蝶妹"],
  Nidus: ["蛆甲", "蛆"],
  Octavia: ["DJ", "音乐"],
  Harrow: ["主教"],
  Gara: ["玻璃"],
  Khora: ["猫"],
  Revenant: ["夜灵"],
  Garuda: ["血妈", "血"],
  Baruuk: ["武僧"],
  Hildryn: ["母牛"],
  Wisp: ["花"],
  Gauss: ["高斯"],
  Grendel: ["肥宅"],
  Protea: ["茶", "茶妹"],
  Xaku: ["骨"],
  Lavos: ["炼金", "药水", "药水哥", "蛇"],
  Sevagoth: ["鬼", "鲨鱼"],
  Yareli: ["水妹"],
  Caliban: ["卡利班"],
  Gyre: ["电妹"],
  Styanax: ["斯巴达"],
  Voruna: ["狼", "狼妹"],
  Citrine: ["水晶", "宝石"],
  Kullervo: ["刀哥"],
  Dagath: ["马", "赛马娘", "马娘"],
  Qorvex: ["暖气片"],
  Dante: ["但丁"],
  Jade: ["翡翠", "天使"],
  Koumei: [],
  "Cyte-09": ["Cyte09", "老九", "9", "九"],
  Temple: ["吉他"],
  Nokko: ["蘑菇"],
};

const warframeAliasDict: {
  [key: string]: string;
} = ((aliasObject) => {
  const transformedObject = {};
  for (const [key, aliases] of Object.entries(aliasObject)) {
    for (const alias of aliases as Array<string>) {
      if (typeof alias === "string" && alias.length > 0) {
        transformedObject[alias] = key;
        const warframeNameWithSuffix = `${alias}甲`;
        transformedObject[warframeNameWithSuffix] = key;
      }

      transformedObject[key] = key;
    }
  }

  return transformedObject;
})(warframeAlias);

const setSuffix = "一套";
const bpSuffix = "蓝图";
const primeSuffix = "prime";
const warframePartSuffix = ["系统", "头部神经光元", "机体"];
const weaponPartSuffix = [
  "枪管",
  "枪托",
  "枪机",
  "弓弦",
  "上弓臂",
  "下弓臂",
  "刀刃",
  "握柄",
  "拳套",
  "圆盘",
  "连接器",
];

const removeNameSuffix = (input: string): { pure: string; suffix: string } => {
  if (input.endsWith(bpSuffix)) {
    input = input.replace(new RegExp(`${bpSuffix}$`), "");
  }

  if (input.endsWith(setSuffix)) {
    input = input.replace(new RegExp(`${setSuffix}$`), "");
  }

  if (input.endsWith(bpSuffix)) {
    input = input.replace(new RegExp(`${bpSuffix}$`), "");
  }

  const suffix =
    warframePartSuffix.find((value) => input.endsWith(value)) ??
    weaponPartSuffix.find((value) => input.endsWith(value)) ??
    "";

  if (suffix) {
    const pure = input.replace(new RegExp(`${suffix}$`), "");
    return {
      pure,
      suffix,
    };
  } else {
    return {
      pure: input,
      suffix,
    };
  }
};

const shortHandProcess = (input: string): ItemShort | undefined => {
  const { pure: inputNoSuffix, suffix } = removeNameSuffix(input);
  if (inputNoSuffix == input) {
    const fixSet = input + setSuffix;
    const fixSetRes = globalItemNameToIDDict[fixSet];
    if (fixSetRes) return globalItemDict[fixSetRes];

    const fixPrime = input.endsWith(primeSuffix)
      ? input
      : input.endsWith("p")
      ? input.slice(0, input.length - 1) + primeSuffix
      : input + primeSuffix;
    const fixPrimeRes = globalItemNameToIDDict[fixPrime];
    if (fixPrimeRes) return globalItemDict[fixPrimeRes];

    const fixPrimeSet = fixPrime + setSuffix;
    const fixPrimeSetRes = globalItemNameToIDDict[fixPrimeSet];
    if (fixPrimeSetRes) return globalItemDict[fixPrimeSetRes];

    const fixBP = input + bpSuffix;
    const fixBPRes = globalItemNameToIDDict[fixBP];
    if (fixBPRes) return globalItemDict[fixBPRes];

    const fixPrimeBP = fixPrime + bpSuffix;
    const fixPrimeBPRes = globalItemNameToIDDict[fixPrimeBP];
    if (fixPrimeBPRes) return globalItemDict[fixPrimeBPRes];
  } else {
    const fixBP = inputNoSuffix + suffix + bpSuffix;
    const fixBPRes = globalItemNameToIDDict[fixBP];
    if (fixBPRes) return globalItemDict[fixBPRes];

    const fixPrime = inputNoSuffix.endsWith(primeSuffix)
      ? inputNoSuffix
      : inputNoSuffix.endsWith("p")
      ? inputNoSuffix.slice(0, inputNoSuffix.length - 1) + primeSuffix
      : inputNoSuffix + primeSuffix;
    const fixPrimeRes = globalItemNameToIDDict[fixPrime + suffix];
    if (fixPrimeRes) return globalItemDict[fixPrimeRes];

    const fixPrimeBP = fixPrime + suffix + bpSuffix;
    const fixPrimeBPRes = globalItemNameToIDDict[fixPrimeBP];
    if (fixPrimeBPRes) return globalItemDict[fixPrimeBPRes];
  }
};

const inputToItem = (input: string): ItemShort | undefined => {
  // 1. Direct Compare (Normalized equivalent at least)
  const slug = globalItemNameToIDDict[normalizeOrderName(input)];
  if (slug) return globalItemDict[slug];

  // 2. Low-level Shorthands
  const normalShortHandRes = shortHandProcess(input);
  if (normalShortHandRes) return normalShortHandRes;

  // 3. High-level Alias (Warframes Only)
  const { pure: inputNoSuffix, suffix } = removeNameSuffix(input);
  const aliasHasEndP = inputNoSuffix.endsWith(primeSuffix)
    ? inputNoSuffix.replace(new RegExp(`${primeSuffix}$`), "")
    : inputNoSuffix;
  const mappedAliasHasEndP = warframeAliasDict[aliasHasEndP];
  if (mappedAliasHasEndP) {
    const aliasHasEndPRes = shortHandProcess(
      normalizeOrderName(mappedAliasHasEndP) + primeSuffix + suffix
    );
    if (aliasHasEndPRes) return aliasHasEndPRes;
  }

  if (inputNoSuffix.endsWith("p")) {
    const aliasNoEndP = inputNoSuffix.replace(/p$/, "");
    const mappedAliasNoEndP = warframeAliasDict[aliasNoEndP];
    if (mappedAliasNoEndP) {
      const aliasNoEndPRes = shortHandProcess(
        normalizeOrderName(mappedAliasNoEndP) + primeSuffix + suffix
      );
      if (aliasNoEndPRes) return aliasNoEndPRes;
    }
  }

  // 4. TODO: First char compare
  // Not implemented

  // 5. TODO: Fuzzy word match
  // Not implemented

  // 6. TODO: AI?

  // Legacy code
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
    const normalizedStandardNoBlueprint = normalizedStandard.replace(
      /蓝图/g,
      ""
    );
    const normalizedStandardNoBlueprintSimplifiedPrime =
      normalizedStandardNoBlueprint.replace(/prime/g, "p");
    // 替换“头部神经光源”
    const normalizedStandardNoNeu =
      normalizedStandardNoBlueprintSimplifiedPrime.replace(
        /头部神经光元/g,
        "头"
      );

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

  return (
    globalItemList.find((item) =>
      compareCNOrderName(input, item.i18n["zh-hans"].name)
    ) ??
    globalItemList.find((item) =>
      compareENOrderName(input, item.i18n["en"].name)
    )
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
