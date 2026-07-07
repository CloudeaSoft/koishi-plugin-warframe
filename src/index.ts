import { } from "@koishijs/plugin-help";
import { Context, Element, Schema } from "koishi";


import "reflect-metadata"; // Solves 'TypeError: Reflect.getMetadata is not a function' caused by warframe-worldstate-parser
import * as commands from "./commands";
import { generateImageOutput } from "./components/render";
import * as hooks from "./hooks/on-ready";
import type { Config as PluginConfig, PluginDependencies } from "./types/config";

export const name = "warframe";

export const inject = {
  required: ["puppeteer"]
}

export const Config: Schema<PluginConfig> = Schema.object({
  developerMode: Schema.boolean().default(false),
  ocrAPISecret: Schema.object({
    id: Schema.string(),
    key: Schema.string(),
  }).description("OCR API 密钥"),
});

export function apply(ctx: Context) {
  const deps: PluginDependencies = {
    config: ctx.config as PluginConfig,
    logger: ctx.logger("koishi-plugin-warframe"),
    render: (e: Element) => generateImageOutput(ctx.puppeteer, e)
  }

  setupHooks(ctx, deps);
  setupCommands(ctx, deps);
}

const setupHooks = (ctx: Context, deps: PluginDependencies) => {
  const { config, logger } = deps
  ctx.on("message", (session) => {
    if (config.developerMode) {
      logger.info(
        `Koishi recieved message: ${session.content}
        Platform: ${session.platform}
        User: ${session.author.name}`,
      );
    }
  });
  ctx.on("command/before-execute", (action) => {
    if (config.developerMode) {
      logger.info(
        `WFM Plugin received command ${action.command?.name}
        arguments: ${JSON.stringify(action.args)}`,
      );
    }
  });
  ctx.on("ready", hooks.onReadyHandler);
};

const setupCommands = (ctx: Context, deps: PluginDependencies) => {
  const wf = commands.createWfCommands(deps)
  const wfm = commands.createWfmCommands(deps)
  const miscs = commands.createMiscsCommands(deps)

  ctx.command("wm <itemId:text>", "请使用wmi替代").action(wfm.wmCommand);
  ctx
    .command("wmr <itemId:text>", "查询wm的紫卡价格")
    .action(wfm.wmrCommand);
  ctx.command("wmi <msg:text>", "查询wm的物品价格").action(wfm.wmCommand);
  ctx.command("wmu", "更新wm缓存数据").action(wfm.wmuCommand);

  ctx
    .command("arbitration [day:number]", "近期高价值仲裁任务")
    .alias("arbi")
    .alias("仲裁")
    .alias("仲裁表")
    .action(wf.arbitrationCommand);
  ctx
    .command("fissure", "当前虚空裂隙")
    .alias("裂缝")
    .alias("裂隙")
    .action(wf.fissureCommand);
  ctx
    .command("spfissure", "当前钢铁之路虚空裂隙")
    .alias("钢铁裂缝")
    .alias("钢铁裂隙")
    .action(wf.steelPathFissureCommand);
  ctx
    .command("rjfissure", "当前九重天虚空裂隙")
    .alias("九重天裂缝")
    .alias("九重天裂隙")
    .action(wf.railjackFissureCommand);

  ctx
    .command("relic <input:text>", "查询遗物内容")
    .alias("遗物")
    .alias("核桃")
    .action(wf.relicCommand);

  ctx
    .command("environment", "当前各区域状态")
    .alias("env")
    .alias("平原")
    .alias("地球")
    .alias("金星")
    .alias("夜灵")
    .alias("夜灵平野")
    .alias("奥布山谷")
    .action(wf.environmentCommand);
  ctx
    .command("weekly", "周常任务")
    .alias("周常")
    .alias("科研")
    .alias("时光科研")
    .alias("深层科研")
    .alias("执行官")
    .action(wf.weeklyCommand);
  ctx
    .command("circuit", "本周回廊战甲及灵化之源")
    .alias("灵化之源")
    .alias("灵化")
    .action(wf.circuitCommand);

  ctx.command("riven <img:image>", "分析紫卡截图").action(wf.rivenCommand);
  ctx
    .command(
      "rivenstat <weaponType:string> <statType:string> <disposition:number>",
      "获取紫卡数值范围",
    )
    .usage(
      "武器类型: 步枪, 手枪, 霰弹枪, 近战, Archwing枪械\n词条类型: 2, 3, 21, 31",
    )
    .example("rivenstat 步枪 31 0.7")
    .alias("紫卡数值")
    .action(wf.rivenStatCommand);
  ctx
    .command("voidtrader", "虚空商人")
    .alias("虚空商人")
    .alias("奸商")
    .action(wf.voidtraderCommand);

  ctx.command("lichc", "c系玄骸武器", { hidden: true }).action(inDevelopment);
  ctx.command("lichi", "i系玄骸武器", { hidden: true }).action(inDevelopment);

  ctx.command("hotriven", "热门紫卡").action(miscs.hotRivenCommand);
  ctx
    .command("pmodhistory", "Primed MOD 历史")
    .alias("pmod")
    .alias("P卡")
    .alias("p卡")
    .alias("P卡历史")
    .alias("p卡历史")
    .action(wfm.pmodhistoryCommand);
};

const inDevelopment = () => {
  return "功能暂未开放";
};
