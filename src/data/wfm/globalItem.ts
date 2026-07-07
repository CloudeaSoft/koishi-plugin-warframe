import { wfmClient } from "../../infrastructure/wfm-client";
import type { ItemShort } from "../../types/wfm";
import { createAsyncCache, listToDict, normalizeName } from "../../utils";

export const globalItemDataFactory = async (response?: ItemShort[]) => {
  response ??= await wfmClient.items.getList();
  if (!response) {
    return {
      globalItemList: [],
      globalItemDict: {},
      globalItemNameToSlugDict: {},
      globalItemGameRefDict: {},
    };
  }

  const data = response;

  const globalItemList: ItemShort[] = response;
  const globalItemDict: Record<string, ItemShort> = listToDict<ItemShort>(
    data,
    (i) => [i.slug],
  );
  const globalItemNameToSlugDict: Record<string, string> = ((list) => {
    const result: Record<string, string> = {};
    for (const item of list) {
      if (item.i18n["zh-hans"]?.name) {
        result[normalizeName(item.i18n["zh-hans"].name)] = item.slug;
      }
      if (item.i18n["en"]?.name) {
        result[normalizeName(item.i18n["en"].name)] = item.slug;
      }
    }
    return result;
  })(globalItemList);
  const globalItemGameRefDict: Record<string, ItemShort> =
    listToDict<ItemShort>(data, (i) => [i.gameRef]);

  return {
    globalItemList,
    globalItemDict,
    globalItemNameToSlugDict,
    globalItemGameRefDict,
  };
};

export let globalItemData = createAsyncCache(globalItemDataFactory, -1);

export const overrideGlobalItemData = (
  cache: AsyncCache<{
    globalItemList: ItemShort[];
    globalItemDict: Record<string, ItemShort>;
    globalItemNameToSlugDict: Record<string, string>;
    globalItemGameRefDict: Record<string, ItemShort>;
  }>,
) => {
  globalItemData = cache;
};
