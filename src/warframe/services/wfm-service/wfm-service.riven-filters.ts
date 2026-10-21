import type { RivenAttribute, RivenItem, WarframeResult } from '../../types'
import type { RivenOrderFilters } from '../../types/wfm'
import type { ItemMatchResult } from './wfm-service.chinese-matcher'
import { failure } from '../../types/warframe-result'
import { normalizeName } from '../../utils'
import { matchRivenItem } from './wfm-service.riven-item-matcher'

const attributeAliases: Record<string, string[]> = {
  'critical_chance': ['暴击几率', '暴击', '爆击', '爆击率', '爆击几率', '暴率', '爆率'],
  'critical_damage': ['暴伤', '爆伤', '爆击伤害'],
  'multishot': ['多重'],
  'base_damage_/_melee_damage': ['伤害', '基伤', '基础伤害', '近战伤害', '基础伤害/近战伤害'],
  'fire_rate_/_attack_speed': ['射速', '攻速', '攻击速度'],
  'status_chance': ['触发率', '触发'],
  'status_duration': ['触发持续时间', '触时'],
  'status_damage': ['异常伤害', '异况伤害', '触发伤害'],
  'reload_speed': ['装填', '换弹', '换弹速度'],
  'magazine_capacity': ['弹匣', '弹夹', '弹夹容量', '弹容'],
  'ammo_maximum': ['弹药', '备弹', '弹药上限', '弹药最大值'],
  'ammo_efficiency': ['弹效'],
  'zoom': ['变'],
  'projectile_speed': ['弹速', '投射', '投射物', '投射物飞行速度', '投射物速度'],
  'recoil': ['后座', '后坐', '后坐力', '后座力'],
  'range': ['范围'],
  'heat_damage': ['火', '火伤'],
  'cold_damage': ['冰', '冰伤'],
  'toxin_damage': ['毒', '毒伤'],
  'electric_damage': ['电', '电伤'],
  'viral': ['病毒'],
  'corrosive': ['腐蚀'],
  'magnetic': ['磁力'],
  'radiation': ['辐射'],
  'blast': ['爆炸'],
  'gas': ['毒气'],
  'impact_damage': ['冲击', '冲'],
  'puncture_damage': ['穿刺', '穿'],
  'slash_damage': ['切割', '切'],
  'punch_through': ['穿透深度'],
  'finisher_damage': ['处决'],
  'channeling_damage': ['初连', '初始连击', '初始连击数'],
  'channeling_efficiency': ['重击效能'],
  'combo_duration': ['连击时间', '连击时长', '连击持续'],
  'critical_chance_on_slide_attack': ['滑暴', '滑爆', '滑行暴击', '滑行爆击', '滑行攻击暴击率'],
  'chance_to_gain_extra_combo_count': ['额外连击', '额外连击几率'],
  'chance_to_gain_combo_count': ['连击获取', '连击获取几率'],
  'heavy_attack_wind_up_speed': ['重击蓄力速度', '重击前摇速度'],
  'melee_damage_on_heavy_attack': ['重击伤害'],
  'slam_attack_damage': ['震地', '震地伤害'],
  'parry_angle': ['格挡', '格挡角度'],
  'magazine_reloaded_s_when_holstered': ['收起装填', '收纳装填', '自动装填'],
  'weak_point_critical_chance': ['弱点暴击', '弱点爆击', '弱点暴率', '弱点爆率'],
  'weak_point_damage': ['弱点'],
  'damage_vs_corpus': ['C', 'C族'],
  'damage_vs_grineer': ['G', 'G族'],
  'damage_vs_infested': ['I', 'I族'],
  'damage_to_orokin': ['O', 'O族'],
  'damage_to_scaldra': ['炽蛇', '炽蛇军'],
  'damage_to_techrot': ['科腐', '科腐者'],
}

export async function matchRivenOrderInput(input: string): Promise<{
  itemMatch: ItemMatchResult<RivenItem>
  weaponName: string
  attributeNames: string[]
}> {
  const tokens = input.split(/\s+/)
  // Longest matching prefix preserves multiword weapon names and existing
  // fragment/homophone matching. Everything after it must be a valid filter.
  for (let end = tokens.length; end > 0; end--) {
    const weaponName = tokens.slice(0, end).join(' ')
    const itemMatch = await matchRivenItem(weaponName)
    if (itemMatch.type !== 'not-found')
      return { itemMatch, weaponName, attributeNames: tokens.slice(end) }
  }
  return { itemMatch: { type: 'not-found' } as const, weaponName: input, attributeNames: [] }
}

export function parseRivenOrderFilters(
  tokens: string[],
  attributes: RivenAttribute[],
): WarframeResult<RivenOrderFilters> {
  const lookup = new Map<string, RivenAttribute>()
  for (const attribute of attributes) {
    const names = [attribute.slug, attribute.i18n?.['zh-hans']?.name, attribute.i18n?.en?.name, ...attributeAliases[attribute.slug] ?? []]
    for (const name of names) {
      if (name)
        lookup.set(normalizeName(name), attribute)
    }
  }

  const positives = new Set<string>()
  const negatives = new Set<string>()
  for (const token of tokens) {
    const negative = token.startsWith('负')
    const name = negative ? token.slice(1) : token
    const attribute = lookup.get(normalizeName(name))
    if (!attribute)
      return failure('wfm.rivenAttributeNotFound', false, { input: token })
    if ((negative && attribute.positiveOnly) || (!negative && attribute.negativeOnly))
      return failure('wfm.rivenAttributePolarity', false, { input: token })
    const target = negative ? negatives : positives
    const opposite = negative ? positives : negatives
    if (opposite.has(attribute.slug))
      return failure('wfm.rivenFilterConflict', false, { input: name })
    target.add(attribute.slug)
  }
  if (positives.size > 3 || negatives.size > 1)
    return failure('wfm.rivenFilterLimit')

  return {
    ok: true,
    data: {
      ...(positives.size ? { positiveStats: [...positives].sort() } : {}),
      ...(negatives.size ? { negativeStat: [...negatives][0] } : {}),
    },
  }
}
