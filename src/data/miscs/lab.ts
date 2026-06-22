import { getHotRivenWeapons } from "../../infrastructure/miscs/lab-api";
import { createAsyncCache } from "../../utils";

export const globalHotRivenWeapons = createAsyncCache(async () => {
  const items = await getHotRivenWeapons(40);
  return items || [];
}, 1800000);
