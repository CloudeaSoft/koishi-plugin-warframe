import { expect } from 'chai'
import { Baro, BaroParsed } from '../src/assets/baro'

describe('baro static assets', () => {
  it('loads baro lua text from an asset file', () => {
    expect(Baro).to.include('10 x Ki\'Teer Fireworks')
  })

  it('loads parsed baro data as json', () => {
    expect(BaroParsed).to.be.an('array')
    expect(BaroParsed[0]).to.include.keys(['name', 'last', 'plats'])
  })
})
