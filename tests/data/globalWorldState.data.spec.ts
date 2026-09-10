import type { GlobalWorldStateData } from '../../src/warframe/data/wf/globalWorldState'
import { expect } from 'chai'
import {
  globalWorldState,
  globalWorldStateFactory,
  overrideGlobalWorldState,
} from '../../src/warframe/data/wf/globalWorldState'
import {
  extractEventsRaw,
  extractInvasionsRaw,
  extractSortieRaw,
  extractSyndicateMissionsRaw,
} from '../../src/warframe/infrastructure/wf/wf-api'
import { createAsyncCache } from '../../src/warframe/utils'
import worldStateJSON from '../assets/example-world-state.json'
import 'reflect-metadata'

function sortedByTier(fissures: GlobalWorldStateData['fissures']): number[] {
  return fissures.map(fissure => fissure.tierNum)
}

describe('globalWorldStateFactory', () => {
  it('throws when the provided payload is empty', async () => {
    try {
      await globalWorldStateFactory('')
      expect.fail('expected empty JSON to throw')
    }
    catch (error) {
      expect((error as Error).message).to.equal('获取游戏信息失败')
    }
  })

  it('builds categorized fissures and raw extracts from fixture JSON', async () => {
    const json = JSON.stringify(worldStateJSON)
    const result = await globalWorldStateFactory(json)

    expect(result.eventsRaw).to.deep.equal(extractEventsRaw(json))
    expect(result.invasionsRaw).to.deep.equal(extractInvasionsRaw(json))
    expect(result.syndicateMissionsRaw).to.deep.equal(extractSyndicateMissionsRaw(json))
    expect(result.sortieRaw).to.deep.equal(extractSortieRaw(json))
    expect(result.seasonInfoRaw).to.not.equal(undefined)
    expect(result.calendarRaw).to.not.equal(undefined)
    expect(result.raw.fissures.length).to.equal(
      result.fissures.length + result.spFissures.length + result.rjFissures.length,
    )

    expect(result.fissures.length).to.be.greaterThan(0)
    expect(result.spFissures.length).to.be.greaterThan(0)
    expect(result.rjFissures.length).to.be.greaterThan(0)

    expect(result.fissures.every(fissure => fissure.category === 'fissures')).to.equal(true)
    expect(result.spFissures.every(fissure => fissure.category === 'sp-fissures' && fissure.hard)).to.equal(true)
    expect(result.rjFissures.every(fissure => fissure.category === 'rj-fissures')).to.equal(true)

    expect(sortedByTier(result.fissures)).to.deep.equal(
      [...sortedByTier(result.fissures)].sort((a, b) => a - b),
    )
    expect(sortedByTier(result.spFissures)).to.deep.equal(
      [...sortedByTier(result.spFissures)].sort((a, b) => a - b),
    )
    expect(sortedByTier(result.rjFissures)).to.deep.equal(
      [...sortedByTier(result.rjFissures)].sort((a, b) => a - b),
    )
    expect(result.fissures[0].node.system).to.be.a('string').and.not.equal('')
  })
})

describe('overrideGlobalWorldState', () => {
  it('replaces the singleton cache used by get()', async () => {
    const previous = globalWorldState
    const stub = {
      raw: {} as GlobalWorldStateData['raw'],
      syndicateMissionsRaw: [],
      seasonInfoRaw: undefined,
      sortieRaw: undefined,
      invasionsRaw: [],
      calendarRaw: undefined,
      eventsRaw: [],
      fissures: [],
      spFissures: [],
      rjFissures: [],
    } satisfies GlobalWorldStateData

    try {
      overrideGlobalWorldState(createAsyncCache(async () => stub, -1))
      expect(await globalWorldState.get()).to.equal(stub)
    }
    finally {
      overrideGlobalWorldState(previous)
    }
  })
})
