import { dict_zh } from "warframe-public-export-plus";

import {
  toTimeStamp,
  normalizeName,
  listToDict,
  pascalToSpaced,
  createAsyncCache,
} from "../utils";
import {
  getWFMDucatnator,
  getWFMOrderList,
  getWFMRivenOrderList,
} from "../api/wfm-api";

import { globalItemData } from "../domain/wfm/globalItem";
import { globalRivenItemData } from "../domain/wfm/globalRivenItem";
import { globalRivenAttribute } from "../domain/wfm/globalRivenAttribute";

// ================ initialization ===================

const globalDucatnatorIDDict = createAsyncCache(
  async (): Promise<Record<string, Ducatnator> | undefined> => {
    const data = await getWFMDucatnator();
    if (!data || !data.payload) {
      return undefined;
    }

    return listToDict(data.payload.previous_hour, (d) => [d.item]);
  },
  3600_000
);

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
    transformedObject[key] = key;
    for (const alias of aliases as Array<string>) {
      if (typeof alias === "string" && alias.length > 0) {
        transformedObject[alias] = key;
        const warframeNameWithSuffix = `${alias}甲`;
        transformedObject[warframeNameWithSuffix] = key;
      }
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

// ================ features ===================

export const wmOnReady = async () => {};

export const getItemOrders = async (
  input: string
): Promise<{ item: ItemShort; orders: OrderWithUser[] }> => {
  if (!input) return null;
  input = normalizeName(input);

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
  const targetItem = await stringToWFMItem(input);
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

export const getRivenOrders = async (
  input: string
): Promise<{ item: RivenItem; orders: RivenOrderInternal[] }> => {
  const { globalRivenItemList } = await globalRivenItemData.get();
  const { globalRivenAttributeDict } = await globalRivenAttribute.get();

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

  const orders = top5.map((e) => {
    const transformed: RivenAttributeShortInternal[] = e.item.attributes.map(
      (attr) => {
        return {
          ...attr,
          attribute: globalRivenAttributeDict[attr.url_name],
        };
      }
    );

    e.item.attributes = transformed;
    return e as RivenOrderInternal;
  });

  return { item: targetItem, orders: orders };
};

export const applyRelicData = async (relic: Relic): Promise<OutputRelic> => {
  const tier = dict_zh[relic.tierKey] ?? relic.tier;

  const { globalItemGameRefDict } = await globalItemData.get();
  const wfmDict = await globalDucatnatorIDDict.get();

  const loadedItems = relic.items.map((element): OutputRelicReward => {
    const item = globalItemGameRefDict[element.name];
    if (!item) {
      const nameArr = element.name.split("/");
      const name = pascalToSpaced(nameArr[nameArr.length - 1]).replace(
        "Blueprint",
        "蓝图"
      );
      const quantityPrefix =
        element.quantity > 1 ? `${element.quantity} X ` : "";
      return {
        ...element,
        name: quantityPrefix + name,
        ducats: 0,
      };
    }

    const platinum = wfmDict ? wfmDict[item.id]?.median : undefined;

    return {
      ...element,
      name: item.i18n["zh-hans"].name,
      ducats: item.ducats,
      platinum: platinum,
    };
  });

  return {
    tier: tier,
    num: relic.num,
    items: loadedItems,
  };
};

// ================ privates ===================

export const stringToWFMItem = async (input: string): Promise<ItemShort> => {
  const { globalItemList, globalItemDict, globalItemNameToSlugDict } =
    await globalItemData.get();

  input = normalizeName(input);

  // 1. Direct Compare (Normalized equivalent at least)
  const slug = globalItemNameToSlugDict[input];
  if (slug) return globalItemDict[slug];

  // 2. Low-level Shorthands
  const normalShortHandRes = await shortHandProcess(input);
  if (normalShortHandRes) return normalShortHandRes;

  // 3. High-level Alias (Warframes Only)
  const { pure: inputNoSuffix, suffix } = removeNameSuffix(input);
  const aliasHasEndP = inputNoSuffix.endsWith(primeSuffix)
    ? inputNoSuffix.replace(new RegExp(`${primeSuffix}$`), "")
    : inputNoSuffix;
  const mappedAliasHasEndP = warframeAliasDict[aliasHasEndP];
  if (mappedAliasHasEndP) {
    const aliasHasEndPRes = await shortHandProcess(
      normalizeName(mappedAliasHasEndP) + primeSuffix + suffix
    );
    if (aliasHasEndPRes) return aliasHasEndPRes;
  }

  if (inputNoSuffix.endsWith("p")) {
    const aliasNoEndP = inputNoSuffix.replace(/p$/, "");
    const mappedAliasNoEndP = warframeAliasDict[aliasNoEndP];
    if (mappedAliasNoEndP) {
      const aliasNoEndPRes = await shortHandProcess(
        normalizeName(mappedAliasNoEndP) + primeSuffix + suffix
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
    const normalizedInput = normalizeName(input);
    const normalizedStandard = normalizeName(standard);

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

    const normalizedInput = normalizeName(input);
    const normalizedStandard = normalizeName(standard);
    if (!normalizedInput || !normalizedStandard) return false;

    const normalizedStandardNoSet = normalizeName(standardNoSet);
    const normalizedStandardSimplifiedPrime = normalizeName(
      standardSimplifiedPrime
    );
    const normalizedStandardNoBlueprint = normalizeName(
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

const removeNameSuffix = (input: string): { pure: string; suffix: string } => {
  let hasBPSuffix = false;
  if (input.endsWith(bpSuffix)) {
    input = input.replace(new RegExp(`${bpSuffix}$`), "");
    hasBPSuffix = true;
  }

  if (input.endsWith(setSuffix)) {
    input = input.replace(new RegExp(`${setSuffix}$`), "");
  }

  if (input.endsWith(bpSuffix)) {
    input = input.replace(new RegExp(`${bpSuffix}$`), "");
    hasBPSuffix = true;
  }

  const suffix =
    warframePartSuffix.find((value) => input.endsWith(value)) ??
    weaponPartSuffix.find((value) => input.endsWith(value)) ??
    (input.endsWith("头") ? "头部神经光元" : undefined) ??
    (hasBPSuffix ? bpSuffix : undefined) ??
    "";

  if (suffix) {
    input = input.endsWith("头") ? input.replace(/头$/, "") : input;
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

const shortHandProcess = async (input: string): Promise<ItemShort> => {
  const { globalItemDict, globalItemNameToSlugDict } =
    await globalItemData.get();
  const { pure: inputNoSuffix, suffix } = removeNameSuffix(input);
  if (inputNoSuffix === input) {
    const fixSet = input + setSuffix;
    const fixSetRes = globalItemNameToSlugDict[fixSet];
    if (fixSetRes) return globalItemDict[fixSetRes];

    const fixPrime = input.endsWith(primeSuffix)
      ? input
      : input.endsWith("p")
      ? input.slice(0, input.length - 1) + primeSuffix
      : input + primeSuffix;
    const fixPrimeRes = globalItemNameToSlugDict[fixPrime];
    if (fixPrimeRes) return globalItemDict[fixPrimeRes];

    const fixPrimeSet = fixPrime + setSuffix;
    const fixPrimeSetRes = globalItemNameToSlugDict[fixPrimeSet];
    if (fixPrimeSetRes) return globalItemDict[fixPrimeSetRes];

    const fixBP = input + bpSuffix;
    const fixBPRes = globalItemNameToSlugDict[fixBP];
    if (fixBPRes) return globalItemDict[fixBPRes];

    const fixPrimeBP = fixPrime + bpSuffix;
    const fixPrimeBPRes = globalItemNameToSlugDict[fixPrimeBP];
    if (fixPrimeBPRes) return globalItemDict[fixPrimeBPRes];
  } else {
    const fixBP = inputNoSuffix + suffix + bpSuffix;
    const fixBPRes = globalItemNameToSlugDict[fixBP];
    if (fixBPRes) return globalItemDict[fixBPRes];

    const fixPrime = inputNoSuffix.endsWith(primeSuffix)
      ? inputNoSuffix
      : inputNoSuffix.endsWith("p")
      ? inputNoSuffix.slice(0, inputNoSuffix.length - 1) + primeSuffix
      : inputNoSuffix + primeSuffix;
    const fixPrimeRes = globalItemNameToSlugDict[fixPrime + suffix];
    if (fixPrimeRes) return globalItemDict[fixPrimeRes];

    const fixPrimeBP = fixPrime + suffix + bpSuffix;
    const fixPrimeBPRes = globalItemNameToSlugDict[fixPrimeBP];
    if (fixPrimeBPRes) return globalItemDict[fixPrimeBPRes];
  }
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
  const normalizedInput = normalizeName(input);
  const normalizedStandard = normalizeName(standard);

  if (!normalizedInput || !normalizedStandard) return false;

  return normalizedInput === normalizedStandard;
};
