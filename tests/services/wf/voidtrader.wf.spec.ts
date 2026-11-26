import { expect } from 'chai'
import { getWorldState } from '../../../src/warframe/infrastructure/wf/wf-api'
import { getVoidTraderItem } from '../../../src/warframe/infrastructure/wf/wfcd-adapter'
import worldStateJSON from '../../assets/example-world-state.json'
import 'reflect-metadata'

describe('void Trader Item Map Tests', () => {
  it('resolves names and game icons for the recorded vendor inventory', async () => {
    const worldState = await getWorldState(JSON.stringify(worldStateJSON))
    const trader = worldState.voidTraders[0]

    trader.inventory.forEach((element) => {
      const item = getVoidTraderItem(element)
      expect(item.name).to.not.equal(undefined)
      expect(item.iconUrl, element.uniqueName).to.match(/^https:\/\/(?:content\.warframe\.com\/PublicExport|browse\.wf)\/Lotus\//)
    })
  })
})
