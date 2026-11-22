import type { Arbitration } from '../../src/warframe'
import { expect } from 'chai'
import { ArbitrationComponent } from '../../src/components/wf'

function row(overrides: Partial<Arbitration> = {}): Arbitration {
  return {
    name: 'Cinxia',
    system: '谷神星',
    type: '拦截',
    faction: 'Grineer',
    minLevel: 20,
    maxLevel: 25,
    time: '2026/11/22 18:00',
    rewards: 400,
    ...overrides,
  }
}

describe('arbitrationComponent tests', () => {
  it('renders the full schedule and a vitus essence rate when one is recorded', () => {
    const html = String(ArbitrationComponent([
      row(),
      row({
        name: 'Umbriel',
        system: '天王星',
        time: '2026/11/22 19:00',
        rewards: undefined,
      }),
    ]))

    expect(html).to.include('仲裁时间表')
    expect(html).to.not.include('高掉落')
    expect(html).to.include('11月22日')
    expect(html).to.include('Cinxia 谷神星-拦截')
    expect(html).to.include('Umbriel 天王星-拦截')
    expect(html).to.include('400')
    expect(html).to.include('精华/h')
    expect(html).to.include('—')
  })

  it('omits the essence rate when the node has no recorded efficiency', () => {
    const html = String(ArbitrationComponent([
      row({
        name: 'Umbriel',
        system: '天王星',
        rewards: undefined,
      }),
    ]))

    expect(html).to.include('Umbriel 天王星-拦截')
    expect(html).to.not.include('精华/h')
    expect(html).to.not.include('undefined')
  })
})
