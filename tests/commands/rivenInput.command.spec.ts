import type { Argv, Plugin } from 'koishi'
import mock from '@koishijs/plugin-mock'
import { expect } from 'chai'
import { App, h } from 'koishi'
import { setupCommands } from '../../src/commands'
import { t } from '../../src/i18n'

describe('riven image command boundaries', () => {
  const app = new App({ prefix: ['/'] })
  const adapter = app.plugin(mock as Plugin.Object)
  const dependencies = {
    config: { developerMode: false, ocrAPISecret: { id: '', key: '' }, channelIds: {} },
    logger: app.logger('riven-input-test'),
    render: async () => 'rendered',
  }
  setupCommands(app, dependencies)
  const direct = app.mock.client('riven-user')
  const group = app.mock.client('riven-user', 'riven-group')
  const url = 'https://example.com/riven.png?fileid=test&rkey=a%2Bb'
  const image = h.image(url).toString()
  const received: Argv[] = []
  let originalContent: string | undefined
  app.before('parse', (_content, session) => {
    originalContent = session.content
  })
  app.on('command/before-execute', (argv) => {
    if (argv.command?.name === 'riven') {
      received.push(argv)
    }
  })

  beforeAll(() => app.start())
  beforeEach(() => {
    received.length = 0
  })
  afterAll(async () => {
    await adapter.dispose()
    await app.stop()
  })

  for (const content of [`riven${image}`, `RIVEN${image}`, `/riven${image}`, `riven ${image}`, `riven\n${image}`]) {
    it(`passes the image argument through for ${content.slice(0, content.indexOf('<'))}`, async () => {
      await direct.shouldReply(content, t('riven.ocrNotConfigured'))
      expect(received).to.have.length(1)
      expect(received[0].args?.[0]).to.have.property('src', url)
      expect(received[0].session?.content).to.equal(originalContent)
    })
  }

  it('accepts an attached image after a group command prefix', async () => {
    await group.shouldReply(`/riven${image}`, t('riven.ocrNotConfigured'))
    expect(received[0].args?.[0]).to.have.property('src', url)
  })

  it('accepts a bot mention without requiring a command prefix', async () => {
    await group.shouldReply(`${h.at(direct.bot.selfId)}riven${image}`, t('riven.ocrNotConfigured'))
    expect(received).to.have.length(1)
  })

  it('does not bypass the group prefix or another user mention', async () => {
    await group.shouldNotReply(`riven${image}`)
    await group.shouldNotReply(`${h.at('someone-else')}/riven${image}`)
    expect(received).to.have.length(0)
  })

  it('preserves existing options', async () => {
    await direct.shouldReply(`riven -v primary ${image}`, t('riven.ocrNotConfigured'))
    expect(received[0].options).to.have.property('variant', 'primary')
    expect(received[0].args?.[0]).to.have.property('src', url)
  })

  it('preserves strict-prefix enforcement even in direct messages', async () => {
    const strict = new App({ prefix: ['/'], prefixMode: 'strict' })
    const strictAdapter = strict.plugin(mock as Plugin.Object)
    setupCommands(strict, dependencies)
    const strictClient = strict.mock.client('strict-user')
    const actions: Argv[] = []
    strict.on('command/before-execute', (argv) => {
      actions.push(argv)
    })
    await strict.start()
    try {
      await strictClient.receive(`riven${image}`)
      expect(actions).to.have.length(0)
      await strictClient.shouldReply(`/riven${image}`, t('riven.ocrNotConfigured'))
      expect(actions).to.have.length(1)
    }
    finally {
      await strictAdapter.dispose()
      await strict.stop()
    }
  })

  it('does not interpret other command names or escaped markup as riven images', async () => {
    for (const content of [`rivenfoo${image}`, `riven-stat${image}`, `hello riven${image}`, `riven${h.text(image)}`]) {
      await direct.shouldNotReply(content)
    }
    expect(received).to.have.length(0)
  })
})
