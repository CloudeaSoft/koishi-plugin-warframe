import type { Argv, Dict } from 'koishi'
import type { PluginDependencies } from '../types/config'
import {
  ArbitrationComponent,
  CircuitComponent,
  FissureComponent,
  RelicComponent,
  RivenComponent,
  RivenStatComponent,
  VoidTraderComponent,
  WeeklyComponent,
  WeeklyRivenComponent,
} from '../components/wf'
import {
  applyRelicData,
  getAnalyzedRiven,
  getArbitrations,
  getCircuitWeek,
  getEnvironment,
  getFissures,
  getRailjackFissures,
  getRelic,
  getStaticRivenStats,
  getSteelPathFissures,
  getVoidTrader,
  getWeekly,
  getWeeklyRivens,
} from '../services'

export function createWfCommands(deps: PluginDependencies): {
  arbitrationCommand: (_action: Argv, input?: number) => Promise<string>
  circuitCommand: (_action: Argv) => Promise<string>
  voidtraderCommand: (_action: Argv) => Promise<string>
  fissureCommand: (_action: Argv) => Promise<string>
  steelPathFissureCommand: (_action: Argv) => Promise<string>
  railjackFissureCommand: (_action: Argv) => Promise<string>
  relicCommand: (_action: Argv, input: string) => Promise<string>
  rivenCommand: (_action: Argv, input: Dict) => Promise<string>
  rivenStatCommand: (
    _action: Argv,
    weaponType: string,
    statType: string,
    disposition: number,
  ) => Promise<string>
  weeklyCommand: (_action: Argv) => Promise<string>
  weeklyRivenCommand: (_action: Argv, minPrice?: number) => Promise<string>
  environmentCommand: () => Promise<string>
} {
  const { config, render } = deps

  return {
    arbitrationCommand: async (_action: Argv, input?: number) => {
      const result = getArbitrations(input)
      if (!result.ok) {
        return result.message
      }

      return render(ArbitrationComponent(result.data))
    },

    circuitCommand: async (_action: Argv) => {
      const result = getCircuitWeek()
      return render(
        CircuitComponent(
          result.currentIncarnons,
          result.currentWarframes,
          result.allIncarnons,
          result.allWarframes,
        ),
      )
    },

    voidtraderCommand: async (_action: Argv) => {
      const result = await getVoidTrader()
      if (!result.ok) {
        return result.message
      }

      return render(VoidTraderComponent(result.data))
    },

    fissureCommand: async (_action: Argv) => {
      const result = await getFissures()
      if (!result.ok) {
        return result.message
      }

      return render(FissureComponent(result.data, 'fissure'))
    },

    steelPathFissureCommand: async (_action: Argv) => {
      const result = await getSteelPathFissures()
      if (!result.ok) {
        return result.message
      }

      return render(FissureComponent(result.data, 'sp-fissure'))
    },

    railjackFissureCommand: async (_action: Argv) => {
      const result = await getRailjackFissures()
      if (!result.ok) {
        return result.message
      }

      return render(FissureComponent(result.data, 'rj-fissure'))
    },

    relicCommand: async (_action: Argv, input: string) => {
      const result = await getRelic(input)
      if (!result.ok) {
        return result.message
      }
      const relic = await applyRelicData(result.data)

      return render(RelicComponent(relic))
    },

    rivenCommand: async (_action: Argv, input: Dict) => {
      // input example
      // {
      //   src: 'https://multimedia.nt.qq.com.cn/download?appid=1407&fileid=EhSbiKlNhenZ15S4s8g3fKbWnigO_xiq1zQg_woo_ITZ2cPTkQMyBHByb2RQgL2jAVoQYr6GFTzpYU9ru9vH3KRquXoCnkGCAQJuag&rkey=CAISONPsN0nSR8aLvM1wiFc17l9Vp25vzGKOI3P88HGlfq2gum-kDb4TI0oJR8m_2-p4vB6cudJCb-C-&spec=0'
      // }

      if (!input?.src) {
        return '未检测到图片'
      }

      if (!config.ocrAPISecret?.id || !config.ocrAPISecret?.key) {
        return '未配置 OCR，请在插件设置中配置。'
      }

      const result = await getAnalyzedRiven(
        config.ocrAPISecret,
        input.src as string,
      )
      if (!result.ok) {
        return result.message
      }

      return render(RivenComponent(result.data))
    },

    rivenStatCommand: async (
      _action: Argv,
      weaponType: string,
      statType: string,
      disposition: number,
    ) => {
      if (!weaponType || !statType || !disposition) {
        return '请输入正确参数'
      }

      const result = await getStaticRivenStats(weaponType, statType, disposition)
      if (!result.ok) {
        return result.message
      }

      return render(RivenStatComponent(result.data))
    },

    weeklyCommand: async (_action: Argv) => {
      const result = await getWeekly()
      if (!result.ok) {
        return result.message
      }

      return render(
        WeeklyComponent(
          result.data.archonHunt,
          result.data.deepArchimedea,
          result.data.temporalArchimedea,
        ),
      )
    },

    weeklyRivenCommand: async (_action: Argv, minPrice?: number) => {
      const threshold = minPrice && minPrice > 0 ? minPrice : 100
      const result = await getWeeklyRivens(threshold)
      if (result.length === 0) {
        return '没有找到符合条件的紫卡参考数据'
      }

      return render(WeeklyRivenComponent(result.slice(0, 20), threshold))
    },

    environmentCommand: async () => {
      return getEnvironment()
    },
  }
}
