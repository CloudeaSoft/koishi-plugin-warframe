import type { PluginDependencies } from '../../src/types/config'
import { expect } from 'chai'
import { App } from 'koishi'
import { setupCommands } from '../../src/commands'

describe('command registration', () => {
  it('hides the cache update command from help output', () => {
    const app = new App()
    const deps: PluginDependencies = {
      config: {
        channelIds: {},
        developerMode: false,
        ocrAPISecret: { id: '', key: '' },
      },
      logger: app.logger('command-registration-test'),
      render: async () => '',
    }

    setupCommands(app, deps)

    expect(app.$commander.resolve('wmu')?.config.hidden).to.equal(true)
  })
})
