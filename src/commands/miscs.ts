import { Argv } from "koishi";
import { globalHotRivenWeapons } from "../data/miscs/lab";
import { generateImageOutput } from "../utils";
import { HotRivenComponent } from "../components/miscs";

export const hotRivenCommand = async (action: Argv) => {
  const result = await globalHotRivenWeapons.get();
  if (typeof result === "string") {
    return result;
  }

  return await generateImageOutput(
    action.session!.app.puppeteer,
    HotRivenComponent(result),
  );
};
