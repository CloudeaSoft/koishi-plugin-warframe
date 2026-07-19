import type { WorldStateNotification } from '../../src/warframe'

import { expect } from 'chai'

import { createWorldStateMessages } from '../../src/messages/world-state'

describe('world-state messages', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates one text message per populated notification category', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-07-15T22:58:58Z').getTime(),
    )
    const expiry = new Date('2026-07-16T00:00:00Z').getTime()
    const items: WorldStateNotification[] = [
      {
        type: 'fissure',
        id: 'f1',
        tier: '后纪',
        tierNum: 4,
        node: {
          name: 'Hydron',
          system: '赛德娜',
          type: '防御',
          faction: 'Grineer',
          minLevel: 30,
          maxLevel: 40,
        },
        hard: false,
        category: 'railjack',
        expiry,
      },
      {
        type: 'void-trader',
        id: 'v1',
        character: 'Baro Ki\'Teer',
        location: 'Mercury Relay',
        expiry,
        items: [
          { name: 'Prisma Grakata', ducats: 150, credits: 100000 },
          { name: 'Primed Continuity', ducats: 350, credits: 200000 },
        ],
      },
      {
        type: 'daily-deal',
        id: 'd1',
        item: 'Braton',
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
        expiry,
      },
      {
        type: 'alert',
        id: 'a1',
        description: 'Lotus Gift',
        node: 'Earth',
        missionType: 'Defense',
        reward: 'Forma',
        expiry,
      },
    ]
    const render = vi.fn(async () => 'data:image/png;base64,baro')
    const messages = await createWorldStateMessages(items, render)

    expect(render.mock.calls).to.have.length(1)
    expect(messages.map(message => message.toString())).to.deep.equal([
      '<message><div>新的虚空裂隙已出现:\n</div><div>[九重天]后纪 - 赛德娜 (防御) Grineer Hydron | 剩余1小时1分钟2秒</div></message>',
      '<message><div>虚空商人到达\nBaro Ki\'Teer 已到达 Mercury Relay，截止 2026/7/16 08:00:00</div><img src="data:image/png;base64,baro"/></message>',
      '<message><div>新每日特惠\n</div><div>Braton：157 白金（-30%，原价 225），截止 2026/7/16 08:00:00</div></message>',
      '<message><div>新警报\n</div><div>Lotus Gift | Earth Defense | 奖励：Forma，截止 2026/7/16 08:00:00</div></message>',
    ])
  })

  it('does not create a message for empty notifications', async () => {
    const render = vi.fn(async () => 'data:image/png;base64,baro')
    expect(await createWorldStateMessages([], render)).to.deep.equal([])
    expect(render.mock.calls).to.have.length(0)
  })

  it('keeps text categories when void-trader image rendering fails', async () => {
    const expiry = new Date('2026-07-16T00:00:00Z').getTime()
    const items: WorldStateNotification[] = [
      {
        type: 'void-trader',
        id: 'v1',
        character: 'Baro Ki\'Teer',
        location: 'Mercury Relay',
        expiry,
        items: [{ name: 'Prisma Grakata', ducats: 150, credits: 100000 }],
      },
      {
        type: 'daily-deal',
        id: 'd1',
        item: 'Braton',
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
        expiry,
      },
    ]
    const render = vi.fn(async () => {
      throw new Error('puppeteer unavailable')
    })

    const messages = await createWorldStateMessages(items, render)

    expect(messages.map(message => message.toString())).to.deep.equal([
      '<message><div>虚空商人到达\nBaro Ki\'Teer 已到达 Mercury Relay，截止 2026/7/16 08:00:00</div></message>',
      '<message><div>新每日特惠\n</div><div>Braton：157 白金（-30%，原价 225），截止 2026/7/16 08:00:00</div></message>',
    ])
  })
})
