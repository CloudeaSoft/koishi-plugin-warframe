import { Buffer } from 'node:buffer'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ZH_DICT_URL
  = 'https://github.com/calamity-inc/warframe-languages-bin-data/raw/refs/heads/senpai/zh.json'
const MIN_BYTES = 1_000_000
const dest = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/warframe/assets/zh.json',
)

const force = process.argv.includes('--force')
if (!force && existsSync(dest) && statSync(dest).size >= MIN_BYTES) {
  process.stdout.write(`zh.json already present (${statSync(dest).size} bytes)\n`)
  process.exit(0)
}

const response = await fetch(ZH_DICT_URL, { redirect: 'follow' })
if (!response.ok) {
  throw new Error(`download zh.json failed: ${response.status} ${response.statusText}`)
}

const buffer = Buffer.from(await response.arrayBuffer())
JSON.parse(buffer.toString('utf8'))
mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, buffer)
process.stdout.write(`wrote ${dest} (${buffer.length} bytes)\n`)
