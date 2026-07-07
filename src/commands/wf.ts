import { Argv, Dict } from "koishi";
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
} from "../services";
import {
  ArbitrationComponent,
  CircuitComponent,
  FissureComponent,
  RelicComponent,
  RivenComponent,
  RivenStatComponent,
  VoidTraderComponent,
  WeeklyComponent,
} from "../components/wf";
import type { PluginDependencies } from "../types/config";

export function createWfCommands(deps: PluginDependencies) {
  const { config, render } = deps;

  return {
    arbitrationCommand: async (_action: Argv, input?: number) => {
      const result = getArbitrations(input);
      if (!result) {
        return "获取失败, 请稍后再试";
      }

      if (typeof result === "string") {
        return result;
      }

      return await render(ArbitrationComponent(result));
    },

    circuitCommand: async (_action: Argv) => {
      const result = getCircuitWeek();
      return await render(
        CircuitComponent(
          result.currentIncarnons,
          result.currentWarframes,
          result.allIncarnons,
          result.allWarframes,
        ),
      );
    },

    voidtraderCommand: async (_action: Argv) => {
      const result = await getVoidTrader();
      if (typeof result === "string") {
        return result;
      }

      return await render(VoidTraderComponent(result));
    },

    fissureCommand: async (_action: Argv) => {
      const result = await getFissures();
      if (!result) {
        return "内部错误";
      }

      if (typeof result === "string") {
        return result;
      }

      return await render(FissureComponent(result, "fissure"));
    },

    steelPathFissureCommand: async (_action: Argv) => {
      const result = await getSteelPathFissures();
      if (!result) {
        return "内部错误";
      }

      if (typeof result === "string") {
        return result;
      }

      return await render(FissureComponent(result, "sp-fissure"));
    },

    railjackFissureCommand: async (_action: Argv) => {
      const result = await getRailjackFissures();
      if (!result) {
        return "内部错误";
      }

      if (typeof result === "string") {
        return result;
      }

      return await render(FissureComponent(result, "rj-fissure"));
    },

    relicCommand: async (_action: Argv, input: string) => {
      const result = await getRelic(input);
      if (typeof result === "string") {
        return result;
      }
      const relic = await applyRelicData(result);

      return await render(RelicComponent(relic));
    },

    rivenCommand: async (_action: Argv, input: Dict) => {
      // input example
      // {
      //   src: 'https://multimedia.nt.qq.com.cn/download?appid=1407&fileid=EhSbiKlNhenZ15S4s8g3fKbWnigO_xiq1zQg_woo_ITZ2cPTkQMyBHByb2RQgL2jAVoQYr6GFTzpYU9ru9vH3KRquXoCnkGCAQJuag&rkey=CAISONPsN0nSR8aLvM1wiFc17l9Vp25vzGKOI3P88HGlfq2gum-kDb4TI0oJR8m_2-p4vB6cudJCb-C-&spec=0'
      // }

      if (!input?.src) {
        return "未检测到图片";
      }

      const result = await getAnalyzedRiven(
        config.ocrAPISecret,
        input.src as string,
      );
      if (typeof result === "string") {
        return result;
      }

      return await render(RivenComponent(result));
    },

    rivenStatCommand: async (
      _action: Argv,
      weaponType: string,
      statType: string,
      disposition: number,
    ) => {
      if (!weaponType || !statType || !disposition) {
        return "请输入正确参数";
      }

      const result = await getStaticRivenStats(weaponType, statType, disposition);
      if (typeof result === "string") {
        return result;
      }

      return await render(RivenStatComponent(result));
    },

    weeklyCommand: async (_action: Argv) => {
      const result = await getWeekly();
      if (!result) {
        return "内部错误";
      }

      if (typeof result === "string") {
        return result;
      }

      return await render(
        WeeklyComponent(
          result.archonHunt,
          result.deepArchimedea,
          result.temporalArchimedea,
        ),
      );
    },

    environmentCommand: async () => {
      return await getEnvironment();
    },
  };
}
