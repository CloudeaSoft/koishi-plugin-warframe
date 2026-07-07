import type { RivenAttribute } from '../../types/wfm'
import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, listToDict } from '../../utils'

export async function globalRivenAttributeFactory(rivenAttributeData?: RivenAttribute[]) {
  rivenAttributeData ??= await wfmClient.rivens.getAttributes()
  if (!rivenAttributeData) {
    throw new Error(
      'Failed to fetch riven attributes from Warframe Market API.',
    )
  }
  const data = rivenAttributeData

  const globalRivenAttributeList = data
  const globalRivenAttributeDict = listToDict<RivenAttribute>(data, a => [
    a.slug,
  ])

  return {
    globalRivenAttributeList,
    globalRivenAttributeDict,
  }
}

export let globalRivenAttribute = createAsyncCache(
  globalRivenAttributeFactory,
  -1,
)

export function overrideGlobalRivenAttribute(cache: AsyncCache<{
  globalRivenAttributeList: RivenAttribute[]
  globalRivenAttributeDict: {
    [key: string]: RivenAttribute
  }
}>) {
  globalRivenAttribute = cache
}
