import type { WarframeFailure } from './warframe'

export const messages = {
  'common.fetchFailed': '内部错误，获取最新信息失败',

  'relic.invalidName': '请提供正确的遗物名称',
  'relic.dataLoading': '遗物数据未加载完成，请稍后再试',
  'relic.notFound': '未找到对应遗物信息',

  'arbitration.invalidDayRange': '天数需小于等于14且大于0',

  'bounty.unavailable': '当前该地点暂无可用赏金',

  'voidTrader.drifting': '虚空商人仍在未知地带漂流...',
  'voidTrader.arriving': '距离虚空商人到达还有: {time}',

  'riven.imageNotFound': '未检测到图片',
  'riven.ocrNotConfigured': '未配置 OCR，请在插件设置中配置。',
  'riven.imageFetchFailed': '获取图片失败',
  'riven.imageParseFailed': '解析图片失败',
  'riven.weaponNotFound': '未找到武器: {weapon}',
  'riven.dispositionError': '裂罅倾向错误',
  'riven.weaponTypeError': '武器类型错误',
  'riven.statTypeError': '词条类型错误',
  'riven.invalidParams': '请输入正确参数',
  'riven.noWeeklyData': '没有找到符合条件的紫卡参考数据',

  'wfm.inputItemName': '请输入物品名称',
  'wfm.itemNotFound': '未找到物品: {input}',
  'wfm.orderFetchFailed': '订单获取失败，请稍后重试',
  'wfm.noOnlineSeller': '当前没有在线游戏中的卖家',
  'wfm.rivenWeaponNotFound': '未找到紫卡武器: {input}',
  'wfm.rivenOrderFetchFailed': '紫卡订单获取失败，请稍后重试',
  'wfm.noOnlineRivenSeller': '当前没有在线出售的紫卡',

  'miscs.hotRiven.noData': '暂无热门紫卡数据',
  'miscs.hotRiven.fetchFailed': '获取热门紫卡数据失败',
  'miscs.inDevelopment': '功能暂未开放',
} as const

export type MessageKey = keyof typeof messages
export type MessageParams = Record<string, string | number>

export function t(message: MessageKey, params?: MessageParams): string
export function t(result: WarframeFailure): string
export function t(
  messageOrResult: MessageKey | WarframeFailure,
  params?: MessageParams,
): string {
  if (typeof messageOrResult !== 'string') {
    return t(messageOrResult.error.code, messageOrResult.error.params)
  }

  let text: string = messages[messageOrResult]
  for (const [key, value] of Object.entries(params ?? {})) {
    text = text.replaceAll(`{${key}}`, String(value))
  }
  return text
}
