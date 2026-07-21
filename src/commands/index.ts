import type { Context } from 'koishi'

import type { PluginDependencies } from '../types/config'

import {} from '@koishijs/plugin-help'
import { createMiscsCommands } from './miscs'
import { createWfCommands } from './wf'
import { createWfmCommands } from './wfm'

export function setupCommands(ctx: Context, deps: PluginDependencies): void {
  const wf = createWfCommands(deps)
  const wfm = createWfmCommands(deps)
  const miscs = createMiscsCommands(deps)

  ctx.command('wm <item-name:text>', '请使用wmi替代').action(wfm.wmCommand)
  ctx
    .command('wmr <item-name:text>', '查询wm的紫卡价格')
    .action(wfm.wmrCommand)
  ctx.command('wmi <item-name:text>', '查询wm的物品价格').action(wfm.wmCommand)
  ctx.command('wmu', '更新wm缓存数据').action(wfm.wmuCommand)

  ctx
    .command('arbitration [day:number]', '近期高价值仲裁任务')
    .alias('arbi')
    .alias('仲裁')
    .alias('仲裁表')
    .action(wf.arbitrationCommand)
  ctx
    .command('fissure', '当前虚空裂隙')
    .alias('裂缝')
    .alias('裂隙')
    .action(wf.fissureCommand)
  ctx
    .command('fissure-sp', '当前钢铁之路虚空裂隙')
    .alias('spfissure')
    .alias('钢铁裂缝')
    .alias('钢铁裂隙')
    .action(wf.steelPathFissureCommand)
  ctx
    .command('fissure-rj', '当前九重天虚空裂隙')
    .alias('rjfissure')
    .alias('九重天裂缝')
    .alias('九重天裂隙')
    .action(wf.railjackFissureCommand)

  ctx
    .command('relic <relic-name:text>', '查询遗物内容')
    .alias('遗物')
    .alias('核桃')
    .action(wf.relicCommand)

  ctx
    .command('environment', '当前各区域状态')
    .alias('env')
    .alias('平原')
    .alias('夜灵平野')
    .alias('奥布山谷')
    .alias('魔胎之境')
    .alias('扎里曼')
    .action(wf.environmentCommand)
  ctx
    .command('bounty-cetus', '希图斯赏金')
    .alias('希图斯')
    .alias('希图斯赏金')
    .alias('赏金希图斯')
    .alias('cetus')
    .alias('ostron')
    .action(wf.bountyCetusCommand)
  ctx
    .command('bounty-fortuna', '福尔图娜赏金')
    .alias('福尔图娜')
    .alias('福尔图娜赏金')
    .alias('赏金福尔图娜')
    .alias('fortuna')
    .alias('solaris')
    .action(wf.bountyFortunaCommand)
  ctx
    .command('bounty-deimos', '火卫二赏金')
    .alias('火卫二')
    .alias('火卫二赏金')
    .alias('赏金火卫二')
    .alias('deimos')
    .alias('entrati')
    .action(wf.bountyDeimosCommand)
  ctx
    .command('bounty-zariman', '扎里曼赏金')
    .alias('扎里曼赏金')
    .alias('赏金扎里曼')
    .alias('zariman')
    .alias('holdfasts')
    .action(wf.bountyZarimanCommand)
  ctx
    .command('bounty-cavia', '科维兽赏金')
    .alias('科维兽')
    .alias('科维兽赏金')
    .alias('赏金科维兽')
    .alias('cavia')
    .action(wf.bountyCaviaCommand)
  ctx
    .command('bounty-hex', '六人组赏金')
    .alias('六人组')
    .alias('六人组赏金')
    .alias('赏金六人组')
    .alias('hex')
    .action(wf.bountyHexCommand)
  ctx
    .command('weekly', '周常任务')
    .alias('周常')
    .alias('科研')
    .alias('时光科研')
    .alias('深层科研')
    .alias('执行官')
    .action(wf.weeklyCommand)
  ctx
    .command('circuit', '本周回廊战甲及灵化之源')
    .alias('灵化之源')
    .alias('灵化')
    .action(wf.circuitCommand)

  ctx.command('riven <img:image>', '分析紫卡截图').action(wf.rivenCommand)
  ctx
    .command(
      'riven-stat <weaponType:string> <statType:string> <disposition:number>',
      '获取紫卡数值范围',
    )
    .usage(
      '武器类型: 步枪, 手枪, 霰弹枪, 近战, Archwing枪械\n词条类型: 2, 3, 21, 31',
    )
    .example('riven-stat 步枪 31 0.7')
    .alias('rivenstat')
    .alias('紫卡数值')
    .action(wf.rivenStatCommand)
  ctx
    .command('void-trader', '虚空商人')
    .alias('voidtrader')
    .alias('虚空商人')
    .alias('奸商')
    .action(wf.voidtraderCommand)

  ctx.command('lich-c', 'c系玄骸武器', { hidden: true }).alias('lichc').action(miscs.inDevelopment)
  ctx.command('lich-i', 'i系玄骸武器', { hidden: true }).alias('lichi').action(miscs.inDevelopment)

  ctx
    .command('riven-weekly [minPrice:number]', '每周高价值紫卡参考 (未洗中位价)')
    .alias('weeklyriven')
    .alias('周紫卡')
    .alias('周卡')
    .action(wf.weeklyRivenCommand)
  ctx.command('riven-hot', '热门紫卡').alias('hotriven').action(miscs.hotRivenCommand)
  ctx
    .command('pmod-history', 'Primed MOD 历史')
    .alias('pmodhistory')
    .alias('pmod')
    .alias('P卡')
    .alias('p卡')
    .alias('P卡历史')
    .alias('p卡历史')
    .action(wfm.pmodhistoryCommand)
}
