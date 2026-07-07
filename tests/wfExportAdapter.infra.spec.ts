import { expect } from 'chai'
import {
  fixRelicRewardKey,
  relicEraToTransKey,
  relicQualityToName,
  relicQualityToTransKey,
} from '../src/infrastructure/wf/wf-export-adapter'

describe('relicQualityToName Tests', () => {
  it('should map VPQ_BRONZE to Intact', () => {
    expect(relicQualityToName('VPQ_BRONZE')).to.equal('Intact')
  })

  it('should map VPQ_SILVER to Exceptional', () => {
    expect(relicQualityToName('VPQ_SILVER')).to.equal('Exceptional')
  })

  it('should map VPQ_GOLD to Flawless', () => {
    expect(relicQualityToName('VPQ_GOLD')).to.equal('Flawless')
  })

  it('should map VPQ_PLATINUM to Radiant', () => {
    expect(relicQualityToName('VPQ_PLATINUM')).to.equal('Radiant')
  })

  it('should default to Intact for unknown quality', () => {
    expect(relicQualityToName('UNKNOWN')).to.equal('Intact')
  })

  it('should default to Intact for empty string', () => {
    expect(relicQualityToName('')).to.equal('Intact')
  })
})

describe('relicQualityToTransKey Tests', () => {
  it('should transform VPQ_BRONZE to translation key', () => {
    expect(relicQualityToTransKey('VPQ_BRONZE')).to.equal(
      '/Lotus/Language/Relics/VoidProjectionQuality_Bronze',
    )
  })

  it('should transform VPQ_SILVER to translation key', () => {
    expect(relicQualityToTransKey('VPQ_SILVER')).to.equal(
      '/Lotus/Language/Relics/VoidProjectionQuality_Silver',
    )
  })

  it('should transform VPQ_GOLD to translation key', () => {
    expect(relicQualityToTransKey('VPQ_GOLD')).to.equal(
      '/Lotus/Language/Relics/VoidProjectionQuality_Gold',
    )
  })

  it('should transform VPQ_PLATINUM to translation key', () => {
    expect(relicQualityToTransKey('VPQ_PLATINUM')).to.equal(
      '/Lotus/Language/Relics/VoidProjectionQuality_Platinum',
    )
  })

  it('should return original for non-VPQ input', () => {
    expect(relicQualityToTransKey('some_other_key')).to.equal(
      'some_other_key',
    )
  })
})

describe('relicEraToTransKey Tests', () => {
  it('should transform Lith to translation key', () => {
    expect(relicEraToTransKey('Lith')).to.equal(
      '/Lotus/Language/Relics/Era_LITH',
    )
  })

  it('should transform Meso to translation key', () => {
    expect(relicEraToTransKey('Meso')).to.equal(
      '/Lotus/Language/Relics/Era_MESO',
    )
  })

  it('should transform Neo to translation key', () => {
    expect(relicEraToTransKey('Neo')).to.equal(
      '/Lotus/Language/Relics/Era_NEO',
    )
  })

  it('should transform Axi to translation key', () => {
    expect(relicEraToTransKey('Axi')).to.equal(
      '/Lotus/Language/Relics/Era_AXI',
    )
  })

  it('should uppercase the era name', () => {
    expect(relicEraToTransKey('lith')).to.equal(
      '/Lotus/Language/Relics/Era_LITH',
    )
    expect(relicEraToTransKey('MESO')).to.equal(
      '/Lotus/Language/Relics/Era_MESO',
    )
  })

  it('should handle Requiem era', () => {
    expect(relicEraToTransKey('Requiem')).to.equal(
      '/Lotus/Language/Relics/Era_REQUIEM',
    )
  })
})

describe('fixRelicRewardKey Tests', () => {
  it('should strip StoreItems/ prefix', () => {
    expect(fixRelicRewardKey('StoreItems/Weapons/Test')).to.equal(
      'Weapons/Test',
    )
  })

  it('should leave keys without StoreItems/ unchanged', () => {
    expect(fixRelicRewardKey('/Lotus/Weapons/Test')).to.equal(
      '/Lotus/Weapons/Test',
    )
  })

  it('should handle empty string', () => {
    expect(fixRelicRewardKey('')).to.equal('')
  })

  it('should only strip the first occurrence', () => {
    expect(fixRelicRewardKey('StoreItems/StoreItems/Test')).to.equal(
      'StoreItems/Test',
    )
  })
})
