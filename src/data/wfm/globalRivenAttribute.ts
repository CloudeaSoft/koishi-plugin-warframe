import { getWFMRivenAttributeList } from "../../infrastructure/wfm/wfm-api";
import { RivenAttribute } from "../../types/wfm/riven";
import { createAsyncCache, listToDict } from "../../utils";

export const globalRivenAttributeFactory = async (
  rivenAttributeData?: RivenAttribute[]
) => {
  rivenAttributeData ??= await getWFMRivenAttributeList();
  if (!rivenAttributeData) {
    throw new Error(
      "Failed to fetch riven attributes from Warframe Market API."
    );
  }
  const data = rivenAttributeData;

  const globalRivenAttributeList = data;
  const globalRivenAttributeDict = listToDict<RivenAttribute>(data, (a) => [
    a.slug,
  ]);

  return {
    globalRivenAttributeList,
    globalRivenAttributeDict,
  };
};

export let globalRivenAttribute = createAsyncCache(
  globalRivenAttributeFactory,
  -1
);

export const overrideGlobalRivenAttribute = (
  cache: AsyncCache<{
    globalRivenAttributeList: RivenAttribute[];
    globalRivenAttributeDict: {
      [key: string]: RivenAttribute;
    };
  }>
) => {
  globalRivenAttribute = cache;
};
