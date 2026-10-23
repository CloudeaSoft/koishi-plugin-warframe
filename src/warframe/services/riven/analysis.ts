import type { RivenCalculationStat } from '../../infrastructure/wf/riven-export-adapter'
import type { RivenAnalysisInput, RivenStatAnalyzeResult, RivenStatAnalyzsis, RivenStatCountType, RivenWeaponDisposition, WarframeResult } from '../../types'
import { rivenStatsByType } from '../../data/wf/rivenBaseValues'
import { getRivenWeaponCandidates, weaponRivenDispositionDict } from '../../data/wf/rivenDisposition'
import { rivenStatFixFactor } from '../../data/wf/rivenStatData'
import { failure } from '../../types/warframe-result'
import { normalizeName } from '../../utils/text'

export function analyzeRiven(input: RivenAnalysisInput, variant?: string): WarframeResult<RivenStatAnalyzeResult> {
  let candidates = getRivenWeaponCandidates(input.name)
  if (!candidates.length)
    return failure('riven.weaponNotFound', false, { weapon: input.name })
  if (variant) {
    candidates = candidates.filter(candidate => variant === 'primary' || variant === 'secondary'
      ? candidate.calc.riventype === 'Kitgun' && candidate.name.en.endsWith(`(${variant === 'primary' ? 'Primary' : 'Secondary'})`)
      : [candidate.name.en, candidate.name.zh].some(name => normalizeName(name) === normalizeName(variant)))
    if (!candidates.length)
      return failure('riven.variantError')
  }

  const matches: { data: RivenStatAnalyzeResult, score: number, key: string }[] = []
  // Hotfix 44.1.3 unifies every version at 1.2. Only try historical
  // dispositions when no version matches, so old screenshots still work.
  for (const disposition of [1.2, undefined]) {
    for (const candidate of candidates) {
      const result = analyzeWeaponRivenStat(input, candidate, disposition)
      if (!result.ok)
        return result
      const stats = [...result.data.buffs, ...result.data.curses]
      // Card values are displayed to one decimal (multipliers to two).
      // Accept display rounding at a boundary without broadening the roll model.
      if (!stats.every((stat) => {
        const tolerance = stat.unit === 'multiply' ? 0.005 : 0.05
        return stat.value >= stat.min - tolerance - 1e-8 && stat.value <= stat.max + tolerance + 1e-8
      })) {
        continue
      }
      matches.push({ data: result.data, score: stats.reduce((sum, stat) => sum + Math.abs(stat.percent), 0) / stats.length, key: candidate.name.en })
    }
    if (matches.length)
      break
  }
  if (!matches.length)
    return failure('riven.variantUnmatched')
  // A stable name tie-break keeps equal-disposition variants deterministic.
  matches.sort((a, b) => a.score - b.score || a.key.localeCompare(b.key, 'en'))
  return { ok: true, data: {
    ...matches[0].data,
    variant: {
      status: variant ? 'manual' : matches.length === 1 ? 'matched' : 'inferred',
      candidates: matches.map(match => match.data.name),
    },
  } }
}
export function getWeaponRivenDisposition(
  name: string,
): (typeof weaponRivenDispositionDict)[string] | undefined {
  const normalizedName = normalizeName(name)
  const normalRes = weaponRivenDispositionDict[normalizedName]
  if (normalRes) {
    return normalRes
  }

  const withPrimeSuffix = `${normalizedName}prime`
  const withPrimeRes = weaponRivenDispositionDict[withPrimeSuffix]
  if (withPrimeRes) {
    return withPrimeRes
  }

  return undefined
}

export function analyzeRivenStat(parseResult: RivenAnalysisInput, variant?: string): WarframeResult<RivenStatAnalyzeResult> {
  if (variant && variant !== 'primary' && variant !== 'secondary')
    return failure('riven.variantError')
  const primary = getWeaponRivenDisposition(`${parseResult.name} (Primary)`) ?? getWeaponRivenDisposition(`${parseResult.name}（主武器）`)
  const secondary = getWeaponRivenDisposition(`${parseResult.name} (Secondary)`) ?? getWeaponRivenDisposition(`${parseResult.name}（副武器）`)
  if (!variant && (primary || secondary))
    return failure('riven.variantRequired')
  const weaponRiven = (variant === 'primary' ? primary : variant === 'secondary' ? secondary : undefined) ?? getWeaponRivenDisposition(parseResult.name)
  if (!weaponRiven) {
    return failure('riven.weaponNotFound', false, {
      weapon: parseResult.name,
    })
  }

  return analyzeWeaponRivenStat(parseResult, weaponRiven)
}

function analyzeWeaponRivenStat(
  parseResult: RivenAnalysisInput,
  weaponRiven: RivenWeaponDisposition,
  disposition = weaponRiven.calc.disposition,
): WarframeResult<RivenStatAnalyzeResult> {
  const rank = parseResult.rank ?? 8
  if (!Number.isInteger(rank) || rank < 0 || rank > 8)
    return failure('riven.statTypeError')
  const stats = rivenStatsByType[weaponRiven.calc.riventype]
  if (!stats || parseResult.attributes.length < 2 || parseResult.attributes.length > 4) {
    return failure('riven.statTypeError')
  }
  const entries: { stat: RivenCalculationStat, value: number, displayedValue: number, positive: boolean, sourceIndex: number }[] = []
  const notes: string[] = []
  for (const [sourceIndex, entry] of parseResult.attributes.entries()) {
    const stat = stats.find(s => s.gameRef === entry.attr.gameRef)
      ?? stats.find(s => s.key === normalizeName(entry.attr.i18n?.en?.name ?? ''))
    if (!stat || !Number.isFinite(entry.value) || !stat.baseValue)
      return failure('riven.statTypeError')
    if (!stat.verified)
      return failure('riven.unverifiedStat', false, { stat: stat.name })
    const value = stat.unit === 'multiply' ? entry.value - 1 : entry.value
    const positive = value / stat.baseValue > 0
    // The supplied Strun card has this curse, although generation metadata excludes it.
    // Accept analysis of an existing card without changing the list of rollable stats.
    const observedShotgunZoom = weaponRiven.calc.riventype === 'Shotgun' && stat.gameRef === 'WeaponZoomFovMod' && !positive
    if (value === 0 || (positive ? !stat.canBeBuff : !stat.canBeCurse && !observedShotgunZoom))
      return failure('riven.statTypeError')
    if (observedShotgunZoom)
      notes.push('霰弹枪负变焦按现有卡片兼容解析，范围使用导出基础值作参考；不代表当前可洗出该词条。')
    if (entries.some(e => e.stat.gameRef === stat.gameRef))
      return failure('riven.statTypeError')
    entries.push({ stat, value, displayedValue: entry.value, positive, sourceIndex })
  }
  const buffs = entries.filter(e => e.positive)
  const curses = entries.filter(e => !e.positive)
  if ((buffs.length !== 2 && buffs.length !== 3) || curses.length > 1)
    return failure('riven.statTypeError')
  const layout = `${buffs.length}${curses.length ? '1' : ''}` as RivenStatCountType
  const factors = rivenStatFixFactor[layout]
  const analyze = (entry: typeof entries[number]): RivenStatAnalyzsis => {
    const standard = entry.stat.baseValue * disposition * (entry.positive ? factors.buffFactor : factors.curseFactor) * (rank + 1) / 9
    const offset = entry.stat.unit === 'multiply' ? 1 : 0
    return {
      gameRef: entry.stat.gameRef,
      sourceIndex: entry.sourceIndex,
      name: `${entry.stat.name}${entry.stat.spliced ? '（融合）' : ''}`,
      unit: entry.stat.unit,
      value: entry.displayedValue,
      percent: (entry.value / standard - 1) * (entry.positive ? 1 : -1),
      min: Math.min(standard * 0.9, standard * 1.1) + offset,
      max: Math.max(standard * 0.9, standard * 1.1) + offset,
    }
  }
  if (entries.some(e => e.stat.spliced))
    notes.push('融合词条为参考范围；实际融合数值的继承方式尚未验证。')
  return { ok: true, data: {
    name: weaponRiven.name.zh,
    disposition,
    buffs: buffs.map(analyze),
    curses: curses.map(analyze),
    notes: notes.length ? notes : undefined,
  } }
}
