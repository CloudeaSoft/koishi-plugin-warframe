import { getWFMDucatnator } from "../../infrastructure/wfm/wfm-api";
import { createAsyncCache, listToDict } from "../../utils";

export const globalDucatnatorIDDict = createAsyncCache(async () => {
  const data = await getWFMDucatnator();
  if (!data) {
    return undefined;
  }

  return listToDict(data.hour, (d) => [d.item]);
}, 3600_000);
