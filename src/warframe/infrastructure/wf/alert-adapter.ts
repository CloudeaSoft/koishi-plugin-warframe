import { dict_en, dict_zh } from 'warframe-public-export-plus'
import { dictEnExtra, dictZhExtra } from '../../assets'
import { createAsyncCache } from '../../utils/cache'
import { resolveExportItemNameZh } from './bounty-adapter'

const alertTranslations = createAsyncCache(async () => {
  const { default: worldstateData } = await import('warframe-worldstate-data')
  const { languageString } = await import('warframe-worldstate-data/utilities')
  const entries = Object.entries({ ...dictZhExtra, ...dict_zh })
  const byKey = new Map(entries
    .map(([key, value]) => [key.toLowerCase(), value]))
  const byEnglish = new Map<string, string>()
  for (const [key, english] of Object.entries({ ...dictEnExtra, ...dict_en })) {
    const chinese = byKey.get(key.toLowerCase())
    if (chinese) {
      byEnglish.set(english.toLowerCase(), chinese)
    }
  }
  // Parser descriptions use WFCD's English wording, which can differ from the export.
  for (const [key, entry] of Object.entries(worldstateData.languages)) {
    const chinese = byKey.get(key.toLowerCase()) ?? worldstateData.zh?.languages[key]?.value
    if (chinese && chinese !== entry.value) {
      byEnglish.set(entry.value.toLowerCase(), chinese)
    }
  }
  // Unknown alert keys are humanized by the parser (e.g. "Tau Prequel Event Alert Title").
  // Recover only unambiguous aliases from official alert strings, never guess a translation.
  const aliases = new Map<string, string | undefined>()
  for (const [key, chinese] of entries) {
    if (!/\/Alerts\/|\/[^/]*Alert(?:Title|Desc)$/i.test(key)) {
      continue
    }
    const english = languageString(key, 'en').toLowerCase()
    aliases.set(english, aliases.has(english) && aliases.get(english) !== chinese ? undefined : chinese)
  }
  for (const [english, chinese] of aliases) {
    if (chinese && !byEnglish.has(english)) {
      byEnglish.set(english, chinese)
    }
  }
  return { byKey, byEnglish }
}, -1)

/** Translate known alert text and keep unknown/localized values intact. */
export async function translateAlertText(source: string): Promise<string> {
  const { byKey, byEnglish } = await alertTranslations.get()
  const translated = byKey.get(source.toLowerCase()) ?? byEnglish.get(source.toLowerCase())
  if (translated) {
    return translated
  }
  if (source.startsWith('/Lotus/')) {
    const itemName = resolveExportItemNameZh(source)
    if (itemName !== source.split('/').pop() && !itemName.startsWith('/Lotus/')) {
      return itemName
    }
  }
  return source
}
