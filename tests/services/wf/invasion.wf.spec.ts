import type { Invasion, InvasionBoard, RawInvasion } from '../../../src/warframe'
import { expect } from 'chai'
import {
  dict_zh,
  ExportFactions,
  ExportRegions,
} from 'warframe-public-export-plus'
import { dictZhExtra } from '../../../src/warframe/assets'
import { resolveExportItemNameZh } from '../../../src/warframe/infrastructure/wf/bounty-adapter'
import { extractInvasionsRaw } from '../../../src/warframe/infrastructure/wf/wf-api'
import { getInvasionsFrom } from '../../../src/warframe/services'
import fixtureJSON from '../../assets/example-invasions-world-state.json'

function factionZh(fc: keyof typeof ExportFactions): string {
  const nameKey = ExportFactions[fc].name
  return (nameKey && (dict_zh[nameKey] ?? dictZhExtra[nameKey])) || ''
}

function planetZh(node: string): string {
  const region = ExportRegions[node]
  return dict_zh[region.systemName]
}

function nodeZh(node: string): string {
  const region = ExportRegions[node]
  return dict_zh[region.name]
}

function campaignZh(tag: string): string {
  const text = dict_zh[tag] ?? dictZhExtra[tag]
  expect(text, tag).to.be.a('string').and.not.equal(tag)
  return text
}

function boardInvasions(board: InvasionBoard): Invasion[] {
  return board.planets.flatMap(group => group.invasions)
}

function snapshot(invasionsRaw: RawInvasion[]) {
  return {
    raw: { invasions: [] },
    invasionsRaw,
  }
}

describe('getInvasions', () => {
  it('uses official Chinese LocTag titles for invasion campaigns', () => {
    expect(campaignZh('/Lotus/Language/Menu/CorpusInvasionGeneric')).to.equal('Corpus 围攻')
    expect(campaignZh('/Lotus/Language/Menu/GrineerInvasionGeneric')).to.equal('Grineer 进攻')
    expect(campaignZh('/Lotus/Language/Menu/InfestedInvasionGeneric')).to.equal('感染者爆发')
    expect(campaignZh('/Lotus/Language/Menu/InfestedInvasionBoss')).to.equal('PHORID 现形')
  })

  it('maps Corpus vs Grineer node, factions, Chinese rewards, and progress', async () => {
    const result = await getInvasionsFrom(snapshot(extractInvasionsRaw(JSON.stringify(fixtureJSON))))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.title).to.equal(
      dict_zh['/Lotus/Language/Menu/WorldStatePanel_Invasions']
      ?? dictZhExtra['/Lotus/Language/Menu/WorldStatePanel_Invasions'],
    )

    const corpus = boardInvasions(result.data).find(item => item.id === '694f3a1e1c3f07aa28ce5f49')
    expect(corpus, 'active Corpus vs Grineer invasion').to.not.equal(undefined)
    expect(corpus!.planet).to.equal(planetZh('SolNode140'))
    expect(corpus!.node).to.equal(nodeZh('SolNode140'))
    expect(corpus!.attacker.faction).to.equal(factionZh('FC_CORPUS'))
    expect(corpus!.defender.faction).to.equal(factionZh('FC_GRINEER'))
    expect(corpus!.attacker.rewards.map(reward => reward.name)).to.include(
      resolveExportItemNameZh('/Lotus/Types/Items/Research/EnergyComponent'),
    )
    expect(corpus!.attacker.rewards.map(reward => reward.name)).to.include(
      resolveExportItemNameZh('/25000Credits'),
    )
    expect(corpus!.defender.rewards.map(reward => reward.name)).to.include(
      resolveExportItemNameZh('/Lotus/Types/Items/Research/ChemComponent'),
    )
    const fieldDevice = corpus!.attacker.rewards.find(reward => reward.name.includes('电磁力场装置'))
    expect(fieldDevice?.count).to.equal(3)
    expect(corpus!.completion).to.be.closeTo((1 + 375 / 31000) * 0.5, 0.0001)
    expect(corpus!.attacker.tone).to.equal('corpus')
    expect(corpus!.defender.tone).to.equal('grineer')
  })

  it('keeps Infested attacker rewards empty and still lists the defending side', async () => {
    const result = await getInvasionsFrom(snapshot(extractInvasionsRaw(JSON.stringify(fixtureJSON))))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    const infested = boardInvasions(result.data).find(item => item.id === '694f00b2918408cac0ce5f48')
    expect(infested, 'active Infested invasion').to.not.equal(undefined)
    expect(infested!.planet).to.equal(planetZh('SolNode99'))
    expect(infested!.node).to.equal(nodeZh('SolNode99'))
    expect(infested!.vsInfestation).to.equal(true)
    expect(infested!.attacker.faction).to.equal(factionZh('FC_INFESTATION'))
    expect(infested!.attacker.rewards).to.deep.equal([])
    expect(infested!.defender.faction).to.equal(factionZh('FC_GRINEER'))
    expect(infested!.defender.rewards).to.deep.equal([{
      name: resolveExportItemNameZh('/Lotus/Types/Items/Research/BioComponent'),
      count: 1,
    }])
    expect(infested!.completion).to.be.closeTo((1 + -7810 / 30000) * 1, 0.0001)
    expect(infested!.attacker.tone).to.equal('infested')
    expect(infested!.defender.tone).to.equal('grineer')
  })

  it('clamps invasion progress to the closed range 0 to 1', async () => {
    const [template] = extractInvasionsRaw(JSON.stringify(fixtureJSON))
      .filter(entry => !entry.Completed && entry.Faction === 'FC_CORPUS')
    const result = await getInvasionsFrom(snapshot([
      { ...template, Count: 1_000_000, Goal: 1_000 },
      { ...template, _id: { $oid: 'clamp-low' }, Count: -1_000_000, Goal: 1_000 },
    ]))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(boardInvasions(result.data).map(item => item.completion)).to.deep.equal([1, 0])
  })

  it('filters completed invasions', async () => {
    const result = await getInvasionsFrom(snapshot(extractInvasionsRaw(JSON.stringify(fixtureJSON))))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(boardInvasions(result.data).map(item => item.id)).to.not.include('694be17b617b0f3626ce5f4a')
    expect(boardInvasions(result.data)).to.have.length(2)
  })

  it('groups nodes by planet and uses the LocTag as the shared campaign title', async () => {
    const raw = extractInvasionsRaw(JSON.stringify(fixtureJSON))
    const ceres = raw.find(entry => entry.Node === 'SolNode140')!
    const extraCeres = {
      ...raw.find(entry => entry.Node === 'SolNode135')!,
      Completed: false,
      Count: 100,
    }
    const result = await getInvasionsFrom(snapshot([extraCeres, ceres, raw.find(entry => entry.Node === 'SolNode99')!]))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.planets.map(group => group.planet)).to.deep.equal([
      planetZh('SolNode99'),
      planetZh('SolNode140'),
    ])
    expect(result.data.planets[0].title).to.equal(
      campaignZh('/Lotus/Language/Menu/InfestedInvasionBoss'),
    )
    expect(result.data.planets[0].invasions.map(item => item.node)).to.deep.equal([
      nodeZh('SolNode99'),
    ])
    expect(result.data.planets[1].title).to.equal(
      campaignZh('/Lotus/Language/Menu/CorpusInvasionGeneric'),
    )
    expect(result.data.planets[1].invasions.map(item => item.node)).to.deep.equal([
      nodeZh('SolNode135'),
      nodeZh('SolNode140'),
    ])
    expect(result.data.planets[1].completion).to.be.closeTo(
      (1 + (100 + 375) / (38000 + 31000)) * 0.5,
      0.0001,
    )
  })

  it('merges Infested outbreak and Phorid nodes on the same planet under the Phorid LocTag', async () => {
    const raw = extractInvasionsRaw(JSON.stringify(fixtureJSON))
    const phorid = raw.find(entry => entry.Node === 'SolNode99')!
    const result = await getInvasionsFrom(snapshot([
      {
        ...phorid,
        _id: { $oid: 'mars-outbreak' },
        Node: 'SolNode11',
        LocTag: '/Lotus/Language/Menu/InfestedInvasionGeneric',
        Count: -100,
        Goal: 1000,
      },
      phorid,
    ]))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.planets).to.have.length(1)
    expect(result.data.planets[0].planet).to.equal(planetZh('SolNode99'))
    expect(result.data.planets[0].title).to.equal(
      campaignZh('/Lotus/Language/Menu/InfestedInvasionBoss'),
    )
    expect(result.data.planets[0].invasions.map(item => item.node)).to.deep.equal([
      nodeZh('SolNode99'),
      nodeZh('SolNode11'),
    ])
    expect(result.data.planets[0].completion).to.be.closeTo(
      (1 + (-7810 + -100) / (30000 + 1000)) * 1,
      0.0001,
    )
  })

  it('keeps two LocTags on the same planet as separate campaign groups', async () => {
    const mars = extractInvasionsRaw(JSON.stringify(fixtureJSON))
      .find(entry => entry.Node === 'SolNode99')!
    const result = await getInvasionsFrom(snapshot([
      mars,
      {
        ...mars,
        _id: { $oid: 'mars-corpus' },
        LocTag: '/Lotus/Language/Menu/CorpusInvasionGeneric',
        Faction: 'FC_CORPUS',
      },
    ]))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.planets.map(group => ({
      planet: group.planet,
      title: group.title,
    }))).to.deep.equal([
      {
        planet: planetZh('SolNode99'),
        title: campaignZh('/Lotus/Language/Menu/InfestedInvasionBoss'),
      },
      {
        planet: planetZh('SolNode99'),
        title: campaignZh('/Lotus/Language/Menu/CorpusInvasionGeneric'),
      },
    ])
  })

  it('fails with invasion.unavailable when every invasion is finished', async () => {
    const completedOnly = extractInvasionsRaw(JSON.stringify(fixtureJSON))
      .filter(entry => entry.Completed)
    const result = await getInvasionsFrom(snapshot(completedOnly))
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }
    expect(result.error.code).to.equal('invasion.unavailable')
    expect(result.error.retryable).to.equal(false)
  })

  it('fails with invasion.unavailable when the invasion list is empty', async () => {
    const result = await getInvasionsFrom(snapshot([]))
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }
    expect(result.error.code).to.equal('invasion.unavailable')
  })

  it('fails with common.fetchFailed when worldstate cannot be loaded', async () => {
    const result = await getInvasionsFrom()
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }
    expect(result.error.code).to.equal('common.fetchFailed')
    expect(result.error.retryable).to.equal(true)
  })
})
