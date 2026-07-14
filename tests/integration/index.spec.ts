import type { Plugin } from 'koishi'
import mock from '@koishijs/plugin-mock'
import { App } from 'koishi'
import * as warframe from '../../src/index'

const app = new App()
app.plugin(mock as Plugin.Object)
app.plugin(warframe as unknown as Plugin.Object, {
  developerMode: false,
  ocrAPISecret: { id: '', key: '' },
})

const client = app.mock.client('123')

app.middleware(({ content }, next) => {
  if (content === '天王盖地虎') {
    return '宝塔镇河妖'
  }
  else {
    return next()
  }
})

beforeAll(() => app.start())

describe('main Project', () => {
  it('example', async () => {
    await client.shouldReply('天王盖地虎', '宝塔镇河妖')
    await client.shouldReply('天王盖地虎')
    await client.shouldNotReply('宫廷玉液酒')
  })
})
