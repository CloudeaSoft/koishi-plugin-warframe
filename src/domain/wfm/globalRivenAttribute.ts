import { getWFMRivenAttributeList } from "../../api/wfm-api";
import { createAsyncCache, listToDict } from "../../utils";

export const globalRivenAttributeFactory = async (
  rivenAttributeData: WFMResponse<RivenAttribute[]> = undefined
) => {
  rivenAttributeData ??= await getWFMRivenAttributeList();
  if (!rivenAttributeData) {
    throw new Error(
      "Failed to fetch riven attributes from Warframe Market API."
    );
  }
  const data = rivenAttributeData.data;

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

export const overrideGlobalRivenAttribute = (cache: {
  get: () => Promise<{
    globalRivenAttributeList: RivenAttribute[];
    globalRivenAttributeDict: {
      [key: string]: RivenAttribute;
    };
  }>;
}) => {
  globalRivenAttribute = cache;
};
