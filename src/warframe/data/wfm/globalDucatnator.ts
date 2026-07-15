import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, listToDict } from '../../utils'

export const globalDucatnatorIDDict = createAsyncCache(async () => {
  const data = await wfmClient.tools.getDucatnator()
  if (!data) {
    return undefined
  }

  return listToDict(data.hour, d => [d.item])
}, 3600_000)
