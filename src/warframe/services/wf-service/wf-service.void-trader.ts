import type { VoidTrader, WarframeResult } from '../../types'

import { globalWorldState } from '../../data/wf/globalWorldState'
import { getVoidTraderItem } from '../../infrastructure/wf/wfcd-adapter'
import { failure } from '../../types/warframe-result'
import { msToHumanReadable } from '../../utils'

export async function getVoidTrader(): Promise<WarframeResult<VoidTrader>> {
  const { raw: worldState } = await globalWorldState.get()
  if (worldState.voidTraders.length === 0) {
    return failure('voidTrader.drifting')
  }

  const trader = worldState.voidTraders[0]

  if (trader && trader.activation && trader.activation.getTime() > Date.now()) {
    const diff = trader.activation.getTime() - Date.now()
    return failure('voidTrader.arriving', false, { time: msToHumanReadable(diff) })
  }

  const diff = trader.expiry!.getTime() - Date.now()
  const items = trader.inventory.map(getVoidTraderItem)

  return { ok: true, data: { expiry: msToHumanReadable(diff), items } }
}
