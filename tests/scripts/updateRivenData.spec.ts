import { expect } from 'chai'
import { makeSnapshot, manifestEntry } from '../../scripts/update-riven-data.mjs'

const entry = { tag: 'WeaponAmmoEfficiency', upgradeValues: [{ value: -0.0049999999, locTag: '|val|% Ammo Efficiency', reverseValueSymbol: true }] }
const definition = { uniqueName: '/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare', upgradeEntries: [entry] }
const weapon = { uniqueName: '/Weapons/Test', name: 'Test', omegaAttenuation: 0.75, productCategory: 'Pistols', primeOmegaAttenuation: 1.1 }

describe('official riven snapshot updater', () => {
  it('preserves raw numbers, conditional values, and names joined by ID', () => {
    const result = makeSnapshot({ ExportUpgrades: [definition] }, { ExportWeapons: [weapon] }, { ExportUpgrades: [] }, { ExportWeapons: [{ uniqueName: '/Weapons/Test', name: '测试' }] })
    expect(result.upgrades?.[0]?.upgradeEntries[0]).to.deep.equal(entry)
    expect(result.weapons?.[0]?.primeOmegaAttenuation).to.equal(1.1)
    expect(result.weaponNamesZh?.['/Weapons/Test']).to.equal('测试')
  })

  it('rejects incomplete and nonfinite data rather than publishing a corrupt snapshot', () => {
    expect(() => makeSnapshot({}, {}, {}, {})).to.throw()
    const invalid = { ...definition, upgradeEntries: [{ tag: 'Bad', upgradeValues: [{ value: NaN }] }] }
    expect(() => makeSnapshot({ ExportUpgrades: [invalid] }, { ExportWeapons: [weapon] }, {}, {})).to.throw()
  })

  it('accepts the official plus sign in version identifiers', () => {
    expect(manifestEntry('ExportUpgrades_zh.json!00_Rck5KpmU608p4TYI1p+9DQ\r\n', 'ExportUpgrades', 'zh')).to.equal('ExportUpgrades_zh.json!00_Rck5KpmU608p4TYI1p+9DQ')
  })

  it('rejects missing, duplicate, or path-traversing manifest entries', () => {
    for (const text of ['', 'ExportUpgrades_en.json!../bad', 'ExportUpgrades_en.json!a\nExportUpgrades_en.json!b']) {
      expect(() => manifestEntry(text, 'ExportUpgrades', 'en')).to.throw()
    }
  })
})
