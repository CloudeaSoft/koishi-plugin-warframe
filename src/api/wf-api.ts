import { fetchAsyncText } from "../utils";
import exampleWorldState from "../assets/exampleWorldState.json";
import WorldState from "warframe-worldstate-parser";

const apiBase = "https://api.warframe.com/cdn/";

export const getWorldState = async (): Promise<WorldState> => {
  const response = await fetchAsyncText(apiBase + "worldState.php");
  // return exampleWorldState;
  const WorldStateParser = await import("warframe-worldstate-parser");
  const ws = await WorldStateParser.WorldState.build(response);
  return ws;
};
