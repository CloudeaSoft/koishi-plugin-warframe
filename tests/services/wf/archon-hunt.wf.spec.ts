import { expect } from 'chai'
import { dict_zh } from 'warframe-public-export-plus'
import { dictZhExtra } from '../../../src/warframe/assets'
import { adaptArchonHunt } from '../../../src/warframe/services'

function translateLotus(key: string): string | undefined {
  return dict_zh[key] ?? dictZhExtra[key]
}

describe('adaptArchonHunt Tests', () => {
  it('translates the archon name and a resolved mission type and node', async () => {
    const result = await adaptArchonHunt({
      boss: 'Archon Boreal',
      missions: [
        {
          type: 'Extermination',
          node: 'Galatea (Neptune)',
          nodeKey: 'Galatea (Neptune)',
        },
      ],
    })

    expect(result.modeName).to.equal(
      translateLotus('/Lotus/Language/WorldStateWindow/LiteSortieMissionName'),
    )
    expect(result.name).to.equal('执刑官诡文枭主')
    expect(result.missions).to.have.length(1)
    expect(result.missions[0].type).to.equal('歼灭')
    expect(result.missions[0].node.name).to.equal('Galatea')
    expect(result.missions[0].node.system).to.equal('海王星')
    expect(result.missions[0].node.faction).to.equal('Corpus')
  })

  it('keeps mission order and translates each hunt mission type', async () => {
    const result = await adaptArchonHunt({
      boss: 'Archon Amar',
      missions: [
        { type: 'Extermination', nodeKey: 'Galatea (Neptune)' },
        { type: 'Defense', nodeKey: 'Aphrodite (Venus)' },
        { type: 'Assassination', nodeKey: 'Acheron (Pluto)' },
      ],
    })

    expect(result.missions.map(mission => mission.type)).to.deep.equal(['歼灭', '防御', '刺杀'])
  })

  it('falls back to the provided node name when the sol node cannot be resolved', async () => {
    const result = await adaptArchonHunt({
      boss: 'Archon Nira',
      missions: [
        {
          type: 'Extermination',
          node: 'Unknown Node (Nowhere)',
          nodeKey: 'Unknown Node (Nowhere)',
        },
      ],
    })

    expect(result.missions[0].type).to.equal('歼灭')
    expect(result.missions[0].node.name).to.equal('Unknown Node (Nowhere)')
    expect(result.missions[0].node.system).to.equal('')
  })

  it('keeps the original mission type when it cannot be translated', async () => {
    const result = await adaptArchonHunt({
      boss: 'Archon Boreal',
      missions: [
        { type: 'NotARealMissionType', nodeKey: 'Galatea (Neptune)' },
      ],
    })

    expect(result.missions[0].type).to.equal('NotARealMissionType')
  })

  it('returns an empty mission list when the source has none', async () => {
    const result = await adaptArchonHunt({
      boss: 'Archon Boreal',
    })

    expect(result.name).to.equal('执刑官诡文枭主')
    expect(result.missions).to.deep.equal([])
  })

  it('adds hunt enemy levels by mission index', async () => {
    const result = await adaptArchonHunt({
      boss: 'Archon Amar',
      missions: [
        { type: 'Rescue', nodeKey: 'Galatea (Neptune)' },
        { type: 'Defense', nodeKey: 'Aphrodite (Venus)' },
        { type: 'Assassination', nodeKey: 'Acheron (Pluto)' },
      ],
    })

    expect(result.missions[0].node.minLevel).to.equal(130)
    expect(result.missions[0].node.maxLevel).to.equal(135)
    expect(result.missions[1].node.minLevel).to.equal(135)
    expect(result.missions[2].node.minLevel).to.equal(145)
    expect(result.missions[2].node.maxLevel).to.equal(150)
  })
})
