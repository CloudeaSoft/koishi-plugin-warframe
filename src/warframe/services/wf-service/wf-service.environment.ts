import { globalWorldState } from '../../data/wf/globalWorldState'

export async function getEnvironment(): Promise<string> {
  const { raw: worldState } = await globalWorldState.get()
  if (!worldState) {
    return '内部错误，获取最新信息失败'
  }

  const cetusDay = worldState.cetusCycle.isDay ? '白天' : '黑夜'
  const cetus = `地球/夜灵平野: ${cetusDay} ${worldState.cetusCycle.timeLeft}`

  const vallisState = worldState.vallisCycle.isWarm ? '温暖' : '寒冷'
  const vallis = `奥布山谷: ${vallisState} ${worldState.vallisCycle.timeLeft}`

  const cambionState = worldState.cambionCycle.state
    ? worldState.cambionCycle.state.charAt(0).toUpperCase()
    + worldState.cambionCycle.state.slice(1)
    : '未知'
  const cambion = `魔胎之境: ${cambionState} ${worldState.cambionCycle.timeLeft}`

  const duviriStateTransDict = {
    sorrow: '悲伤',
    fear: '恐惧',
    joy: '喜悦',
    anger: '愤怒',
    envy: '嫉妒',
  }
  const duviriState
    = duviriStateTransDict[
      worldState.duviriCycle.state as keyof typeof duviriStateTransDict
    ] ?? worldState.duviriCycle.state
  const duviri = `双衍王境: ${duviriState} ${worldState.duviriCycle.endString}`

  const zarimanFaction = worldState.zarimanCycle.isCorpus
    ? 'Corpus'
    : 'Grineer'
  const zariman = `扎里曼号: ${zarimanFaction} ${worldState.zarimanCycle.timeLeft}`

  return `当前环境:\n${cetus}\n${vallis}\n${cambion}\n${duviri}\n${zariman}`
}
