import type { AsyncCache, OracleBountyCycle } from '../../types'
import { fetchOracleBountyCycle } from '../../infrastructure/wf/wf-api'
import { createAsyncCache } from '../../utils'

async function globalOracleBountyCycleFactory(): Promise<OracleBountyCycle | undefined> {
  return fetchOracleBountyCycle()
}

export let globalOracleBountyCycle = createAsyncCache(
  globalOracleBountyCycleFactory,
  60_000,
)

export function overrideGlobalOracleBountyCycle(
  cache: AsyncCache<OracleBountyCycle | undefined>,
): void {
  globalOracleBountyCycle = cache
}
