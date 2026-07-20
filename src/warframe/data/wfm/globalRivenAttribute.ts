import type { AsyncCache, RivenAttribute } from '../../types'
import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, listToDict } from '../../utils'

export async function globalRivenAttributeFactory(
  rivenAttributeData?: RivenAttribute[],
): Promise<{
  globalRivenAttributeList: RivenAttribute[]
  globalRivenAttributeDict: Record<string, RivenAttribute>
}> {
  rivenAttributeData ??= await wfmClient.rivens.listAttributes()
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
}>): void {
  globalRivenAttribute = cache
}
