import { Context, Schema } from "koishi";

import { aboutCommand, timeCommand, wmCommand, wmrCommand } from "./commands";
import { onReadyHandler } from "./hooks/on-ready";
import { ArbyCommand } from "./commands/arby";

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

  ctx.command("wm <itemId:text>", "请用wmi替代").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wm: '${b}'`);
    }
    return wmCommand(a, b);
  });
  ctx.command("wmr <itemId:text>", "查询wm的紫卡价格").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wmr: '${b}'`);
    }
    return wmrCommand(a, b);
  });
  ctx.command("wmi <msg:text>", "查询wm的物品价格").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wmi: '${b}'`);
    }
    return wmCommand(a, b);
  });
  ctx
    .command("Arbi [day:number]", "近期高价值仲裁任务")
    .alias("仲裁")
    .alias("仲裁表")
    .action(ArbyCommand);
  ctx.command("Weekly", "周常任务").alias("周常").action(inDevelopment);
  ctx.command("Incarnon", "本周灵化之源").alias("灵化").action(inDevelopment);

  ctx.command("about", "关于").action(aboutCommand);
  ctx.command("time <Region:text>", "当前时间").action(timeCommand);
}

const inDevelopment = () => {
  return "Work in progress...";
};
