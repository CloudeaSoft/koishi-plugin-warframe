import { Context, Schema } from "koishi";
import {} from "@koishijs/plugin-help";

import * as commands from "./commands";
import * as hooks from "./hooks/on-ready";

export const name = "warframe";

export interface Config {
  developerMode: boolean;
  ocrAPISecret: OcrAPISecret;
}

export const Config: Schema<Config> = Schema.object({
  developerMode: Schema.boolean().default(false),
  ocrAPISecret: Schema.object({
    id: Schema.string().required(),
    key: Schema.string().required(),
  }).description("OCR API 密钥"),
});

export function apply(ctx: Context) {
  setupHooks(ctx);
  setupCommands(ctx);
}

const setupHooks = (ctx: Context) => {
  ctx.on("message", (session) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`
        Koishi recieved message: ${session.content}
        平台: ${session.platform}
        用户: ${session.author.name}`);
    }
  });
  ctx.on("ready", hooks.onReadyHandler);
};

const setupCommands = (ctx: Context) => {
  ctx.command("wm <itemId:text>", "请用wmi替代").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wm: '${b}'`);
    }
    return commands.wmCommand(a, b);
  });
  ctx.command("wmr <itemId:text>", "查询wm的紫卡价格").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wmr: '${b}'`);
    }
    return commands.wmrCommand(a, b);
  });
  ctx.command("wmi <msg:text>", "查询wm的物品价格").action((a, b) => {
    if (ctx.config.developerMode) {
      ctx.logger.info(`WFM Plugin received command wmi: '${b}'`);
    }
    return commands.wmCommand(a, b);
  });

  ctx
    .command("arbitration [day:number]", "近期高价值仲裁任务")
    .alias("arbi")
    .alias("仲裁")
    .alias("仲裁表")
    .action(commands.arbitrationCommand);
  ctx
    .command("fissure", "当前虚空裂隙")
    .alias("裂缝")
    .alias("裂隙")
    .action(commands.fissureCommand);
  ctx
    .command("spfissure", "当前钢铁之路虚空裂隙")
    .alias("钢铁裂缝")
    .alias("钢铁裂隙")
    .action(commands.steelPathFissureCommand);
  ctx
    .command("rjfissure", "当前九重天虚空裂隙")
    .alias("九重天裂缝")
    .alias("九重天裂隙")
    .action(commands.railjackFissureCommand);

  ctx
    .command("relic <input:text>", "查询遗物内容")
    .alias("遗物")
    .alias("核桃")
    .action(commands.relicCommand);

  ctx
    .command("environment", "当前各区域状态")
    .alias("env")
    .alias("平原")
    .alias("地球")
    .alias("金星")
    .alias("夜灵")
    .alias("夜灵平野")
    .alias("奥布山谷")
    .action(commands.environmentCommand);
  ctx
    .command("weekly", "周常任务")
    .alias("周常")
    .alias("科研")
    .alias("时光科研")
    .alias("深层科研")
    .alias("执行官")
    .action(commands.weeklyCommand);
  ctx
    .command("circuit", "本周回廊战甲及灵化之源")
    .alias("灵化之源")
    .alias("灵化")
    .action(commands.circuitCommand);
  ctx.command("lichc", "c系玄骸武器", { hidden: true }).action(inDevelopment);
  ctx.command("lichi", "i系玄骸武器", { hidden: true }).action(inDevelopment);

  ctx.command("riven <img:image>", "分析紫卡截图").action((a, b) => {
    return commands.rivenCommand(a, b, ctx.config.ocrAPISecret);
  });

  // ctx.command("about", "关于").action(commands.aboutCommand);
};

const inDevelopment = () => {
  return "功能暂未开放";
};
