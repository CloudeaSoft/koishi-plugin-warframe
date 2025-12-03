import { Context, Schema } from "koishi";

import { aboutCommand, timeCommand, wmCommand, wmrCommand } from "./commands";
import { onReadyHandler } from "./hooks/on-ready";

export const name = "wfm-helper";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command("about").action(aboutCommand);
  ctx.command("time <Region:text>").action(timeCommand);

  ctx.on("ready", onReadyHandler);
  ctx.command("wm <itemId:text>").action(wmCommand);
  ctx.command("wmr <itemId:text>").action(wmrCommand);
}
