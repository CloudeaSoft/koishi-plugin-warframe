export const warframeErrorCodes = [
  'common.fetchFailed',
  'relic.invalidName',
  'relic.dataLoading',
  'relic.notFound',
  'arbitration.invalidDayRange',
  'bounty.unavailable',
  'voidTrader.drifting',
  'voidTrader.arriving',
  'riven.imageFetchFailed',
  'riven.imageParseFailed',
  'riven.weaponNotFound',
  'riven.dispositionError',
  'riven.weaponTypeError',
  'riven.statTypeError',
  'wfm.inputItemName',
  'wfm.itemNotFound',
  'wfm.orderFetchFailed',
  'wfm.noOnlineSeller',
  'wfm.rivenWeaponNotFound',
  'wfm.rivenOrderFetchFailed',
  'wfm.noOnlineRivenSeller',
  'miscs.hotRiven.noData',
  'miscs.hotRiven.fetchFailed',
] as const

export type WarframeErrorCode = typeof warframeErrorCodes[number]
export type WarframeErrorParams = Record<string, string | number>

export interface WarframeError {
  code: WarframeErrorCode
  retryable: boolean
  params?: WarframeErrorParams
}

export interface WarframeFailure {
  ok: false
  error: WarframeError
}

export type WarframeResult<TData>
  = | { ok: true, data: TData }
    | WarframeFailure

export function failure(
  code: WarframeErrorCode,
  retryable: boolean = false,
  params?: WarframeErrorParams,
): WarframeFailure {
  return {
    ok: false,
    error: {
      code,
      retryable,
      ...(params ? { params } : {}),
    },
  }
}
