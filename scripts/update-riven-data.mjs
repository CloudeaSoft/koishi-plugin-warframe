import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import lzma from 'lzma'

const BASE = 'https://content.warframe.com/PublicExport/'
const RIVEN_ROOT = '/Lotus/Upgrades/Mods/Randomized/'

function definitions(document) {
  return (document.ExportUpgrades ?? [])
    .filter(d => d.uniqueName?.startsWith(RIVEN_ROOT) && d.upgradeEntries?.length)
    .map(d => ({ uniqueName: d.uniqueName, upgradeEntries: d.upgradeEntries }))
}

export function makeSnapshot(upgrades, weapons, upgradesZh, weaponsZh) {
  const selected = definitions(upgrades)
  const fields = ['uniqueName', 'name', 'productCategory', 'omegaAttenuation', 'primeOmegaAttenuation', 'slot']
  const selectedWeapons = (weapons.ExportWeapons ?? [])
    .filter(w => w.omegaAttenuation > 0)
    .map(w => Object.fromEntries(fields.filter(key => key in w).map(key => [key, w[key]])))
  if (!selected.length || !selectedWeapons.length)
    throw new Error('Missing Riven definitions or weapons in official export')
  for (const definition of selected) {
    for (const entry of definition.upgradeEntries) {
      if (!entry.tag || !entry.upgradeValues?.length)
        throw new Error('Invalid upgrade entry')
      for (const value of entry.upgradeValues) {
        if (!Number.isFinite(value.value))
          throw new Error('Invalid upgrade value')
      }
    }
  }
  for (const weapon of selectedWeapons) {
    for (const key of ['omegaAttenuation', 'primeOmegaAttenuation']) {
      if (key in weapon && (!Number.isFinite(weapon[key]) || weapon[key] < 0.5 || weapon[key] > 1.550001))
        throw new Error(`Invalid disposition: ${weapon.uniqueName}`)
    }
  }
  return {
    upgrades: selected,
    upgradesZh: definitions(upgradesZh),
    weapons: selectedWeapons,
    weaponNamesZh: Object.fromEntries((weaponsZh.ExportWeapons ?? []).map(w => [w.uniqueName, w.name])),
  }
}

export function manifestEntry(index, kind, lang) {
  const prefix = `${kind}_${lang}.json!`
  const matches = index.split(/[\r\n]+/).map(line => line.trim()).filter(line => line.startsWith(prefix))
  if (matches.length !== 1 || !/^[\w.!+\-]+$/.test(matches[0]))
    throw new Error(`Invalid manifest index entry: ${prefix}`)
  return matches[0]
}

async function download(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'koishi-plugin-warframe/riven-data' },
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok)
    throw new Error(`Download failed: ${response.status} ${url}`)
  const data = Buffer.from(await response.arrayBuffer())
  return { data, source: { url, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length } }
}

export function decompressIndex(data) {
  return new Promise((resolve, reject) => {
    lzma.decompress(data, (value, error) => {
      if (error)
        reject(error)
      else if (typeof value !== 'string')
        reject(new Error('Official index is not UTF-8 text'))
      else resolve(value)
    })
  })
}

async function refresh() {
  const documents = {}
  const sources = {}
  for (const lang of ['en', 'zh']) {
    const index = await download(`${BASE}index_${lang}.txt.lzma`)
    sources[`index_${lang}`] = index.source
    const text = await decompressIndex(index.data)
    for (const kind of ['ExportUpgrades', 'ExportWeapons']) {
      const entry = manifestEntry(text, kind, lang)
      const { data, source } = await download(`${BASE}Manifest/${entry}`)
      sources[`${kind}_${lang}`] = source
      documents[`${kind}_${lang}`] = JSON.parse(data.toString('utf8'))
    }
  }
  const snapshot = makeSnapshot(documents.ExportUpgrades_en, documents.ExportWeapons_en, documents.ExportUpgrades_zh, documents.ExportWeapons_zh)
  if (snapshot.upgrades.length < 7 || snapshot.upgradesZh.length < 7)
    throw new Error('Incomplete official Riven export; previous snapshot retained')
  return { schemaVersion: 1, downloadedAt: new Date().toISOString(), sources, ...snapshot }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length && (args[0] !== '--output' || args.length !== 2))
    throw new Error('Usage: yarn riven:update [--output <path>]')
  const output = resolve(args[1] ?? fileURLToPath(new URL('../src/warframe/assets/riven-public-export.json', import.meta.url)))
  const snapshot = await refresh()
  const temporary = `${output}.${process.pid}.tmp`
  await mkdir(dirname(output), { recursive: true })
  try {
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`)
    await rename(temporary, output)
  }
  finally {
    await rm(temporary, { force: true })
  }
  process.stdout.write(`Updated ${output}: ${snapshot.upgrades.length} definitions, ${snapshot.weapons.length} weapons\n`)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main()
}
