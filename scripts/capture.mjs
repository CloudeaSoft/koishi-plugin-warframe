#!/usr/bin/env node
/**
 * Talk to the real bot and keep what it replies.
 *
 * Boots a Koishi App in this process with the built plugin (`lib/index.js`),
 * the services it requires (cron, an in-memory database, koishi-plugin-puppeteer
 * pointed at the local Chrome) and the mock adapter from @koishijs/plugin-mock.
 * Every argument is sent as a chat message; the replies go through the same
 * command -> service -> component -> Puppeteer pipeline a production bot uses.
 * Images found in the replies are decoded to PNG files, text replies are saved
 * next to them, and a Markdown manifest is printed for pasting into a PR.
 *
 *   yarn build
 *   yarn capture "fissure" "wmi 强化装甲"
 *   yarn capture --out /opt/cursor/artifacts --prefix loop-7 "alert"
 *
 * Options:
 *   --out <dir>          where to write files. Defaults to /opt/cursor/artifacts
 *                        when it exists (Cloud Agent), otherwise lib/captures.
 *   --prefix <name>      file name prefix (default: capture).
 *   --worldstate <mode>  auto | live | fixture | <path-to-worldState.json>.
 *                        `auto` uses the live API when reachable and otherwise
 *                        replays tests/assets/example-world-state.json, because
 *                        api.warframe.com rejects many data-centre IPs.
 *   --timeout <ms>       per-message wait for replies (default: 90000).
 *   --user <id>          mock user id (default: 100000).
 *   --channel <id>       mock guild channel id; omit for a private chat.
 */
import { Buffer } from 'node:buffer'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const worldStateUrl = 'https://api.warframe.com/cdn/worldState.php'
const worldStateFixture = join(packageRoot, 'tests/assets/example-world-state.json')
const defaultArtifactsDir = '/opt/cursor/artifacts'

function parseArgs(argv) {
  const options = {
    out: existsSync(defaultArtifactsDir) ? defaultArtifactsDir : join(packageRoot, 'lib/captures'),
    prefix: 'capture',
    worldstate: 'auto',
    timeout: 90_000,
    user: '100000',
    channel: undefined,
  }
  const messages = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      messages.push(arg)
      continue
    }
    const key = arg.slice(2)
    if (!(key in options)) {
      fail(`Unknown option ${arg}`)
    }
    const value = argv[++i]
    if (value === undefined) {
      fail(`Missing value for ${arg}`)
    }
    options[key] = key === 'timeout' ? Number(value) : value
  }

  if (messages.length === 0) {
    fail('Nothing to send. Usage: yarn capture [options] "<message>" ["<message>" ...]')
  }
  return { options, messages }
}

function fail(reason) {
  console.error(reason)
  process.exit(1)
}

function slug(text) {
  return text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .slice(0, 40) || 'message'
}

async function probeLiveWorldState() {
  try {
    const response = await fetch(worldStateUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
      signal: AbortSignal.timeout(15_000),
    })
    return response.ok
  }
  catch {
    return false
  }
}

/**
 * Decide where world-state JSON comes from. Returns a description for the
 * manifest and installs a fetch shim when a fixture has to be replayed; the
 * plugin's HTTP utility ends up in globalThis.fetch, so nothing in `src/`
 * needs a test hook for this.
 */
async function configureWorldState(mode) {
  let fixturePath
  if (mode === 'live' || mode === 'auto') {
    if (await probeLiveWorldState()) {
      return 'live api.warframe.com'
    }
    if (mode === 'live') {
      fail(`${worldStateUrl} is not reachable from this machine; use --worldstate fixture`)
    }
    fixturePath = worldStateFixture
  }
  else {
    fixturePath = mode === 'fixture' ? worldStateFixture : resolve(mode)
  }

  const body = shiftWorldStateToNow(readFileSync(fixturePath, 'utf8'))
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input)
    if (url.startsWith(worldStateUrl)) {
      return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } })
    }
    return originalFetch(input, init)
  }
  return `fixture ${fixturePath}, timestamps shifted to now (live API unreachable or fixture requested)`
}

/**
 * A recorded world state is all "expired" by the time it is replayed, so every
 * `{ $date: { $numberLong } }` is moved forward by the age of the snapshot.
 * Relative durations stay intact, which is what the renderers care about.
 */
function shiftWorldStateToNow(json) {
  const state = JSON.parse(json)
  const recordedAt = Number(state.Time) * 1000
  if (!Number.isFinite(recordedAt) || recordedAt <= 0) {
    return json
  }
  const delta = Date.now() - recordedAt

  const shift = (value) => {
    if (Array.isArray(value)) {
      return value.map(shift)
    }
    if (value && typeof value === 'object') {
      const long = value.$date?.$numberLong
      if (typeof long === 'string' && /^\d+$/.test(long)) {
        return { $date: { $numberLong: String(Number(long) + delta) } }
      }
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shift(v)]))
    }
    return value
  }

  const shifted = shift(state)
  shifted.Time = Math.floor(Date.now() / 1000)
  return JSON.stringify(shifted)
}

async function bootApp(options) {
  const pluginEntry = join(packageRoot, 'lib/index.js')
  if (!existsSync(pluginEntry)) {
    fail('lib/index.js is missing; run `yarn build` first')
  }

  const { App } = require('koishi')
  // Some of these ship a default export (a class), others only `apply`.
  const load = (id) => {
    const mod = require(id)
    return mod.default ?? mod
  }

  const app = new App()
  app.plugin(load('@koishijs/plugin-mock'))
  app.plugin(load('@koishijs/plugin-database-memory'))
  app.plugin(load('koishi-plugin-cron'))
  // koishi-plugin-puppeteer injects `http`, which koishi ships as a dependency
  // but only the CLI loader enables by default.
  app.plugin(load('@koishijs/plugin-http'))
  app.plugin(load('koishi-plugin-puppeteer'), {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      || ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
        .find(path => existsSync(path)),
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  app.plugin(load(pluginEntry), {
    developerMode: false,
    ocrAPISecret: { id: '', key: '' },
  })

  await app.start()

  const deadline = Date.now() + 30_000
  while (!app.$commander.get('fissure')) {
    if (Date.now() > deadline) {
      await app.stop()
      fail('The warframe plugin did not register its commands within 30s (a required service failed to start?)')
    }
    await new Promise(r => setTimeout(r, 100))
  }

  return { app, client: app.mock.client(options.user, options.channel) }
}

function decodeImage(src) {
  const dataUrl = /^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(src)
  if (dataUrl) {
    return { mime: dataUrl[1], buffer: Buffer.from(dataUrl[2], 'base64') }
  }
  if (src.startsWith('base64://')) {
    return { mime: 'image/png', buffer: Buffer.from(src.slice('base64://'.length), 'base64') }
  }
  if (src.startsWith('file://')) {
    return { mime: 'image/png', buffer: readFileSync(fileURLToPath(src)) }
  }
  return undefined
}

async function captureReplies(client, message, timeout) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`no reply within ${timeout}ms`)), timeout))
  return Promise.race([client.receive(message), timer])
}

function splitReply(h, reply) {
  const elements = h.parse(reply)
  const images = h.select(elements, 'img, image')
    .map(element => decodeImage(element.attrs.src ?? ''))
    .filter(Boolean)
  const text = h.transform(elements, { img: '', image: '' })
    .map(element => element.toString(true))
    .join('')
    .trim()
  return { images, text }
}

async function main() {
  const { options, messages } = parseArgs(process.argv.slice(2))
  mkdirSync(options.out, { recursive: true })

  const worldStateSource = await configureWorldState(options.worldstate)
  const { app, client } = await bootApp(options)
  const { h } = require('koishi')

  const rows = []
  let failures = 0
  try {
    for (const message of messages) {
      const base = `${options.prefix}-${slug(message)}`
      const row = { message, files: [], text: '', error: undefined }
      rows.push(row)

      let replies
      try {
        replies = await captureReplies(client, message, options.timeout)
      }
      catch (error) {
        row.error = error instanceof Error ? error.message : String(error)
        failures++
        continue
      }

      const texts = []
      let imageIndex = 0
      for (const reply of replies) {
        const { images, text } = splitReply(h, reply)
        for (const image of images) {
          const ext = image.mime === 'image/jpeg' ? 'jpg' : image.mime.split('/')[1] ?? 'png'
          const file = join(options.out, `${base}${images.length > 1 || imageIndex ? `-${imageIndex + 1}` : ''}.${ext}`)
          writeFileSync(file, image.buffer)
          row.files.push(file)
          imageIndex++
        }
        if (text) {
          texts.push(text)
        }
      }
      if (texts.length > 0) {
        row.text = texts.join('\n---\n')
        const file = join(options.out, `${base}.txt`)
        writeFileSync(file, `${row.text}\n`)
        row.files.push(file)
      }
      if (replies.length === 0) {
        row.error = 'the bot did not reply'
        failures++
      }
    }
  }
  finally {
    // app.stop() trips a dispose bug in @koishijs/plugin-mock; releasing Chrome
    // is the only teardown that matters before the process exits.
    await app.puppeteer?.browser?.close().catch(() => {})
  }

  console.log(`World state: ${worldStateSource}`)
  console.log('')
  console.log('| Message | Files | Text reply |')
  console.log('| --- | --- | --- |')
  for (const row of rows) {
    const files = row.files.map(file => `\`${file}\``).join('<br>') || '-'
    const text = row.error
      ? `**${row.error}**`
      : row.text.replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 120) || '-'
    console.log(`| \`${row.message}\` | ${files} | ${text} |`)
  }
  console.log('')
  for (const row of rows) {
    for (const file of row.files.filter(f => !f.endsWith('.txt'))) {
      console.log(`<img alt="${row.message}" src="${file}" />`)
    }
  }

  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
