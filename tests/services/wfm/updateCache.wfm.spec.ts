import { expect } from 'chai'
import { overrideGlobalDucatnatorIDDict } from '../../../src/warframe/data/wfm/globalDucatnator'
import { overrideGlobalItemData } from '../../../src/warframe/data/wfm/globalItem'
import { overrideGlobalRivenAttribute } from '../../../src/warframe/data/wfm/globalRivenAttribute'
import { overrideGlobalRivenItemData } from '../../../src/warframe/data/wfm/globalRivenItem'
import { updateCache } from '../../../src/warframe/services/wfm-service'
import { createAsyncCache } from '../../../src/warframe/utils'

function stubSuccessCaches(): void {
  overrideGlobalItemData(createAsyncCache(async () => ({
    globalItemList: [],
    globalItemDict: {},
    globalItemNameToSlugDict: {},
    globalItemGameRefDict: {},
    globalItemWordPrefixCandidates: [],
  }), -1))
  overrideGlobalRivenAttribute(createAsyncCache(async () => ({
    globalRivenAttributeList: [],
    globalRivenAttributeDict: {},
  }), -1))
  overrideGlobalRivenItemData(createAsyncCache(async () => ({
    globalRivenItemList: [],
    globalRivenItemDict: {},
    globalRivenItemNameToSlugDict: {},
    globalRivenItemWordPrefixCandidates: [],
  }), -1))
}

describe('updateCache', () => {
  it('reports failure when a cache update resolves to undefined without throwing', async () => {
    stubSuccessCaches()
    overrideGlobalDucatnatorIDDict(createAsyncCache(async () => undefined, -1))

    const report = await updateCache()

    expect(report).to.include('globalDucatnatorIDDict: 失败')
    expect(report).to.not.match(/globalDucatnatorIDDict: 成功/)
  })

  it('reports thrown errors as failures with the error message', async () => {
    stubSuccessCaches()
    overrideGlobalDucatnatorIDDict(createAsyncCache(async () => ({
      item: {
        datetime: new Date(0),
        position_change_month: 0,
        position_change_week: 0,
        position_change_day: 0,
        plat_worth: 0,
        volume: 0,
        ducats_per_platinum: 0,
        ducats_per_platinum_wa: 0,
        item: 'item',
        ducats: 0,
        median: 1,
        wa_price: 0,
        id: '1',
      },
    }), -1))
    overrideGlobalRivenAttribute(createAsyncCache(async () => {
      throw new Error('attribute fetch failed')
    }, -1))

    const report = await updateCache()

    expect(report).to.include('globalRivenAttribute: 失败 - attribute fetch failed')
    expect(report).to.include('globalDucatnatorIDDict: 成功')
  })

  it('reports success when all cache updates return data', async () => {
    stubSuccessCaches()
    overrideGlobalDucatnatorIDDict(createAsyncCache(async () => ({}), -1))

    const report = await updateCache()

    expect(report).to.equal([
      'globalItemData: 成功',
      'globalRivenAttribute: 成功',
      'globalRivenItemData: 成功',
      'globalDucatnatorIDDict: 成功',
    ].join('\n'))
  })
})
