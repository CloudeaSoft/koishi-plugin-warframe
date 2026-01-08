import { dict_zh, ExportRegions } from "warframe-public-export-plus";
import { getWorldState } from "../api/wf-api";
import {
  createAsyncCache,
  getSolNodeKey,
  regionToShort,
  fissureTierName,
  fissureTierNumToNumber,
} from "../utils";

export const globalWorldState = createAsyncCache(async () => {
  const worldState = await getWorldState();
  const fissures = [];
  const rjFissures = [];
  const spFissures = [];
  for (const fissure of worldState.fissures) {
    const nodeKey = await getSolNodeKey(fissure.nodeKey);
    const obj = {
      category: fissure.isStorm
        ? "rj-fissures"
        : fissure.isHard
        ? "sp-fissures"
        : "fissures",
      hard: fissure.isHard,
      activation: fissure.activation.getTime(),
      expiry: fissure.expiry.getTime(),
      node: regionToShort(ExportRegions[nodeKey], dict_zh),
      tier: dict_zh[fissureTierName[fissure.tierNum]],
      tierNum: fissureTierNumToNumber(fissure.tierNum),
    };

    if (fissure.isStorm) {
      rjFissures.push(obj);
    } else if (fissure.isHard) {
      spFissures.push(obj);
    } else {
      fissures.push(obj);
    }
  }

  fissures.sort((a, b) => a.tierNum - b.tierNum);
  spFissures.sort((a, b) => a.tierNum - b.tierNum);
  rjFissures.sort((a, b) => a.tierNum - b.tierNum);
  return { raw: worldState, fissures, spFissures, rjFissures };
}, 120_000);
