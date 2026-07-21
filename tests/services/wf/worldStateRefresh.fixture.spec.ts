import { expect } from 'chai'
import { getWorldState } from '../../../src/warframe/infrastructure/wf/wf-api'
import { diffWorldStates } from '../../../src/warframe/services/world-state-refresh'
import newWorldStateJSON from '../../assets/example-world-state-newer.json'
import oldWorldStateJSON from '../../assets/example-world-state.json'
import 'reflect-metadata'

type WorldStateSnapshot = Parameters<typeof diffWorldStates>[0]

async function snapshotFrom(json: unknown): Promise<WorldStateSnapshot> {
  const raw = await getWorldState(JSON.stringify(json))
  return { raw, fissures: [], spFissures: [], rjFissures: [], syndicateMissionsRaw: [] }
}

describe('world-state fixture comparison', () => {
  it('reports the daily deal whose activation falls between the two snapshots', async () => {
    const previous = await snapshotFrom(oldWorldStateJSON)
    const current = await snapshotFrom(newWorldStateJSON)
    const notifications = await diffWorldStates(previous, current)

    const dailyDeals = notifications.filter(n => n.type === 'daily-deal')
    expect(dailyDeals).to.deep.equal([{
      type: 'daily-deal',
      id: 'Bard1784509200000',
      item: 'Octavia',
      originalPrice: 225,
      salePrice: 157,
      discount: 30,
      expiry: 1784509200000,
    }])
  })

  it('does not report void traders whose activation is still in the future', async () => {
    const previous = await snapshotFrom(oldWorldStateJSON)
    const current = await snapshotFrom(newWorldStateJSON)
    const notifications = await diffWorldStates(previous, current)

    const voidTraders = notifications.filter(n => n.type === 'void-trader')
    expect(voidTraders).to.deep.equal([])
  })

  it('does not report the daily deal when comparing the same snapshot', async () => {
    const snapshot = await snapshotFrom(newWorldStateJSON)
    const notifications = await diffWorldStates(snapshot, snapshot)

    expect(notifications.filter(n => n.type === 'daily-deal')).to.deep.equal([])
    expect(notifications.filter(n => n.type === 'void-trader')).to.deep.equal([])
  })
})
