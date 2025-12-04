import { Context, Schema } from "koishi";

import { aboutCommand, timeCommand, wmCommand, wmrCommand } from "./commands";
import { onReadyHandler } from "./hooks/on-ready";

export const name = "wfm-helper";

export interface Config {
  developerMode: boolean;
}

export const Config: Schema<Config> = Schema.object({
  developerMode: Schema.boolean().default(false),
});

export function apply(ctx: Context) {
  ctx.on("message", (session) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`
        Koishi recieved message: ${session.content}
        平台: ${session.platform}
        用户: ${session.author.name}`);
    }
  });
  ctx.on("ready", onReadyHandler);

  ctx.command("wm <itemId:text>").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wm: '${b}'`);
    }
    return wmCommand(a, b);
  });
  ctx.command("wmr <itemId:text>").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wmr: '${b}'`);
    }
    return wmrCommand(a, b);
  });
  ctx.command("wmi <msg:text>").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wmi: '${b}'`);
    }
    return wmCommand(a, b);
  });

  ctx.command("about").action(aboutCommand);
  ctx.command("time <Region:text>").action(timeCommand);
}
