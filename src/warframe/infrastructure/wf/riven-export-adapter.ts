import type { RivenCalculationAttribute, RivenWeaponType } from '../../types/wf/riven'
import type { RivenExportDefinition } from '../../types/wf/riven-export'
import type { RivenAttributeUnit } from '../../types/wfm'
import { ExportUpgrades } from 'warframe-public-export-plus'
import { normalizeName } from '../../utils/text'

export const rivenDefinitionTypes: Record<string, RivenWeaponType> = {
  LotusRifleRandomModRare: 'Rifle',
  LotusShotgunRandomModRare: 'Shotgun',
  LotusPistolRandomModRare: 'Pistol',
  LotusArchgunRandomModRare: 'Archgun',
  PlayerMeleeWeaponRandomModRare: 'Melee',
  LotusModularPistolRandomModRare: 'Kitgun',
  LotusModularMeleeRandomModRare: 'Zaw',
}

// Identity/translation policy only; all numeric bases come from Public Export.
const splicedNames: Record<string, string> = {
  WeaponWeakpointDamage: '弱点伤害',
  WeaponWeakpointCriticalChance: '弱点暴击几率',
  WeaponAmmoEfficiency: '弹药效率',
  WeaponMagazineReloadHolstered: '收枪装填',
  WeaponStatusDamage: '异常状态伤害',
  WeaponMeleeHeavyAttackDamageMod: '重击伤害',
  WeaponMeleeHeavyAttackChargeMod: '重击蓄力速度',
  WeaponMeleeParryAngleMod: '格挡角度',
  WeaponMeleeSlamDamageMod: '震地伤害',
  WeaponBlastDamageMod: '爆炸',
  WeaponCorrosiveDamageMod: '腐蚀',
  WeaponGasDamageMod: '毒气',
  WeaponMagneticDamageMod: '磁力',
  WeaponRadiationDamageMod: '辐射',
  WeaponViralDamageMod: '病毒',
  WeaponFactionDamageOrokin: '对奥罗金伤害',
  WeaponFactionDamageTechrot: '对科腐者伤害',
  WeaponFactionDamageScaldra: '对炽蛇军伤害',
}

const traditionalNames: Record<string, string> = {
  ComboDurationMod: '连击持续时间',
  SlideAttackCritChanceMod: '滑行攻击暴击几率',
  WeaponAmmoMaxMod: '弹药上限',
  WeaponArmorPiercingDamageMod: '穿刺',
  WeaponClipMaxMod: '弹匣容量',
  WeaponCritChanceMod: '暴击几率',
  WeaponCritDamageMod: '暴击伤害',
  WeaponDamageAmountMod: '基础伤害',
  WeaponElectricityDamageMod: '电击',
  WeaponFactionDamageCorpus: '对Corpus伤害',
  WeaponFactionDamageGrineer: '对Grineer伤害',
  WeaponFactionDamageInfested: '对Infested伤害',
  WeaponFireDamageMod: '火焰',
  WeaponFireIterationsMod: '多重射击',
  WeaponFireRateMod: '射速/攻击速度',
  WeaponFreezeDamageMod: '冰冻',
  WeaponImpactDamageMod: '冲击',
  WeaponMeleeComboBonusOnHitMod: '额外连击次数几率',
  WeaponMeleeComboEfficiencyMod: '重击效率',
  WeaponMeleeComboInitialBonusMod: '初始连击',
  WeaponMeleeComboPointsOnHitMod: '获得连击次数的几率',
  WeaponMeleeDamageMod: '近战伤害',
  WeaponMeleeFactionDamageCorpus: '对Corpus伤害',
  WeaponMeleeFactionDamageGrineer: '对Grineer伤害',
  WeaponMeleeFactionDamageInfested: '对Infested伤害',
  WeaponMeleeFinisherDamageMod: '处决伤害',
  WeaponMeleeRangeIncMod: '攻击范围',
  WeaponProcTimeMod: '触发持续时间',
  WeaponProjectileSpeedMod: '投射物飞行速度',
  WeaponPunctureDepthMod: '穿透',
  WeaponRecoilReductionMod: '武器后坐力',
  WeaponReloadSpeedMod: '装填速度',
  WeaponSlashDamageMod: '切割',
  WeaponStunChanceMod: '触发几率',
  WeaponToxinDamageMod: '毒素',
  WeaponZoomFovMod: '变焦',
}

export interface RivenCalculationStat extends RivenCalculationAttribute {
  gameRef: string
  key: string
  name: string
  englishName: string
  baseValue: number
  unit: RivenAttributeUnit
  spliced: boolean
  canBeBuff: boolean
  canBeCurse: boolean
  verified: boolean
  aliases: string[]
}

export function cleanRivenTemplate(template: string): string {
  return template.replace(/<[^>]*>/g, '').replace(/\|[^|]+\|[%s]?/g, '').replace(/\([^)]*\)/g, '').trim()
}

export function adaptRivenDefinitions(definitions: RivenExportDefinition[]): Record<string, RivenCalculationStat[]> {
  const result: Record<string, RivenCalculationStat[]> = {}
  for (const definition of definitions) {
    const type = rivenDefinitionTypes[definition.uniqueName.split('/').pop()!]
    if (!type)
      continue
    result[type] = []
    for (const entry of definition.upgradeEntries) {
      // The first value is the normal stat; extra values describe conditional effects.
      const raw = entry.upgradeValues[0]
      if (!raw?.locTag || !Number.isFinite(raw.value))
        continue
      const tag = entry.tag
      const spliced = tag in splicedNames
      const englishName = tag === 'WeaponMeleeDamageMod'
        ? 'Damage'
        : tag === 'WeaponFireRateMod'
          ? 'Fire Rate / Attack Speed'
          : cleanRivenTemplate(raw.locTag)
      const name = splicedNames[tag] ?? traditionalNames[tag] ?? englishName
      const unit: RivenAttributeUnit = tag.includes('FactionDamage')
        ? 'multiply'
        : raw.locTag.includes('%')
          ? 'percent'
          : /\|s\b/.test(raw.locTag) ? 'seconds' : ''
      const metadata = ExportUpgrades[definition.uniqueName]?.upgradeEntries?.find(x => x.tag === tag)
      const baseValue = raw.value * 90 * (unit === 'percent' ? 100 : 1) * (raw.reverseValueSymbol ? -1 : 1)
      result[type].push({
        gameRef: tag,
        key: normalizeName(englishName),
        name,
        englishName,
        baseValue,
        unit,
        spliced,
        canBeBuff: spliced || (metadata?.canBeBuff ?? false),
        canBeCurse: !spliced && (metadata?.canBeCurse ?? false),
        verified: tag !== 'WeaponMeleeParryAngleMod' && (spliced || tag in traditionalNames),
        aliases: [name, englishName, cleanRivenTemplate(raw.locTag)],
        i18n: { 'en': { name: englishName }, 'zh-hans': { name } },
      })
    }
  }
  return result
}
