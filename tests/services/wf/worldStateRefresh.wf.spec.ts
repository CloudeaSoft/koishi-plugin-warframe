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
    syndicateMissionsRaw: [],
    seasonInfoRaw: undefined,
    sortieRaw: undefined,
    invasionsRaw: [],
    calendarRaw: undefined,
    eventsRaw: [],
  }
}

describe('world-state change detection', () => {
  it('returns newly added fissures with localized region data', async () => {
    const previous = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
    })
    const current = snapshot({
      fissures: [{
        id: 'f1',
        tier: 'Lith',
        tierNum: 1,
        node: 'E Prime',
        nodeKey: 'E Prime (Earth)',
        missionType: 'Exterminate',
        isHard: false,
        isStorm: false,
        activation: new Date('2026-07-16T00:01:00Z'),
        expiry: new Date('2026-07-16T01:01:00Z'),
      }],
      dailyDeals: [{
        id: 'd1',
        item: 'Braton',
        uniqueName: '/Lotus/StoreItems/Weapons/Tenno/Rifle/Rifle',
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
          node: 'E Prime (Earth)',
          nodeKey: 'E Prime (Earth)',
          type: 'Defense',
          reward: {
            items: ['Fieldron'],
            countedItems: [{ key: 'Marks of Valiance', type: 'Marks of Valiance', count: 20 }],
            credits: 1000,
          },
        },
        activation: new Date('2026-07-16T00:01:00Z'),
        expiry: new Date('2026-07-16T01:01:00Z'),
      }],
    } as unknown as Partial<WorldState>)

    expect(await diffWorldStates(previous, current)).to.deep.equal([
      {
        type: 'fissure',
        id: 'f1',
        tier: '古纪',
        tierNum: 1,
        node: {
          name: 'E Prime',
          system: '地球',
          type: '歼灭',
          faction: 'Grineer',
          minLevel: 1,
          maxLevel: 3,
        },
        hard: false,
        category: 'normal',
        expiry: new Date('2026-07-16T01:01:00Z').getTime(),
      },
      {
        type: 'daily-deal',
        id: 'd1',
        item: '布莱顿',
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
        expiry: new Date('2026-07-17T00:01:00Z').getTime(),
      },
      {
        type: 'alert',
        id: 'a1',
        description: 'Lotus 的赏赐',
        node: 'E Prime (地球)',
        missionType: '防御',
        reward: '电磁力场装置、英勇徽章 x20、1000 现金',
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
        activation: new Date('2026-07-16T00:03:00Z'),
        expiry: new Date('2026-07-17T00:03:00Z'),
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

  it('detects a Void Trader only when activation crosses snapshot timestamps', async () => {
    const trader = {
      id: 'v1',
      character: 'Baro Ki\'Teer',
      location: 'Mercury Relay',
      activation: new Date('2026-07-16T00:03:00Z'),
      expiry: new Date('2026-07-18T00:03:00Z'),
      inventory: [
        { uniqueName: '/Lotus/StoreItems/Weapons/VoidTrader/PrismaGrakata', item: 'Prisma Grakata', ducats: 150, credits: 100000 },
      ],
    }
    const previous = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
      voidTraders: [trader],
    } as unknown as Partial<WorldState>)
    const current = snapshot({
      timestamp: new Date('2026-07-16T00:05:00Z'),
      voidTraders: [trader],
    } as unknown as Partial<WorldState>)

    expect(await diffWorldStates(previous, current)).to.deep.equal([{
      type: 'void-trader',
      id: 'v1',
      character: 'Baro Ki\'Teer',
      location: 'Mercury Relay',
      expiry: trader.expiry.getTime(),
      items: [{ name: '棱晶·葛拉卡达', ducats: 150, credits: 100000 }],
    }])
  })

  it('detects a daily deal only when activation crosses snapshot timestamps', async () => {
    const deal = {
      id: 'd1',
      item: 'Braton',
      uniqueName: '/Lotus/Weapons/Braton',
      originalPrice: 225,
      salePrice: 157,
      discount: 30,
      activation: new Date('2026-07-16T00:03:00Z'),
      expiry: new Date('2026-07-17T00:03:00Z'),
    }
    const previous = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
      dailyDeals: [deal],
    } as unknown as Partial<WorldState>)
    const current = snapshot({
      timestamp: new Date('2026-07-16T00:05:00Z'),
      dailyDeals: [deal],
    } as unknown as Partial<WorldState>)

    expect(await diffWorldStates(previous, current)).to.deep.equal([{
      type: 'daily-deal',
      id: 'd1',
      item: 'Braton',
      originalPrice: 225,
      salePrice: 157,
      discount: 30,
      expiry: deal.expiry.getTime(),
    }])
  })

  for (const [uniqueName, item, expected] of [
    ['/Lotus/StoreItems/Weapons/Tenno/Rifle/Rifle', 'Braton', '布莱顿'],
    ['/Lotus/StoreItems/Powersuits/Bard/Bard', 'Octavia', 'Octavia'],
    ['/Lotus/StoreItems/Types/Items/Research/EnergyComponent', 'Fieldron', '电磁力场装置'],
    ['/Lotus/StoreItems/Unknown/NewItem', 'New Item', 'New Item'],
    [undefined, 'New Item', 'New Item'],
  ]) {
    it(`localizes daily deal ${item} and preserves unknown names (${uniqueName})`, async () => {
      const previous = snapshot({ timestamp: new Date('2026-07-16T00:00:00Z') })
      const current = snapshot({
        dailyDeals: [{
          id: 'localized-deal',
          uniqueName,
          item,
          originalPrice: 225,
          salePrice: 157,
          discount: 30,
          activation: new Date('2026-07-16T00:03:00Z'),
          expiry: new Date('2026-07-17T00:03:00Z'),
        }],
      } as unknown as Partial<WorldState>)

      expect(await diffWorldStates(previous, current)).to.deep.equal([{
        type: 'daily-deal',
        id: 'localized-deal',
        item: expected,
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
        expiry: new Date('2026-07-17T00:03:00Z').getTime(),
      }])
      expect(current.raw.dailyDeals[0].item).to.equal(item)
    })
  }

  it('filters fissures whose mission type is not 歼灭/防御/中断', async () => {
    const previous = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
    })
    const current = snapshot({
      fissures: [
        {
          id: 'f-allowed',
          tier: 'Lith',
          tierNum: 1,
          node: 'E Prime',
          nodeKey: 'E Prime (Earth)',
          missionType: 'Exterminate',
          isHard: false,
          isStorm: false,
          activation: new Date('2026-07-16T00:01:00Z'),
          expiry: new Date('2026-07-16T01:01:00Z'),
        },
        {
          id: 'f-filtered',
          tier: 'Lith',
          tierNum: 1,
          node: 'Apollodorus',
          nodeKey: 'Apollodorus (Mercury)',
          missionType: 'Survival',
          isHard: false,
          isStorm: false,
          activation: new Date('2026-07-16T00:01:00Z'),
          expiry: new Date('2026-07-16T01:01:00Z'),
        },
      ],
    } as unknown as Partial<WorldState>)

    const notifications = await diffWorldStates(previous, current)
    expect(notifications).to.have.length(1)
    expect(notifications[0]).to.deep.include({
      type: 'fissure',
      id: 'f-allowed',
    })
  })

  it('does not re-broadcast a disallowed fissure that persists between refreshes', async () => {
    const fissure = {
      id: 'f-filtered',
      tier: 'Lith',
      tierNum: 1,
      node: 'Apollodorus',
      nodeKey: 'Apollodorus (Mercury)',
      missionType: 'Survival',
      isHard: false,
      isStorm: false,
      activation: new Date('2026-07-16T00:01:00Z'),
      expiry: new Date('2026-07-16T01:01:00Z'),
    }
    const previous = snapshot({
      timestamp: new Date('2026-07-16T00:00:00Z'),
      fissures: [fissure],
    } as unknown as Partial<WorldState>)
    const current = snapshot({
      timestamp: new Date('2026-07-16T00:05:00Z'),
      fissures: [fissure],
    } as unknown as Partial<WorldState>)

    expect(await diffWorldStates(previous, current)).to.deep.equal([])
  })

  it('does not report removals or unchanged entries', async () => {
    const deal = {
      id: 'd1',
      item: 'Braton',
      uniqueName: '/Lotus/Weapons/Braton',
      originalPrice: 225,
      salePrice: 157,
      discount: 30,
      activation: new Date('2026-07-16T00:03:00Z'),
      expiry: new Date('2026-07-17T00:03:00Z'),
    }
    const withDeal = snapshot({
      dailyDeals: [deal],
    } as unknown as Partial<WorldState>)

    expect(await diffWorldStates(withDeal, withDeal)).to.deep.equal([])
    expect(await diffWorldStates(withDeal, snapshot({ dailyDeals: [] }))).to.deep.equal([])
  })

  it('uses deterministic identities when parser IDs are absent', async () => {
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

    expect(await diffWorldStates(previous, current)).to.deep.equal([])
  })
})
