import { fetchAsyncText } from "../../utils";
import WorldState from "warframe-worldstate-parser";

const apiBase = "https://api.warframe.com/cdn/";

export const getWorldState = async (json?: string): Promise<WorldState> => {
  if (!json) {
    json = await fetchAsyncText(apiBase + "worldState.php");
  }

  if (!json) {
    throw new Error("获取游戏信息失败")
  }

  const WorldStateParser = await import("warframe-worldstate-parser");
  return await WorldStateParser.WorldState.build(json);
};
