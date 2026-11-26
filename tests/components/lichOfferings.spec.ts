import { expect } from 'chai'
import { LichOfferingsComponent } from '../../src/components/lich-offerings'

describe('vendor bonus colors', () => {
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
