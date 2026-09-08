// Render a component to PNG outside Koishi, using the same HTML template,
// stylesheet, and icon sprite as the bot's Puppeteer output.
//
//   yarn preview <entry.tsx> [--out <file.png>] [--scale <n>] [--title <text>]
//
// <entry.tsx> is a TypeScript module whose default export is a function
// (sync or async) returning the Satori Element to render. Entries may build
// fixtures or call Warframe facade queries for live data. Run `yarn build`
// first: the bundle is emitted into lib/ so runtime asset lookups resolve to
// lib/assets and lib/warframe/assets.
//
// Chrome is located from PUPPETEER_EXECUTABLE_PATH, then common install
// paths, then PATH. Nothing is written outside --out and lib/.

import { accessSync, constants, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import puppeteer from 'puppeteer-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv) {
  const options = { entry: undefined, out: undefined, scale: 2, title: 'preview' }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--out') {
      options.out = argv[++index]
    }
    else if (arg === '--scale') {
      options.scale = Number(argv[++index])
    }
    else if (arg === '--title') {
      options.title = argv[++index]
    }
    else if (arg.startsWith('--')) {
      throw new Error(`unknown option ${arg}`)
    }
    else if (options.entry === undefined) {
      options.entry = arg
    }
    else {
      throw new Error(`unexpected argument ${arg}`)
    }
  }
  if (!options.entry) {
    throw new Error('usage: yarn preview <entry.tsx> [--out <file.png>] [--scale <n>] [--title <text>]')
  }
  if (!Number.isFinite(options.scale) || options.scale <= 0) {
    throw new Error('--scale must be a positive number')
  }
  return options
}

function findChrome() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/local/bin/google-chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK)
      return candidate
    }
    catch {
      // try the next candidate
    }
  }
  throw new Error('Chrome not found; set PUPPETEER_EXECUTABLE_PATH to a Chrome or Chromium binary')
}

async function bundleEntry(entry) {
  const entryPath = resolve(root, entry)
  if (!existsSync(entryPath)) {
    throw new Error(`entry not found: ${entryPath}`)
  }
  if (!existsSync(resolve(root, 'lib/assets/render.html'))) {
    throw new Error('lib/assets is missing; run `yarn build` before `yarn preview`')
  }

  const wrapper = resolve(root, 'lib/.preview-entry.tsx')
  const bundle = resolve(root, 'lib/.preview-bundle.cjs')
  writeFileSync(wrapper, [
    `import entry from ${JSON.stringify(entryPath)}`,
    `import { renderHtml } from ${JSON.stringify(resolve(root, 'src/components/render.tsx'))}`,
    'export default async function run(title) {',
    '  const element = await entry()',
    '  return renderHtml(element.toString(), title)',
    '}',
  ].join('\n'))

  try {
    await build({
      entryPoints: [wrapper],
      outfile: bundle,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      jsx: 'automatic',
      jsxImportSource: '@satorijs/element',
      packages: 'external',
      absWorkingDir: root,
      tsconfig: resolve(root, 'tsconfig.json'),
      logLevel: 'warning',
    })
  }
  finally {
    rmSync(wrapper, { force: true })
  }
  return bundle
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const outFile = resolve(root, options.out
    ?? `lib/previews/${basename(options.entry, extname(options.entry)).replace(/\.preview$/, '')}.png`)

  const bundle = await bundleEntry(options.entry)
  let html
  try {
    const mod = await import(pathToFileURL(bundle).href)
    const run = mod.default?.default ?? mod.default
    html = await run(options.title)
  }
  finally {
    rmSync(bundle, { force: true })
  }

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: options.scale })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const handle = await page.$('#root>*')
    if (!handle) {
      throw new Error('the entry rendered nothing under #root')
    }
    const clip = await handle.boundingBox()
    mkdirSync(dirname(outFile), { recursive: true })
    writeFileSync(outFile, await page.screenshot({ clip: clip ?? undefined }))
  }
  finally {
    await browser.close()
  }

  process.stdout.write(`${outFile}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
