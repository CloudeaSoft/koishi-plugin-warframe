import { expect } from 'chai'
import { rivenPublicExport } from '../../src/warframe/assets/index'
import { adaptRivenDefinitions, cleanRivenTemplate } from '../../src/warframe/infrastructure/wf/riven-export-adapter'

describe('riven template parsing', () => {
  it('extracts names from supported export markers and annotations', () => {
    const cases = [
      ['|val|% <DT_FIRE_COLOR>Heat', 'Heat'],
      ['|STAT1|% Critical Chance for Slide Attack', 'Critical Chance for Slide Attack'],
      ['|val|s Combo Duration', 'Combo Duration'],
      ['|val|% Fire Rate (x2 for Bows)', 'Fire Rate'],
      ['|val|% Magazine Reloaded/s when Holstered', 'Magazine Reloaded/s when Holstered'],
    ]
    for (const [template, expected] of cases) {
      expect(cleanRivenTemplate(template)).to.equal(expected)
    }
  })

  it('rejects HTML and malformed markers rather than attempting to strip them', () => {
    const cases = [
      '|val|% <script',
      '|val|% <ScRiPt\nsrc=evil.js',
      '|val|% <script>alert(1)</script> Damage',
      '|val|% <img src=x onerror=alert(1)> Damage',
      '|val|% <<DT_FIRE_COLOR>script> Damage',
      '|val|% <DT_FIRE_COLOR onclick=alert(1)>Heat',
      '|val|% <DT_FIRE_COLOR Heat',
      '|val|% Damage (<script>)',
    ]
    for (const template of cases) {
      expect(cleanRivenTemplate(template), template).to.equal(undefined)
    }
  })

  it('skips invalid templates before creating names, keys or OCR aliases', () => {
    const result = adaptRivenDefinitions([{
      uniqueName: '/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare',
      upgradeEntries: [
        { tag: 'WeaponFireDamageMod', upgradeValues: [{ value: 0.01, locTag: '|val|% <DT_FIRE_COLOR>Heat' }] },
        { tag: 'WeaponCritChanceMod', upgradeValues: [{ value: 0.01, locTag: '|val|% <script' }] },
        { tag: 'FutureUnknown', upgradeValues: [{ value: 0.01, locTag: '|val|% <img src=x>' }] },
      ],
    }])
    expect(result.Rifle.map(stat => stat.key)).to.deep.equal(['heat'])
  })

  it('continues to accept every named template in the official snapshot', () => {
    for (const definition of rivenPublicExport.upgrades) {
      for (const entry of definition.upgradeEntries) {
        const template = entry.upgradeValues[0].locTag!
        expect(cleanRivenTemplate(template), `${definition.uniqueName}: ${entry.tag}`).to.be.a('string').and.not.equal('')
      }
    }
  })
})
