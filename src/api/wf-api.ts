import { fetchAsyncText } from "../utils";
import WorldState from "warframe-worldstate-parser";

const apiBase = "https://api.warframe.com/cdn/";

export const getWorldState = async (): Promise<WorldState> => {
  const response = await fetchAsyncText(apiBase + "worldState.php");
  const WorldStateParser = await import("warframe-worldstate-parser");
  const ws = await WorldStateParser.WorldState.build(response);
  return ws;
};
