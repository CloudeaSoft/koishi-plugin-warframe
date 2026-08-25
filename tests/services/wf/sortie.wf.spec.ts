import type { RawSortie } from '../../../src/warframe/types/wf/sortie'
import { expect } from 'chai'
import { dict_zh } from 'warframe-public-export-plus'
import { t } from '../../../src/i18n'
import { dictZhExtra } from '../../../src/warframe/assets'
import { extractSortieRaw } from '../../../src/warframe/infrastructure/wf/wf-api'
import { adaptSortie, getSortieFrom } from '../../../src/warframe/services'

function translateLotus(key: string): string | undefined {
  return dict_zh[key] ?? dictZhExtra[key]
}

function futureExpiry(ms = 3_600_000): Date {
  return new Date(Date.now() + ms)
}

function rawSortie(overrides: Partial<RawSortie> = {}): RawSortie {
  return {
    Boss: 'SORTIE_BOSS_ALAD',
    Activation: { $date: { $numberLong: String(Date.now() - 3_600_000) } },
    Expiry: { $date: { $numberLong: String(Date.now() + 3_600_000) } },
    Variants: [
      {
        missionType: 'MT_SABOTAGE',
        modifierType: 'SORTIE_MODIFIER_HAZARD_RADIATION',
        node: 'SolNode126',
      },
      {
        missionType: 'MT_MOBILE_DEFENSE',
        modifierType: 'SORTIE_MODIFIER_EXIMUS',
        node: 'SolNode66',
      },
      {
        missionType: 'MT_RESCUE',
        modifierType: 'SORTIE_MODIFIER_RIFLE_ONLY',
        node: 'SolNode216',
      },
    ],
    ...overrides,
  }
}

function snapshot(
  sortieRaw: RawSortie | undefined,
  expiry = futureExpiry(),
) {
  return {
    raw: {
      sortie: { expiry, activation: new Date() },
    },
    sortieRaw,
  }
}

describe('adaptSortie Tests', () => {
  it('translates the boss, faction, mode name, and three missions in order', async () => {
    const result = await adaptSortie(rawSortie())

    expect(result.modeName).to.equal(
      translateLotus('/Lotus/Language/Menu/SortieMissionName'),
    )
    expect(result.boss).to.equal('Alad V')
    expect(result.faction).to.equal('Corpus')
    expect(result.missions).to.have.length(3)
    expect(result.missions.map(mission => mission.type)).to.deep.equal([
      '破坏',
      '移动防御',
      '救援',
    ])
    expect(result.missions.map(mission => mission.node.name)).to.deep.equal([
      'Metis',
      'Unda',
      'Valefor',
    ])
    expect(result.missions.map(mission => mission.node.system)).to.deep.equal([
      '木星',
      '金星',
      '欧罗巴',
    ])
    expect(result.missions.map(mission => mission.modifier)).to.deep.equal([
      '辐射灾害',
      '卓越者大本营',
      '突击步枪 限定',
    ])
  })

  it('uses sortie enemy levels by mission index instead of star-chart levels', async () => {
    const result = await adaptSortie(rawSortie())

    expect(result.missions[0].node.minLevel).to.equal(50)
    expect(result.missions[0].node.maxLevel).to.equal(60)
    expect(result.missions[1].node.minLevel).to.equal(65)
    expect(result.missions[1].node.maxLevel).to.equal(80)
    expect(result.missions[2].node.minLevel).to.equal(80)
    expect(result.missions[2].node.maxLevel).to.equal(100)
  })

  it('falls back to the raw node key when the sol node cannot be resolved', async () => {
    const result = await adaptSortie(rawSortie({
      Variants: [
        {
          missionType: 'MT_EXTERMINATION',
          modifierType: 'SORTIE_MODIFIER_LOW_ENERGY',
          node: 'NotARealNode',
        },
      ],
    }))

    expect(result.missions[0].type).to.equal('歼灭')
    expect(result.missions[0].node.name).to.equal('NotARealNode')
    expect(result.missions[0].node.system).to.equal('')
    expect(result.missions[0].modifier).to.equal('能量减少')
  })

  it('falls back to the raw modifier key when it cannot be translated', async () => {
    const result = await adaptSortie(rawSortie({
      Variants: [
        {
          missionType: 'MT_SABOTAGE',
          modifierType: 'SORTIE_MODIFIER_NOT_REAL',
          node: 'SolNode126',
        },
      ],
    }))

    expect(result.missions[0].modifier).to.equal('SORTIE_MODIFIER_NOT_REAL')
  })
})

describe('getSortie Tests', () => {
  it('returns adapted sortie data from the worldstate snapshot', async () => {
    const expiry = futureExpiry()
    const result = await getSortieFrom(snapshot(rawSortie(), expiry))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.boss).to.equal('Alad V')
    expect(result.data.missions).to.have.length(3)
    expect(result.data.missions[0].type).to.equal('破坏')
    expect(result.data.expiry).to.equal(expiry.getTime())
    expect(result.data.remaining).to.match(/小时|分钟|秒/)
  })

  it('fails when Sorties are missing', async () => {
    const result = await getSortieFrom(snapshot(undefined))
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('sortie.unavailable')
    expect(t(result)).to.equal('当前没有突击')
  })

  it('fails when the sortie has expired', async () => {
    const expiry = new Date(Date.now() - 1_000)
    const result = await getSortieFrom(snapshot(rawSortie({
      Expiry: { $date: { $numberLong: String(expiry.getTime()) } },
    }), expiry))
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('sortie.unavailable')
  })

  it('fails with common.fetchFailed when worldstate cannot be loaded', async () => {
    const result = await getSortieFrom()
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('common.fetchFailed')
    expect(result.error.retryable).to.equal(true)
  })
})

describe('extractSortieRaw', () => {
  it('returns Sorties[0] from worldstate json', () => {
    const raw = extractSortieRaw(JSON.stringify({
      Sorties: [{ Boss: 'SORTIE_BOSS_VOR', Variants: [] }],
      LiteSorties: [{ Boss: 'SORTIE_BOSS_BOREAL' }],
    }))

    expect(raw?.Boss).to.equal('SORTIE_BOSS_VOR')
    expect(raw?.Variants).to.deep.equal([])
  })

  it('returns undefined when Sorties are empty', () => {
    expect(extractSortieRaw(JSON.stringify({ Sorties: [] }))).to.equal(undefined)
    expect(extractSortieRaw('{')).to.equal(undefined)
  })
})
