import type WorldState from 'warframe-worldstate-parser'

import { expect } from 'chai'

import {
  createWorldStateRefresher,
  diffWorldStates,
} from '../../../src/warframe/services/world-state-refresh'

type WorldStateSnapshot = Parameters<typeof diffWorldStates>[0]

function snapshot(raw: Partial<WorldState>): WorldStateSnapshot {
  return {
    raw: {
      timestamp: new Date('2026-07-16T00:05:00Z'),
      fissures: [],
      voidTraders: [],
      dailyDeals: [],
      alerts: [],
      ...raw,
    } as WorldState,
    fissures: [],
    spFissures: [],
    rjFissures: [],
  }
}

describe('world-state change detection', () => {
  it('returns newly added fissures, daily deals, and alerts', () => {
    const previous = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
    })
    const current = snapshot({
      fissures: [{
        id: 'f1',
        tier: 'Lith',
        node: 'E Prime',
        missionType: 'Exterminate',
        isHard: false,
        isStorm: false,
        activation: new Date('2026-07-16T00:01:00Z'),
        expiry: new Date('2026-07-16T01:01:00Z'),
      }],
      dailyDeals: [{
        id: 'd1',
        item: 'Braton',
        uniqueName: '/Lotus/Weapons/Braton',
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
        activation: new Date('2026-07-16T00:01:00Z'),
        expiry: new Date('2026-07-17T00:01:00Z'),
      }],
      alerts: [{
        id: 'a1',
        description: 'Gift from the Lotus',
        mission: {
          node: 'Earth',
          nodeKey: 'SolNode1',
          type: 'Defense',
          reward: { items: ['Forma'], countedItems: [], credits: 0 },
        },
        activation: new Date('2026-07-16T00:01:00Z'),
        expiry: new Date('2026-07-16T01:01:00Z'),
      }],
    } as unknown as Partial<WorldState>)

    expect(diffWorldStates(previous, current)).to.deep.equal([
      {
        type: 'fissure',
        id: 'f1',
        tier: 'Lith',
        node: 'E Prime',
        missionType: 'Exterminate',
        category: 'normal',
        expiry: new Date('2026-07-16T01:01:00Z').getTime(),
      },
      {
        type: 'daily-deal',
        id: 'd1',
        item: 'Braton',
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
        expiry: new Date('2026-07-17T00:01:00Z').getTime(),
      },
      {
        type: 'alert',
        id: 'a1',
        description: 'Gift from the Lotus',
        node: 'Earth',
        missionType: 'Defense',
        reward: 'Forma',
        expiry: new Date('2026-07-16T01:01:00Z').getTime(),
      },
    ])
  })

  it('uses the first refresh as a silent baseline and compares later refreshes', async () => {
    const first = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
    })
    const second = snapshot({
      timestamp: new Date('2026-07-16T00:05:00Z'),
      dailyDeals: [{
        id: 'd1',
        item: 'Braton',
        uniqueName: '/Lotus/Weapons/Braton',
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
      }],
    } as unknown as Partial<WorldState>)
    const values = [first, second]
    const refresh = createWorldStateRefresher({
      update: async () => values.shift()!,
    })

    expect(await refresh()).to.deep.equal([])
    expect((await refresh()).map(item => item.type)).to.deep.equal([
      'daily-deal',
    ])
  })

  it('detects a Void Trader only when activation crosses snapshot timestamps', () => {
    const trader = {
      id: 'v1',
      character: "Baro Ki'Teer",
      location: 'Mercury Relay',
      activation: new Date('2026-07-16T00:03:00Z'),
      expiry: new Date('2026-07-18T00:03:00Z'),
    }
    const previous = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
      voidTraders: [trader],
    } as unknown as Partial<WorldState>)
    const current = snapshot({
      timestamp: new Date('2026-07-16T00:05:00Z'),
      voidTraders: [trader],
    } as unknown as Partial<WorldState>)

    expect(diffWorldStates(previous, current)).to.deep.equal([{
      type: 'void-trader',
      id: 'v1',
      character: "Baro Ki'Teer",
      location: 'Mercury Relay',
      expiry: trader.expiry.getTime(),
    }])
  })

  it('does not report removals or unchanged entries', () => {
    const deal = {
      id: 'd1',
      item: 'Braton',
      uniqueName: '/Lotus/Weapons/Braton',
      originalPrice: 225,
      salePrice: 157,
      discount: 30,
    }
    const withDeal = snapshot({
      dailyDeals: [deal],
    } as unknown as Partial<WorldState>)

    expect(diffWorldStates(withDeal, withDeal)).to.deep.equal([])
    expect(diffWorldStates(withDeal, snapshot({ dailyDeals: [] }))).to.deep.equal([])
  })

  it('uses deterministic identities when parser IDs are absent', () => {
    const fissure = {
      tier: 'Axi',
      node: 'Hydron',
      missionType: 'Defense',
      isHard: true,
      isStorm: false,
      activation: new Date('2026-07-16T00:01:00Z'),
      expiry: new Date('2026-07-16T01:01:00Z'),
    }
    const previous = snapshot({ fissures: [fissure] } as unknown as Partial<WorldState>)
    const current = snapshot({ fissures: [{ ...fissure }] } as unknown as Partial<WorldState>)

    expect(diffWorldStates(previous, current)).to.deep.equal([])
  })
})
