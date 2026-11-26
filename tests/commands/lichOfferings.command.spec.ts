import type { Element, Plugin } from 'koishi'
import mock from '@koishijs/plugin-mock'
import { expect } from 'chai'
import { App } from 'koishi'
import { vi } from 'vitest'
import { setupCommands } from '../../src/commands'
import * as http from '../../src/warframe/utils/http'
import tenet from '../assets/lich-offerings/tenet.json'

describe('vendor valence commands', () => {
  const app = new App()
  const adapter = app.plugin(mock as Plugin.Object)
  const client = app.mock.client('vendor-shopper')
  let card = ''
  setupCommands(app, {
    config: { developerMode: false, channelIds: {} },
    logger: app.logger('valence-test'),
    render: async (element: Element) => {
      card = element.toString(true)
      return 'rendered'
    },
  })

  beforeAll(() => app.start())
  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => {
    await adapter.dispose()
    await app.stop()
  })

  for (const [alias, family] of [
    ['lich-c', '信条'],
    ['lichc', '信条'],
    ['信条数值', '信条'],
    ['信条', '信条'],
    ['c玄骸', '信条'],
    ['tenet', '信条'],
    ['lich-i', '终幕'],
    ['lichi', '终幕'],
    ['终幕数值', '终幕'],
    ['终幕', '终幕'],
    ['i玄骸', '终幕'],
    ['coda', '终幕'],
  ]) {
    it(`shows the countdown and ${family} weapons for ${alias}`, async () => {
      vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-01T12:00:00Z'))
      vi.spyOn(http, 'fetchAsyncData').mockResolvedValue(undefined)
      await client.shouldReply(alias, 'rendered')
      expect(card).to.match(/^距离轮换 /)
      expect(card).to.include(`${family}·`)
    })
  }

  it('renders the five Tenet offers and a live countdown', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-26T12:00:00Z'))
    vi.spyOn(http, 'fetchAsyncData').mockResolvedValue(tenet)
    await client.shouldReply('lichc', 'rendered')
    expect(card).to.include('信条·枢密').and.include('冲击').and.include('54.1%')
    expect(card.match(/\d+(?:\.\d+)?%/g)).to.have.length(5)
    expect(card).to.include('12小时')
    expect(card).not.to.match(/玩家上报|WarframeTR|WARFRAME Wiki/)
  })
})
