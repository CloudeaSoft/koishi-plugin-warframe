import type { OutputRelic } from '../../src/warframe'
import { expect } from 'chai'
import { RelicComponent } from '../../src/components/wf'

function renderReward(
  platinum: number | null | undefined,
  ducats: number | null | undefined,
): string {
  const relic: OutputRelic = {
    tier: '古纪',
    num: 'A1',
    items: [{
      name: 'Forma 蓝图',
      rarity: 'COMMON',
      quantity: 1,
      platinum,
      ducats,
    }],
  }

  return RelicComponent(relic).toString()
}

describe('relic component price rendering', () => {
  it('omits prices and icons when they are not applicable', () => {
    const output = renderReward(null, null)

    expect(output).to.not.include('??')
    expect(output).to.not.include('#icon-platinum')
    expect(output).to.not.include('#icon-ducats')
    expect(output).to.include('25/23/20/17%')
  })

  it('shows unknown markers and icons when prices are unavailable', () => {
    const output = renderReward(undefined, undefined)

    expect((output.match(/\?\?/g) ?? []).length).to.equal(2)
    expect(output).to.include('#icon-platinum')
    expect(output).to.include('#icon-ducats')
  })

  it('renders numeric zero as a known value', () => {
    const output = renderReward(0, 0)

    expect(output).to.not.include('??')
    expect((output.match(/>0</g) ?? []).length).to.equal(2)
    expect(output).to.include('#icon-platinum')
    expect(output).to.include('#icon-ducats')
  })
})
