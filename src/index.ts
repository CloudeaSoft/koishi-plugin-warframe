import { Context, Schema } from "koishi";

import {
  aboutCommand,
  wmOnReady,
  timeCommand,
  wmCommand,
  wmrCommand,
} from "./features";

export const name = "wfm-helper";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command("about").action(aboutCommand);
  ctx.command("time <Region:text>").action(timeCommand);

  ctx.on("ready", () => {
    wmOnReady();
  });
  ctx.command("wm <itemId:text>").action(wmCommand);
  ctx.command("wmr <itemId:text>").action(wmrCommand);
  ctx
    .command("testimg")
    .action(() => '<img src="https://koishi.chat/logo.png"/>');
}
