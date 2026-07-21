import type {
  OracleBountyCycle,
  RawSyndicateMission,
} from '../../../src/warframe/types'
import { expect } from 'chai'
import { dict_zh, ExportBounties } from 'warframe-public-export-plus'
import {
  adaptBountyBoard,
  adaptOracleBountyBoard,
  bountyLocationTag,
  formatOracleChallenge,
  rarityFromStageProbabilities,
  resolveExportItemNameZh,
} from '../../../src/warframe/infrastructure/wf/bounty-adapter'
import oracleCycleJSON from '../../assets/example-oracle-bounty-cycle.json'
import worldStateJSON from '../../assets/example-world-state.json'

function missionByTag(tag: string): RawSyndicateMission {
  const mission = (worldStateJSON.SyndicateMissions as RawSyndicateMission[])
    .find(entry => entry.Tag === tag)
  expect(mission, `missing SyndicateMissions entry ${tag}`).to.not.equal(undefined)
  return mission!
}

describe('bounty adapter', () => {
  it('resolves arcane store items via ExportArcanes', () => {
    expect(resolveExportItemNameZh(
      '/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/LightningStrikeOnKill',
    )).to.equal('残差·电击')
  })

  it('resolves gear store items via ExportGear', () => {
    expect(resolveExportItemNameZh(
      '/Lotus/StoreItems/Types/Game/FishBait/Infested/OrokinFishBaitA',
    )).to.equal('“秩序”残留物')
  })

  it('resolves Blueprint leaves via dict_zh *Name keys', () => {
    // Avoid ExportRecipes hits so the dict_zh Blueprint fallback is exercised.
    expect(resolveExportItemNameZh(
      '/Lotus/StoreItems/Types/Fake/BrokenFrameHelmetBlueprint',
    )).to.equal('Xaku 头盔 蓝图')
    // Case differs: path InfWarFan vs dict InfWarfanName
    expect(resolveExportItemNameZh(
      '/Lotus/StoreItems/Types/Fake/InfWarFanBlueprint',
    )).to.equal('疆南星刺 蓝图')
    expect(resolveExportItemNameZh(
      '/Lotus/StoreItems/Types/Fake/FormaBlueprint',
    )).to.equal('FormaBlueprint')
  })

  it('resolves weapon blueprints via ExportRecipes resultType weapons', () => {
    expect(resolveExportItemNameZh(
      '/Lotus/StoreItems/Types/Recipes/Weapons/InfWarFanBlueprint',
    )).to.equal('疆南星刺 蓝图')
  })

  it('maps stage probabilities to bronze/silver/gold', () => {
    expect(rarityFromStageProbabilities(0.2, [0.2])).to.equal('bronze')
    expect(rarityFromStageProbabilities(0.1549, [0.1549, 0.0752])).to.equal('bronze')
    expect(rarityFromStageProbabilities(0.0752, [0.1549, 0.0752])).to.equal('silver')
    expect(rarityFromStageProbabilities(0.1518, [0.1518, 0.0737, 0.0201])).to.equal('bronze')
    expect(rarityFromStageProbabilities(0.0737, [0.1518, 0.0737, 0.0201])).to.equal('silver')
    expect(rarityFromStageProbabilities(0.0201, [0.1518, 0.0737, 0.0201])).to.equal('gold')
  })

  it('adapts cetus bounties with export-plus Chinese names and staged rewards', () => {
    const board = adaptBountyBoard('cetus', missionByTag(bountyLocationTag.cetus))
    expect(board).to.not.equal(undefined)
    expect(board!.location).to.equal('cetus')
    expect(board!.title).to.include('赏金')
    expect(board!.jobs.length).to.be.greaterThan(0)

    const firstJobType = missionByTag(bountyLocationTag.cetus).Jobs![0].jobType!
    const expectedName = dict_zh[ExportBounties[firstJobType].name]
    expect(board!.jobs[0].name).to.equal(expectedName)
    expect(board!.jobs[0].stages.length).to.be.greaterThan(0)

    const allRewards = board!.jobs[0].stages.flat()
    expect(allRewards.some(reward => reward.name === '压迫点')).to.equal(true)
    expect(allRewards.some(reward => reward.name === '葛克度')).to.equal(true)
    expect(allRewards.every(reward => ['bronze', 'silver', 'gold'].includes(reward.rarity))).to.equal(true)
  })

  it('adapts fortuna and deimos boards', () => {
    const fortuna = adaptBountyBoard('fortuna', missionByTag(bountyLocationTag.fortuna))
    const deimos = adaptBountyBoard('deimos', missionByTag(bountyLocationTag.deimos))
    expect(fortuna!.jobs.length).to.be.greaterThan(0)
    expect(deimos!.jobs.length).to.be.greaterThan(0)
    expect(deimos!.jobs.some(job => job.isVault)).to.equal(true)
  })

  it('returns undefined for zariman when Jobs are missing', () => {
    const board = adaptBountyBoard('zariman', missionByTag(bountyLocationTag.zariman))
    expect(board).to.equal(undefined)
  })

  it('marks Narmer jobs from jobType path', () => {
    const board = adaptBountyBoard('cetus', missionByTag(bountyLocationTag.cetus))
    expect(board!.jobs.some(job => job.isNarmer)).to.equal(true)
  })
})

describe('oracle bounty adapter', () => {
  const cycle = oracleCycleJSON as OracleBountyCycle

  it('formats challenge text like browse.wf (last line + COUNT)', () => {
    const text = formatOracleChallenge(
      '/Lotus/Types/Challenges/Vania/VaniaSafeCracker',
    )
    expect(text).to.include('储藏箱')
    expect(text).to.not.include('|OPEN_COLOR|')
    expect(text).to.not.include('|ALLY|')
  })

  it('adapts zariman / cavia / hex boards from Oracle cycle', () => {
    const zariman = adaptOracleBountyBoard('zariman', cycle)
    const cavia = adaptOracleBountyBoard('cavia', cycle)
    const hex = adaptOracleBountyBoard('hex', cycle)

    expect(zariman).to.not.equal(undefined)
    expect(cavia).to.not.equal(undefined)
    expect(hex).to.not.equal(undefined)

    expect(zariman!.source).to.equal('oracle')
    expect(zariman!.title).to.include('坚守者')
    expect(zariman!.jobs).to.have.length(5)
    expect(zariman!.jobs[0].standingUnit).to.equal('vq')
    expect(zariman!.jobs[0].enemyLevels).to.deep.equal([50, 55])
    expect(zariman!.jobs[0].challenge).to.not.equal(undefined)
    expect(zariman!.zarimanFaction).to.not.equal(undefined)
    expect(zariman!.jobs[0].stages.length).to.be.greaterThan(0)
    expect(zariman!.jobs[0].stages.flat().some(r => r.name === '虚空绒翎')).to.equal(true)

    expect(cavia!.title).to.include('科维兽')
    expect(cavia!.jobs).to.have.length(5)
    expect(cavia!.jobs[0].enemyLevels).to.deep.equal([55, 60])
    expect(cavia!.jobs[0].standingStages).to.deep.equal([1000, 1500])
    expect(cavia!.jobs[0].stages.flat().length).to.be.greaterThan(0)

    expect(hex!.title).to.include('六人组')
    expect(hex!.jobs).to.have.length(7)
    expect(hex!.jobs[0].ally).to.equal('Lettie')
    expect(hex!.jobs[0].name).to.equal('传承种收割')
    expect(hex!.jobs[0].stages.flat().some(r => r.name === '女伯爵漫画')).to.equal(true)
    expect(hex!.jobs[6].ally).to.equal(undefined)
    expect(hex!.jobs[6].enemyLevels).to.deep.equal([125, 130])
    expect(hex!.jobs[6].stages.flat().length).to.be.greaterThan(0)
  })

  it('returns undefined when Oracle entries are missing', () => {
    expect(adaptOracleBountyBoard('zariman', undefined)).to.equal(undefined)
    expect(adaptOracleBountyBoard('cavia', {
      ...cycle,
      bounties: {},
    })).to.equal(undefined)
  })
})
