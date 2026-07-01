import { Argv } from "koishi";
import { globalHotRivenWeapons } from "../data/miscs/lab";
import { generateImageOutput } from "../components/render";
import { HotRivenComponent } from "../components/miscs";

export const hotRivenCommand = async (action: Argv) => {
  try {
    const result = await globalHotRivenWeapons.get();
    if (!result || result.length === 0) {
      return "暂无热门紫卡数据。";
    }

    return await generateImageOutput(
      action.session!.app.puppeteer,
      HotRivenComponent(result),
    );
  } catch {
    return "获取热门紫卡数据失败";
  }
};
