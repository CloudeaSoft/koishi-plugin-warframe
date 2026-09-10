import type { Ducatnator } from '../../src/warframe/types'
import { expect } from 'chai'
import {
  globalDucatnatorIDDict,
  globalDucatnatorIDDictFactory,
  overrideGlobalDucatnatorIDDict,
} from '../../src/warframe/data/wfm/globalDucatnator'
import { createAsyncCache } from '../../src/warframe/utils'

function ducat(overrides: Partial<Ducatnator> & Pick<Ducatnator, 'item'>): Ducatnator {
  return {
    datetime: '2026-01-01T00:00:00.000Z',
    position_change_month: 0,
    position_change_week: 0,
    position_change_day: 0,
    plat_worth: 0,
    volume: 0,
    ducats_per_platinum: 0,
    ducats_per_platinum_wa: 0,
    ducats: 45,
    median: 12,
    wa_price: 0,
    id: overrides.item,
    ...overrides,
  }
}

describe('globalDucatnatorIDDictFactory', () => {
  it('indexes hour entries by item and ignores day entries', async () => {
    const hourItem = ducat({ item: 'hour-id', median: 8, ducats: 15 })
    const dayItem = ducat({ item: 'day-id', median: 99, ducats: 100 })
    const result = await globalDucatnatorIDDictFactory({
      hour: [hourItem],
      day: [dayItem],
    })

    expect(result).to.deep.equal({
      'hour-id': hourItem,
    })
    expect(result?.['day-id']).to.equal(undefined)
  })

  it('returns an empty dict for an empty hour list', async () => {
    const result = await globalDucatnatorIDDictFactory({
      hour: [],
      day: [ducat({ item: 'day-only' })],
    })

    expect(result).to.deep.equal({})
  })

  it('keeps the last row when hour entries share an item key', async () => {
    const first = ducat({ item: 'shared-id', median: 1, id: 'first' })
    const second = ducat({ item: 'shared-id', median: 2, id: 'second' })
    const result = await globalDucatnatorIDDictFactory({
      hour: [first, second],
      day: [],
    })

    expect(result?.['shared-id']).to.equal(second)
    expect(Object.keys(result ?? {})).to.deep.equal(['shared-id'])
  })

  it('skips hour entries whose item key is empty', async () => {
    const named = ducat({ item: 'kept-id', median: 7 })
    const result = await globalDucatnatorIDDictFactory({
      hour: [ducat({ item: '' }), named],
      day: [],
    })

    expect(result).to.deep.equal({
      'kept-id': named,
    })
  })
})

describe('overrideGlobalDucatnatorIDDict', () => {
  it('replaces the singleton cache used by get()', async () => {
    const previous = globalDucatnatorIDDict
    const stub = {
      'stub-id': ducat({ item: 'stub-id', median: 3 }),
    }

    try {
      overrideGlobalDucatnatorIDDict(createAsyncCache(async () => stub, -1))
      expect(await globalDucatnatorIDDict.get()).to.equal(stub)
    }
    finally {
      overrideGlobalDucatnatorIDDict(previous)
    }
  })
})
