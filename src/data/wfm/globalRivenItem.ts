import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, listToDict } from '../../utils'

export const globalRivenItemData = createAsyncCache(async () => {
  const rivenData = await wfmClient.rivens.getItems()
  if (!rivenData) {
    throw new Error('Failed to fetch riven items from Warframe Market API.')
  }

  const data = rivenData

  const globalRivenItemList = data
  const globalRivenItemDict = listToDict(data, i => [i.slug])

  return {
    globalRivenItemList,
    globalRivenItemDict,
  }
}, -1)
