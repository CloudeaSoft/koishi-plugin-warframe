import { fetchAsyncData } from "../utils";
import exampleWorldState from "../assets/example-world-state.json";

const apiBase = "https://api.warframe.com/cdn/";

export const getWorldState = async (): Promise<WorldState> => {
  // return exampleWorldState;
  return await fetchAsyncData<WorldState>(apiBase + "worldState.php");
};
