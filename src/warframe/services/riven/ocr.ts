import type { RivenCalculationStat } from '../../infrastructure/wf/riven-export-adapter'
import type { OcrTextBlock } from '../../types/ocr'
import { rivenPublicExport } from '../../assets/index'
import { rivenStatsByType } from '../../data/wf/rivenBaseValues'
import { weaponRivenDispositionDict } from '../../data/wf/rivenDisposition'
import { fullWidthToHalfWidth, normalizeName, normalSimilarity } from '../../utils/text'

interface OcrRow {
  text: string
  fragmented: boolean
  box?: OcrTextBlock['box']
}

export interface ParsedRiven {
  name: string
  attributes: { attr: RivenCalculationStat, value: number, prefix: string }[]
}

function cleanText(text: string): string {
  return fullWidthToHalfWidth(text).trim().replace(/−/g, '-').replace(/×/g, 'x')
}

function validBox(box: OcrTextBlock['box']): box is NonNullable<OcrTextBlock['box']> {
  return !!box && Object.values(box).every(Number.isFinite) && box.width > 0 && box.height > 0
}

/** A cursor above the reroll counter can be read as a stray, low-confidence Han glyph. */
function isFooterCursor(row: OcrTextBlock[], nextRow?: OcrTextBlock[]): boolean {
  const glyph = row[0]
  if (row.length !== 1 || !/^[\u4E00-\u9FFF]$/.test(glyph.text)
    || glyph.confidence === undefined || glyph.confidence < 0 || glyph.confidence >= 60) {
    return false
  }
  const rank = nextRow?.find(b => isRank(b.text))
  if (!rank)
    return false
  const box = glyph.box!
  const footer = rank.box!
  if (box.height > footer.height || box.width > box.height * 1.5
    || box.y >= footer.y || box.y + box.height < footer.y - footer.height * 0.25
    || box.y + box.height > footer.y + footer.height * 0.5) {
    return false
  }
  // Require alignment with the numeric counter to the right of the rank, not the stat column.
  return nextRow!.some(b => /^\d+$/.test(b.text) && b.box!.x > footer.x + footer.width
    && Math.min(box.x + box.width, b.box!.x + b.box!.width) - Math.max(box.x, b.box!.x) >= box.width * 0.5)
}

/** Group by baseline, not vendor result order; discard only spatially identified overlays. */
function restoreRows(input: readonly (string | OcrTextBlock)[]): OcrRow[] | undefined {
  const blocks = input.map(b => typeof b === 'string' ? { text: b } : b)
    .map(b => ({ ...b, text: cleanText(b.text) }))
    .filter(b => b.text)
  const positioned = blocks.filter(b => validBox(b.box)).length
  if (positioned > 0 && positioned !== blocks.length)
    return undefined
  if (!positioned)
    return blocks.map(b => ({ text: b.text, fragmented: false }))

  const rows: OcrTextBlock[][] = []
  for (const block of [...blocks].sort((a, b) => a.box!.y + a.box!.height / 2 - b.box!.y - b.box!.height / 2)) {
    const box = block.box!
    const row = rows.find((r) => {
      const anchor = r[0].box!
      return Math.abs(box.y + box.height / 2 - anchor.y - anchor.height / 2) <= Math.min(box.height, anchor.height) * 0.6
        || (/^\d+%$/.test(block.text) && box.height < anchor.height * 0.65
          && box.y >= anchor.y && box.y + box.height <= anchor.y + anchor.height)
    })
    if (row)
      row.push(block)
    else
      rows.push([block])
  }

  const result: OcrRow[] = []
  for (const [index, row] of rows.entries()) {
    if (isFooterCursor(row, rows[index + 1]))
      continue
    const parts = row.sort((a, b) => a.box!.x - b.box!.x)
    const first = parts[0]
    const last = parts.at(-1)!
    const fragmented = parts.length > 1 && /^[+\-x]?\d+(?:\.\d+)?%?$/i.test(first.text) && /\p{L}/u.test(last.text)
    const kept = parts.filter((b, i) => !(fragmented && i > 0 && i < parts.length - 1
      && /^\d+%$/.test(b.text) && b.box!.height < Math.min(first.box!.height, last.box!.height) * 0.65))
    if (fragmented && kept.slice(1).some(b => /^[+\-x]?\d/i.test(b.text)))
      return undefined
    for (let i = 1; i < kept.length; i++) {
      const left = kept[i - 1].box!
      const right = kept[i].box!
      // Distant columns cannot be joined into a single card's attribute.
      if (!isMetadata(first.text) && right.x - left.x - left.width > Math.max(left.height, right.height) * 4)
        return undefined
    }
    const top = Math.min(...kept.map(b => b.box!.y))
    result.push({ text: kept.map(b => b.text).join(' '), fragmented, box: {
      x: first.box!.x,
      y: top,
      width: Math.max(...kept.map(b => b.box!.x + b.box!.width)) - first.box!.x,
      height: Math.max(...kept.map(b => b.box!.y + b.box!.height)) - top,
    } })
  }
  return result
}

const weaponNames = [...new Map(Object.values(weaponRivenDispositionDict).flatMap(weapon =>
  [weapon.name.zh, weapon.name.en].map((display) => {
    // A Kitgun's card names its chamber; primary/secondary is selected separately.
    const name = display.replace(/\s*\((?:Primary|Secondary)\)|（[主副]武器）/g, '')
    return [normalizeName(name), { name, type: weapon.calc.riventype }] as const
  }),
)).entries()].sort((a, b) => b[0].length - a[0].length)

const rivenNameParts = [...new Set(rivenPublicExport.upgrades.flatMap(d => d.upgradeEntries
  .flatMap(e => [e.prefixTag, e.suffixTag])
  .filter((s): s is string => !!s && /^[a-z]+$/.test(s))))]
const rivenNamePattern = new RegExp(`^(?:${rivenNameParts.join('|')}){1,3}$`, 'i')

function isRivenName(text: string): boolean {
  return rivenNamePattern.test(normalizeName(text))
}

function findWeapon(text: string): { name: string, type: string } | undefined {
  const normalized = normalizeName(text)
  for (const [key, weapon] of weaponNames) {
    if (normalized === key)
      return weapon
    const remainder = normalized.slice(key.length)
    if (normalized.startsWith(key) && isRivenName(remainder) && !weaponNames.some(([name]) => name === remainder))
      return weapon
  }
}

function normalizeStat(text: string): string {
  return normalizeName(text).replace(/的/g, '').replace(/暴击率/g, '暴击几率').replace(/弹药最大值/g, '弹药上限').replace(/触发时间/g, '触发持续时间').replace(/触发伤害/g, '异常状态伤害').replace(/orokin/g, '奥罗金').replace(/techrot/g, '科腐者').replace(/scaldra/g, '炽蛇军')
}

const elemental = /Weapon(?:Electricity|Fire|Freeze|Toxin|Impact|ArmorPiercing|Slash|Blast|Corrosive|Gas|Magnetic|Radiation|Viral)DamageMod/

function aliases(stat: RivenCalculationStat): string[] {
  const names = stat.aliases.flatMap(name => name.split('/'))
  if (stat.gameRef === 'WeaponProjectileSpeedMod')
    names.push('投射物速度')
  if (elemental.test(stat.gameRef))
    names.push(`${stat.name}伤害`)
  if (stat.gameRef === 'WeaponDamageAmountMod' || stat.gameRef === 'WeaponMeleeDamageMod')
    names.push('伤害')
  return [...new Set(names.map(normalizeStat))]
}

function matchStat(label: string, stats: RivenCalculationStat[], fragmented: boolean): RivenCalculationStat | undefined {
  const input = normalizeStat(label)
  const candidates = stats.map(stat => ({ stat, names: aliases(stat) }))
  const exact = candidates.filter(c => c.names.includes(input))
  if (exact.length)
    return exact.length === 1 ? exact[0].stat : undefined

  // OCR reads impact as 入/人 and corrosive as 心; require an exact remaining label.
  const icon = candidates.filter(c => elemental.test(c.stat.gameRef)
    && (/^[入人]/.test(input) || (c.stat.gameRef === 'WeaponCorrosiveDamageMod' && input.startsWith('心')))
    && c.names.includes(input.slice(1)))
  if (icon.length === 1)
    return icon[0].stat

  // Occlusion can hide a prefix. Require spatial reconstruction and a unique >=3-character suffix.
  if (fragmented && /^[\u4E00-\u9FFF]{3,}$/.test(input)) {
    const suffix = candidates.filter(c => c.names.some(name => name.endsWith(input) && name.length - input.length <= 3))
    if (suffix.length)
      return suffix.length === 1 ? suffix[0].stat : undefined
  }

  const ranked = candidates.map(c => ({ stat: c.stat, score: Math.max(...c.names.map(name => normalSimilarity(name, input))) }))
    .sort((a, b) => b.score - a.score)
  // Do not turn arbitrary extra words into an exact-looking shorter label.
  if (candidates.some(c => c.names.some(name => name.length >= 3 && input !== name && (input.endsWith(name) || name.endsWith(input)))))
    return undefined
  return ranked[0]?.score >= 0.8 && ranked[0].score - (ranked[1]?.score ?? 0) >= 0.15 ? ranked[0].stat : undefined
}

function isRank(text: string): boolean {
  return /^(?:段位|等级|循环)\s*\d|^\d+\s*(?:段位|等级|次|循环)/.test(text)
}

function isMetadata(text: string): boolean {
  return isRank(text) || /^\d[\d\s~\-]*$/.test(text)
}

const conditionalAnnotation = /\((?:弓类武器效果加倍|重击时x2|x2forBows|x2forHeavyAttacks)\)$/i

function canWrapLabel(row: OcrRow, next: OcrRow): boolean {
  if (!/^\p{L}+$/u.test(next.text.replace(/\s/g, '')))
    return false
  if (!row.box || !next.box)
    return true
  const gap = next.box.y - row.box.y - row.box.height
  const height = Math.min(row.box.height, next.box.height)
  return gap >= -height * 0.25 && gap <= height * 0.75
    && next.box.x >= row.box.x && next.box.x + next.box.width <= row.box.x + row.box.width
}

export function parseRivenOcr(input: readonly (string | OcrTextBlock)[]): ParsedRiven | undefined {
  const rows = restoreRows(input)
  if (!rows?.length)
    return undefined

  const titles = rows.map((r, index) => ({ weapon: findWeapon(r.text), index })).filter(t => t.weapon)
  if (titles.length !== 1)
    return undefined
  const title = titles[0]
  if (rows.slice(0, title.index).some(r => /^6?[+\-x]\d|^\d+(?:\.\d+)?%/i.test(r.text)))
    return undefined
  const weapon = title.weapon!
  const stats = rivenStatsByType[weapon.type]
  if (!stats)
    return undefined
  const attributes: ParsedRiven['attributes'] = []
  let footer = false
  for (let i = title.index + 1; i < rows.length; i++) {
    const row = rows[i]
    let text = row.text.replace(/\s/g, '')
    if (isRank(text)) {
      footer = true
      continue
    }
    if (footer && /^\d+$/.test(text))
      continue
    // A wrapped Latin riven suffix belongs to the title, before the first attribute.
    if (!attributes.length && isRivenName(text))
      continue

    // Locked attributes display a padlock; Tencent sometimes reads it as a leading 6.
    text = text.replace(/^[6🔒]([+\-x])/iu, '$1')
    if (text.includes('(') && !text.includes(')') && rows[i + 1]) {
      const joined = text + rows[i + 1].text.replace(/\s/g, '')
      // A wrapped x2 is explanatory text only when it completes a known annotation.
      if (conditionalAnnotation.test(joined)) {
        text = joined
        i++
      }
    }
    text = text.replace(conditionalAnnotation, '')
    const match = text.match(/^([+\-x]?)(\d+(?:\.\d+)?)(%|s)?([\p{L}/]+)$/iu)
    if (!match)
      return undefined
    const next = rows[i + 1]
    if (next && canWrapLabel(row, next)) {
      const label = normalizeStat(match[4])
      const joined = match[4] + next.text.replace(/\s/g, '')
      // Complete only a known label; never guess missing numbers or extend an already complete stat.
      if (!stats.some(s => aliases(s).includes(label))
        && stats.filter(s => aliases(s).includes(normalizeStat(joined))).length === 1) {
        match[4] = joined
        i++
      }
    }
    const [, symbol, number, unit, label] = match
    if (!symbol && input.some(b => typeof b !== 'string'))
      return undefined
    const attr = matchStat(label, stats, row.fragmented)
    if (!attr || attributes.some(a => a.attr.gameRef === attr.gameRef))
      return undefined
    const prefix = symbol.toLowerCase()
    if ((prefix === 'x') !== (attr.unit === 'multiply') || (unit === '%' && attr.unit !== 'percent') || (unit === 's' && attr.unit !== 'seconds'))
      return undefined
    const value = Number(number) * (prefix === '-' ? -1 : 1)
    if (!Number.isFinite(value) || value === 0)
      return undefined
    attributes.push({ attr, value, prefix })
  }
  return attributes.length >= 2 && attributes.length <= 4 ? { name: weapon.name, attributes } : undefined
}
