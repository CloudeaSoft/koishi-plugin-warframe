import type { AsyncCache, Ducatnator } from '../../types'
import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, listToDict } from '../../utils'

export let globalDucatnatorIDDict = createAsyncCache(async () => {
  const data = await wfmClient.tools.getDucatnator()
  if (!data) {
    return undefined
  }

  return listToDict(data.hour, d => [d.item])
}, 3600_000)

export function overrideGlobalDucatnatorIDDict(
  cache: AsyncCache<Record<string, Ducatnator> | undefined>,
): void {
  globalDucatnatorIDDict = cache
}
