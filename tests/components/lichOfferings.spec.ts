import { expect } from 'chai'
import { LichOfferingsComponent } from '../../src/components/lich-offerings'

describe('vendor bonus colors', () => {
  it('shows pending weapons and the countdown when there are no reports', () => {
    const text = LichOfferingsComponent({
      family: 'coda',
      batch: 'A',
      expiresAt: Date.now() + 86_401_000,
      weapons: [{ name: '终幕·血肢' }],
    }).toString(true)
    expect(text).to.match(/^距离轮换 1天/)
    expect(text).to.include('终幕·血肢待上报').and.include('暂无本期加成上报')
    expect(text).not.to.match(/false|WarframeTR|WARFRAME Wiki|\d%/)
  })

  for (const [percent, color] of [
    [48, 'inherit'],
    [48.1, '#2166ac'],
    [52.8, '#2166ac'],
    [52.9, '#a69500'],
    [59.9, '#a69500'],
    [60, '#c62828'],
  ] as const) {
    it(`colors only the percentage at ${percent}%`, () => {
      const card = LichOfferingsComponent({
        family: 'tenet',
        expiresAt: Date.now(),
        weapons: [{ name: '信条·枢密', bonus: { element: '冲击', percent, compared: false, source: 'WarframeTR' } }],
      })
      expect(card.toString()).to.include(`冲击 <span style="color:${color}">+${percent}%</span>*`)
    })
  }
})
