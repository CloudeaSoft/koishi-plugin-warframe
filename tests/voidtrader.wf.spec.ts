import { expect } from 'chai'
import { getWorldState } from '../src/infrastructure/wf/wf-api'
import { getVoidTraderItem } from '../src/infrastructure/wf/wfcd-adapter'
import worldStateJSON from './assets/example-world-state.json'
import 'reflect-metadata'

describe('void Trader Item Map Tests', function () {
  this.timeout(100000)
  it('should correctly map all void trader inventory item names', async () => {
    const worldState = await getWorldState(JSON.stringify(worldStateJSON))
    const trader = worldState.voidTraders[0]

    trader.inventory.forEach((element) => {
      const item = getVoidTraderItem(element)
      expect(item.name).to.not.equal(undefined)
    })
  })
})
