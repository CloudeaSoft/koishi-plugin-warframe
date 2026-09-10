import type { AsyncCache, Ducatnator } from '../../types'
import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, listToDict } from '../../utils'

interface DucatnatorSnapshot {
  hour: Ducatnator[]
  day?: Ducatnator[]
}

export async function globalDucatnatorIDDictFactory(
  data?: DucatnatorSnapshot,
): Promise<Record<string, Ducatnator> | undefined> {
  data ??= await wfmClient.tools.getDucatnator()
  if (!data) {
    return undefined
  }

  return listToDict(data.hour, d => [d.item])
}

export let globalDucatnatorIDDict = createAsyncCache(
  globalDucatnatorIDDictFactory,
  3600_000,
)

export function overrideGlobalDucatnatorIDDict(
  cache: AsyncCache<Record<string, Ducatnator> | undefined>,
): void {
  globalDucatnatorIDDict = cache
}
