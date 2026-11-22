import { expect } from 'chai'
import { dict_zh, ExportFactions, ExportRegions } from 'warframe-public-export-plus'
import { arbyRewards } from '../../../src/warframe/assets'
import { arbitrationSchedule } from '../../../src/warframe/data/wf/arbitrationSchedule'
import { adaptArbitrations, getArbitrations } from '../../../src/warframe/services'

function factionName(node: string): string {
  const region = ExportRegions[node]
  const key = ExportFactions[region.faction]?.name
  return key ? dict_zh[key] ?? region.faction : region.faction
}

describe('adaptArbitrations', () => {
  it('keeps every known node, including those without a vitus essence rate', () => {
    const rated = { time: 1_700_000_000, node: 'SolNode147' }
    const unrated = { time: 1_700_003_600, node: 'SolNode64' }
    const unknown = { time: 1_700_007_200, node: 'NotANode' }

    const rows = adaptArbitrations([rated, unrated, unknown])

    expect(rows).to.have.length(2)
    expect(rows[0].name).to.equal(dict_zh[ExportRegions.SolNode147.name])
    expect(rows[0].system).to.equal(dict_zh[ExportRegions.SolNode147.systemName])
    expect(rows[0].type).to.equal(dict_zh[ExportRegions.SolNode147.missionName])
    expect(rows[0].faction).to.equal(factionName('SolNode147'))
    expect(rows[0].rewards).to.equal(arbyRewards.SolNode147)
    expect(rows[1].name).to.equal(dict_zh[ExportRegions.SolNode64.name])
    expect(rows[1].system).to.equal(dict_zh[ExportRegions.SolNode64.systemName])
    expect(rows[1].type).to.equal(dict_zh[ExportRegions.SolNode64.missionName])
    expect(rows[1].rewards).to.equal(undefined)
  })
})

describe('getArbitrations', () => {
  it('rejects a day outside 1 through 14', () => {
    const invalid = {
      ok: false,
      error: {
        code: 'arbitration.invalidDayRange',
        retryable: false,
      },
    }
    expect(getArbitrations(0)).to.deep.equal(invalid)
    expect(getArbitrations(15)).to.deep.equal(invalid)
  })

  it('returns every hour in the window, not only rated nodes', () => {
    const day = 1
    const result = getArbitrations(day)
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    const currentHourTimeStamp = Math.floor(new Date().setUTCMinutes(0, 0, 0) / 1000)
    const index = arbitrationSchedule.findIndex(entry => entry.time === currentHourTimeStamp)
    expect(index).to.be.gte(0)
    const window = arbitrationSchedule.slice(index, index + 24 * day)
    const unrated = window.filter(entry => arbyRewards[entry.node] === undefined)

    expect(unrated.length).to.be.greaterThan(0)
    expect(result.data).to.have.length(window.length)
    expect(result.data.filter(row => row.rewards === undefined)).to.have.length(unrated.length)
    expect(result.data.filter(row => row.rewards !== undefined).length).to.equal(window.length - unrated.length)
  })
})
