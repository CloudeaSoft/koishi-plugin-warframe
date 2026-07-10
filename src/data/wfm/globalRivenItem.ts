import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, listToDict, normalizeName } from '../../utils'

export const globalRivenItemData = createAsyncCache(async () => {
  const rivenData = await wfmClient.rivens.getItems()
  if (!rivenData) {
    throw new Error('Failed to fetch riven items from Warframe Market API.')
  }

  const data = rivenData

  const globalRivenItemList = data
  const globalRivenItemDict = listToDict(data, i => [i.slug])
  const globalRivenItemNameToSlugDict: Record<string, string> = ((list) => {
    const result: Record<string, string> = {}
    for (const item of list) {
      const zhName = item.i18n?.['zh-hans']?.name
      if (zhName) {
        result[normalizeName(zhName)] = item.slug
      }
      const enName = item.i18n?.en?.name
      if (enName) {
        result[normalizeName(enName)] = item.slug
      }
    }
    return result
  })(data)

  return {
    globalRivenItemList,
    globalRivenItemDict,
    globalRivenItemNameToSlugDict,
  }
}, -1)
