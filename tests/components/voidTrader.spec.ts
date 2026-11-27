import { expect } from 'chai'
import { VoidTraderComponent } from '../../src/components/wf'

describe('void trader inventory HTML', () => {
  it('closes the icon slot when a middle item has no artwork', () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      name: String(i + 1),
      credits: 1000,
      ducats: 10,
      iconUrl: i === 10 ? undefined : '/item.png',
    }))
    const html = VoidTraderComponent({ expiry: '', items }).toString()
    expect(html).not.to.include('<div class="wf-trader-icon"/>')
    expect(html.match(/data-icon-url=/g)).to.have.length(20)
  })
})
