import type { RivenAttribute, RivenItem, RivenOrder } from '../../../src/warframe/types'
import { expect } from 'chai'
import { globalRivenAttribute, globalRivenAttributeFactory, overrideGlobalRivenAttribute } from '../../../src/warframe/data/wfm/globalRivenAttribute'
import { globalRivenItemData, globalRivenItemFactory, overrideGlobalRivenItemData } from '../../../src/warframe/data/wfm/globalRivenItem'
import { createPluginWfmClient, wfmClient } from '../../../src/warframe/infrastructure/wfm-client'
import { getRivenOrders } from '../../../src/warframe/services/wfm-service'
import { parseRivenOrderFilters } from '../../../src/warframe/services/wfm-service/wfm-service.riven-filters'
import { createAsyncCache } from '../../../src/warframe/utils'
import attributes from '../../assets/test-riven-attrs.json'
import extraAttributes from '../../assets/test-riven-extra-attrs.json'
import items from '../../assets/test-riven-items.json'

const fixtureAttributes = [...attributes.data, ...extraAttributes] as RivenAttribute[]

function order(id: string, price = 100): RivenOrder {
  return {
    id,
    starting_price: price,
    buyout_price: price,
    visible: true,
    minimal_reputation: 0,
    note: '',
    note_raw: '',
    platform: 'pc',
    crossplay: true,
    closed: false,
    private: false,
    top_bid: null,
    is_marked_for: null,
    marked_operation_at: null,
    created: '2026-01-01',
    updated: '2026-01-01',
    is_direct_sell: true,
    winner: null,
    owner: {
      id: 'seller',
      reputation: 0,
      platform: 'pc',
      locale: 'en',
      avatar: null,
      last_seen: '2026-01-01',
      crossplay: true,
      ingame_name: 'seller',
      slug: 'seller',
      status: 'ingame',
      region: 'en',
    },
    item: {
      polarity: 'madurai',
      mod_rank: 8,
      re_rolls: 0,
      type: 'riven',
      name: 'Critacan',
      weapon_url_name: 'torid',
      mastery_level: 8,
      attributes: [
        { url_name: 'critical_chance', positive: true, value: 100 },
        { url_name: 'critical_damage', positive: true, value: 100 },
        { url_name: 'zoom', positive: false, value: 50 },
      ],
    },
  }
}

describe('riven order attribute filters', () => {
  const originalItems = globalRivenItemData
  const originalAttributes = globalRivenAttribute
  const originalOrders = wfmClient.rivens.getOrders
  const requests: URL[] = []
  let orders: RivenOrder[]
  let failRequest: boolean

  beforeEach(() => {
    requests.length = 0
    orders = [order('match')]
    failRequest = false
    const weapons = [
      { ...items.data[0], slug: 'torid', i18n: { 'zh-hans': { name: '托里德' }, 'en': { name: 'Torid' } } },
      { ...items.data[0], slug: 'kuva_bramma', i18n: { 'zh-hans': { name: '赤毒 布拉玛' }, 'en': { name: 'Kuva Bramma' } } },
      { ...items.data[0], slug: 'skana', i18n: { 'zh-hans': { name: '空刃' }, 'en': { name: 'Skana' } } },
    ] as RivenItem[]
    overrideGlobalRivenItemData(createAsyncCache(() => globalRivenItemFactory(weapons), -1))
    overrideGlobalRivenAttribute(createAsyncCache(() => globalRivenAttributeFactory(fixtureAttributes), -1))
    const client = createPluginWfmClient(async (input) => {
      requests.push(new URL(input.url))
      if (failRequest) {
        throw new Error('offline')
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ payload: { auctions: structuredClone(orders) } }),
        text: async () => '',
      }
    })
    wfmClient.rivens.getOrders = client.rivens.getOrders
  })

  afterEach(() => {
    overrideGlobalRivenItemData(originalItems)
    overrideGlobalRivenAttribute(originalAttributes)
    wfmClient.rivens.getOrders = originalOrders
  })

  for (const input of [
    '托里德 负变焦 暴击几率 暴击伤害',
    '托里德 暴击几率 负变焦 暴击伤害',
    '托里德 暴击几率 暴击伤害 负变焦',
    '托里得 爆率 爆伤 负变焦',
    '托里德 负变 暴击 爆伤',
    '托里德 暴伤 负变 爆击',
    '  托里德\t暴击率\n负变焦  爆伤  ',
  ]) {
    it(`searches all positive stats and a negative stat in any position: ${input}`, async () => {
      const result = await getRivenOrders(input)
      expect(result.ok).to.equal(true)
      if (result.ok) {
        expect(result.data.orders.map(order => order.id)).to.deep.equal(['match'])
        expect(result.data.orders[0].item.attributes[0].attribute?.slug).to.equal('critical_chance')
      }
      expect(requests).to.have.length(1)
      expect(requests[0].searchParams.get('weapon_url_name')).to.equal('torid')
      expect(requests[0].searchParams.get('positive_stats')).to.equal('critical_chance,critical_damage')
      expect(requests[0].searchParams.get('negative_stats')).to.equal('zoom')
      expect(requests[0].searchParams.get('operation')).to.equal('allOf')
    })
  }

  it('preserves weapon names containing spaces with and without filters', async () => {
    for (const input of ['Kuva Bramma', 'Kuva Bramma 暴击率']) {
      expect((await getRivenOrders(input)).ok).to.equal(true)
    }
    expect(requests.map(url => url.searchParams.get('weapon_url_name'))).to.deep.equal(['kuva_bramma', 'kuva_bramma'])
    expect(requests[0].searchParams.has('positive_stats')).to.equal(false)
    expect(requests[1].searchParams.get('positive_stats')).to.equal('critical_chance')
  })

  it('grades each order using its own rank and detected weapon version', async () => {
    orders[0].item.attributes[0].value = 250
    orders[0].item.attributes[1].value = 200
    orders[0].item.attributes[2].value = 36
    const result = await getRivenOrders('托里德')
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    const resultOrder = result.data.orders[0]
    expect(resultOrder.analysis?.name).to.equal('托里德')
    expect(resultOrder.item.attributes[0].grade).to.be.closeTo(0.036, 0.001)
    expect(resultOrder.item.attributes[2].displayValue).to.equal(-36)
    expect(resultOrder.item.attributes[2].grade).to.be.closeTo(0.0675, 0.001)
  })

  it('keeps listings when grading is unavailable and does not invent a score', async () => {
    orders[0].item.attributes[0].value = 9999
    const result = await getRivenOrders('托里德')
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.orders[0].analysis).to.equal(undefined)
    expect(result.data.orders[0].analysisError).to.not.equal(undefined)
    expect(result.data.orders[0].item.attributes[0].grade).to.equal(undefined)
  })

  it('associates melee grades with their input attributes after canonical tag conversion', async () => {
    orders[0].item.attributes = [
      { url_name: 'base_damage_/_melee_damage', positive: true, value: 211.97 },
      { url_name: 'critical_chance', positive: true, value: 231.66 },
    ]
    const result = await getRivenOrders('空刃')
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.orders[0].analysis).to.not.equal(undefined)
    expect(result.data.orders[0].item.attributes[0].grade).to.be.closeTo(0, 0.001)
    expect(result.data.orders[0].item.attributes[1].grade).to.be.closeTo(0, 0.001)
  })

  it('converts beneficial negative recoil and detrimental positive recoil correctly', async () => {
    for (const positive of [true, false]) {
      orders = [order('recoil')]
      orders[0].item.attributes = [
        { url_name: 'critical_chance', positive: true, value: positive ? 146.2 : 241.3 },
        { url_name: 'critical_damage', positive: true, value: positive ? 117 : 193 },
        { url_name: 'recoil', positive, value: positive ? 87.8 : 57.9 },
      ]
      const result = await getRivenOrders(`托里德 ${positive ? '后坐力' : '负后坐力'}`)
      expect(result.ok).to.equal(true)
      if (!result.ok) {
        throw new Error(result.error.code)
      }
      expect(result.data.orders[0].analysis).to.not.equal(undefined)
      expect(result.data.orders[0].item.attributes[2].displayValue).to.equal(positive ? -87.8 : 57.9)
    }
  })

  it('preserves the grade of a melee faction multiplier resolved by its English name', async () => {
    orders[0].item.attributes = [
      { url_name: 'damage_vs_corpus', positive: true, value: 1.58 },
      { url_name: 'critical_chance', positive: true, value: 231.66 },
    ]
    const result = await getRivenOrders('空刃')
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.orders[0].analysis).to.not.equal(undefined)
    expect(result.data.orders[0].item.attributes[0].grade).to.be.closeTo(0.00147, 0.0001)
    expect(result.data.orders[0].item.attributes[0].displayValue).to.equal(1.58)
  })

  it('keeps faction multipliers around one and grades low-rank bonuses at their rank', async () => {
    orders[0].item.attributes = [
      { url_name: 'critical_chance', positive: true, value: 250 },
      { url_name: 'critical_damage', positive: true, value: 200 },
      { url_name: 'damage_vs_corpus', positive: false, value: 0.72 },
    ]
    const multiplier = await getRivenOrders('托里德 负C')
    expect(multiplier.ok).to.equal(true)
    if (!multiplier.ok) {
      throw new Error(multiplier.error.code)
    }
    expect(multiplier.data.orders[0].analysis).to.not.equal(undefined)
    expect(multiplier.data.orders[0].item.attributes[2].displayValue).to.equal(0.72)
    expect(multiplier.data.orders[0].item.attributes[2].grade).to.be.closeTo(0.033, 0.001)

    orders[0].item.mod_rank = 0
    orders[0].item.attributes = [
      { url_name: 'critical_chance', positive: true, value: 23.3 },
      { url_name: 'critical_damage', positive: true, value: 18.7 },
    ]
    const unranked = await getRivenOrders('托里德')
    expect(unranked.ok).to.equal(true)
    if (!unranked.ok) {
      throw new Error(unranked.error.code)
    }
    expect(unranked.data.orders[0].analysis).to.not.equal(undefined)
    expect(unranked.data.orders[0].item.attributes[0].grade).to.be.closeTo(0.086, 0.001)
  })

  it('allows positive-only and negative-only filters without inventing other constraints', async () => {
    await getRivenOrders('托里德 暴击率')
    await getRivenOrders('托里德 负变焦')
    expect(requests).to.have.length(2)
    expect(requests[0].searchParams.has('negative_stats')).to.equal(false)
    expect(requests[1].searchParams.has('positive_stats')).to.equal(false)
    expect(requests[1].searchParams.get('negative_stats')).to.equal('zoom')
  })

  it('separates cached filters and shares cache across equivalent permutations and aliases', async () => {
    await getRivenOrders('托里德')
    await getRivenOrders('托里德 暴击率 暴击伤害 负变焦')
    await getRivenOrders('托里德 爆伤 负变焦 爆率 暴击率')
    await getRivenOrders('托里德 多重')
    expect(requests).to.have.length(3)
    expect(requests[2].searchParams.get('positive_stats')).to.equal('multishot')
  })

  for (const [input, code] of [
    ['托里德 错词条', 'wfm.rivenAttributeNotFound'],
    ['托里德 负错词条', 'wfm.rivenAttributeNotFound'],
    ['托里德 穿深', 'wfm.rivenAttributeNotFound'],
    ['托里德 负穿深', 'wfm.rivenAttributeNotFound'],
    ['托里德 刺', 'wfm.rivenAttributeNotFound'],
    ['托里德 负刺', 'wfm.rivenAttributeNotFound'],
    ['托里德 负', 'wfm.rivenAttributeNotFound'],
    ['托里德 变焦 负变焦', 'wfm.rivenFilterConflict'],
    ['托里德 C 负c', 'wfm.rivenFilterConflict'],
    ['托里德 异常伤害 负异况伤害', 'wfm.rivenFilterConflict'],
    ['托里德 负变焦 负弹药上限', 'wfm.rivenFilterLimit'],
    ['托里德 暴击率 爆伤 多重 基伤', 'wfm.rivenFilterLimit'],
    ['不存在的武器 暴击率', 'wfm.rivenWeaponNotFound'],
    ['', 'wfm.inputItemName'],
  ]) {
    it(`rejects invalid input before requesting orders: ${input}`, async () => {
      const result = await getRivenOrders(input)
      expect(result.ok).to.equal(false)
      if (!result.ok) {
        expect(result.error.code).to.equal(code)
      }
      expect(requests).to.have.length(0)
    })
  }

  it('preserves seller eligibility, price ordering and the five-order limit', async () => {
    orders = Array.from({ length: 8 }, (_, i) => order(`match-${i}`, 80 - i * 10))
    const hidden = order('hidden', 1)
    hidden.visible = false
    const offline = order('offline', 1)
    offline.owner.status = 'offline'
    const privateOrder = order('private', 1)
    privateOrder.private = true
    const closed = order('closed', 1)
    closed.closed = true
    const auction = order('auction', 1)
    auction.is_direct_sell = false
    orders.push(hidden, offline, privateOrder, closed, auction)
    const result = await getRivenOrders('托里德 暴击率 负变焦')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.orders.map(order => order.id)).to.deep.equal(['match-7', 'match-6', 'match-5', 'match-4', 'match-3'])
    }
  })

  it('reports empty filtered results and operational failures', async () => {
    orders = []
    const empty = await getRivenOrders('托里德 暴击率')
    expect(empty.ok).to.equal(false)
    if (!empty.ok) {
      expect(empty.error.code).to.equal('wfm.noOnlineRivenSeller')
    }
    failRequest = true
    const failed = await getRivenOrders('托里德 负变焦')
    expect(failed.ok).to.equal(false)
    if (!failed.ok) {
      expect(failed.error.code).to.equal('wfm.rivenOrderFetchFailed')
    }
    failRequest = false
    orders = [order('recovered')]
    expect((await getRivenOrders('托里德 负变焦')).ok).to.equal(true)
    expect(requests).to.have.length(3)
  })

  it('accepts three positives, API slugs and repeated negative filters', () => {
    expect(parseRivenOrderFilters(['critical_chance', '爆伤', '多重', '负变焦', '负变焦'], attributes.data as RivenAttribute[])).to.deep.equal({
      ok: true,
      data: { positiveStats: ['critical_chance', 'critical_damage', 'multishot'], negativeStat: 'zoom' },
    })
  })

  for (const [alias, slug] of [
    ['爆伤', 'critical_damage'],
    ['暴伤', 'critical_damage'],
    ['爆击伤害', 'critical_damage'],
    ['暴击', 'critical_chance'],
    ['爆击', 'critical_chance'],
    ['爆击率', 'critical_chance'],
    ['爆击几率', 'critical_chance'],
    ['变', 'zoom'],
    ['弹匣', 'magazine_capacity'],
    ['射速', 'fire_rate_/_attack_speed'],
    ['多', 'multishot'],
    ['射', 'fire_rate_/_attack_speed'],
    ['范', 'range'],
    ['触', 'status_chance'],
    ['装', 'reload_speed'],
    ['装填', 'reload_speed'],
    ['攻速', 'fire_rate_/_attack_speed'],
    ['C', 'damage_vs_corpus'],
    ['c', 'damage_vs_corpus'],
    ['G', 'damage_vs_grineer'],
    ['g', 'damage_vs_grineer'],
    ['I', 'damage_vs_infested'],
    ['i', 'damage_vs_infested'],
    ['O', 'damage_to_orokin'],
    ['o', 'damage_to_orokin'],
    ['异常伤害', 'status_damage'],
    ['异况伤害', 'status_damage'],
    ['触发伤害', 'status_damage'],
    ['异常状态伤害', 'status_damage'],
    ['触发', 'status_chance'],
    ['触发几率', 'status_chance'],
    ['触时', 'status_duration'],
    ['范围', 'range'],
    ['投射', 'projectile_speed'],
    ['投射物', 'projectile_speed'],
    ['后座', 'recoil'],
    ['后坐', 'recoil'],
    ['后坐力', 'recoil'],
    ['后座力', 'recoil'],
    ['备弹', 'ammo_maximum'],
    ['最大弹药', 'ammo_maximum'],
    ['最大弹药值', 'ammo_maximum'],
    ['弹容', 'magazine_capacity'],
    ['弹夹', 'magazine_capacity'],
    ['弹夹容量', 'magazine_capacity'],
    ['弹效', 'ammo_efficiency'],
    ['滑暴', 'critical_chance_on_slide_attack'],
    ['滑爆', 'critical_chance_on_slide_attack'],
    ['滑行暴击', 'critical_chance_on_slide_attack'],
    ['滑行爆击', 'critical_chance_on_slide_attack'],
    ['连击时间', 'combo_duration'],
    ['连击时长', 'combo_duration'],
    ['连击持续', 'combo_duration'],
    ['处决', 'finisher_damage'],
    ['重击效能', 'channeling_efficiency'],
    ['收起装填', 'magazine_reloaded_s_when_holstered'],
    ['收纳装填', 'magazine_reloaded_s_when_holstered'],
    ['自动装填', 'magazine_reloaded_s_when_holstered'],
    ['弱点暴击', 'weak_point_critical_chance'],
    ['弱点爆击', 'weak_point_critical_chance'],
    ['弱点暴率', 'weak_point_critical_chance'],
    ['弱点爆率', 'weak_point_critical_chance'],
    ['弱点', 'weak_point_damage'],
    ['炽蛇', 'damage_to_scaldra'],
    ['炽蛇军', 'damage_to_scaldra'],
    ['科腐', 'damage_to_techrot'],
    ['科腐者', 'damage_to_techrot'],
    ['C族', 'damage_vs_corpus'],
    ['G族', 'damage_vs_grineer'],
    ['I族', 'damage_vs_infested'],
    ['O族', 'damage_to_orokin'],
    ['冲', 'impact_damage'],
    ['穿', 'puncture_damage'],
    ['切', 'slash_damage'],
  ]) {
    it(`resolves ${alias} in both positive and negative query parameters`, async () => {
      expect((await getRivenOrders(`托里德 ${alias}`)).ok).to.equal(true)
      expect((await getRivenOrders(`托里德 负${alias}`)).ok).to.equal(true)
      expect(requests).to.have.length(2)
      expect(requests[0].searchParams.get('positive_stats')).to.equal(slug)
      expect(requests[0].searchParams.has('negative_stats')).to.equal(false)
      expect(requests[1].searchParams.get('negative_stats')).to.equal(slug)
      expect(requests[1].searchParams.has('positive_stats')).to.equal(false)
    })
  }

  for (const [alias, slug] of [
    ['冰', 'cold_damage'],
    ['火', 'heat_damage'],
    ['毒', 'toxin_damage'],
    ['电', 'electric_damage'],
    ['病毒', 'viral'],
    ['腐蚀', 'corrosive'],
    ['磁力', 'magnetic'],
    ['辐射', 'radiation'],
    ['爆炸', 'blast'],
    ['毒气', 'gas'],
    ['穿透深度', 'punch_through'],
    ['初连', 'channeling_damage'],
    ['初始连击', 'channeling_damage'],
    ['额外连击', 'chance_to_gain_extra_combo_count'],
    ['额外连击几率', 'chance_to_gain_extra_combo_count'],
    ['重击蓄力速度', 'heavy_attack_wind_up_speed'],
    ['重击前摇速度', 'heavy_attack_wind_up_speed'],
    ['重击伤害', 'melee_damage_on_heavy_attack'],
    ['震地', 'slam_attack_damage'],
    ['震地伤害', 'slam_attack_damage'],
    ['格挡', 'parry_angle'],
    ['格挡角度', 'parry_angle'],
  ]) {
    it(`searches the positive-only stat ${alias} and rejects its negative form`, async () => {
      expect((await getRivenOrders(`托里德 ${alias}`)).ok).to.equal(true)
      expect(requests).to.have.length(1)
      expect(requests[0].searchParams.get('positive_stats')).to.equal(slug)
      const negative = await getRivenOrders(`托里德 负${alias}`)
      expect(negative.ok).to.equal(false)
      if (!negative.ok) {
        expect(negative.error.code).to.equal('wfm.rivenAttributePolarity')
      }
      expect(requests).to.have.length(1)
    })
  }

  for (const alias of ['连击获取', '连击获取几率']) {
    it(`keeps negative-only ${alias} distinct from initial and extra combo`, async () => {
      expect((await getRivenOrders(`托里德 负${alias}`)).ok).to.equal(true)
      expect(requests).to.have.length(1)
      expect(requests[0].searchParams.get('negative_stats')).to.equal('chance_to_gain_combo_count')
      const positive = await getRivenOrders(`托里德 ${alias}`)
      expect(positive.ok).to.equal(false)
      if (!positive.ok) {
        expect(positive.error.code).to.equal('wfm.rivenAttributePolarity')
      }
      expect(requests).to.have.length(1)
    })
  }

  it('preserves established Chinese names when market translations change', () => {
    const renamed: Record<string, string> = {
      'recoil': '武器后坐力',
      'base_damage_/_melee_damage': '伤害',
      'ammo_maximum': '弹药最大值',
      'projectile_speed': '投射物速度',
      'channeling_damage': '初始连击',
      'critical_chance_on_slide_attack': '滑行攻击暴击几率',
    }
    const catalog = fixtureAttributes.map(attribute => renamed[attribute.slug]
      ? { ...attribute, i18n: { ...attribute.i18n, 'zh-hans': { name: renamed[attribute.slug] } } }
      : attribute)
    for (const [name, slug] of [
      ['后坐力', 'recoil'],
      ['基础伤害', 'base_damage_/_melee_damage'],
      ['近战伤害', 'base_damage_/_melee_damage'],
      ['弹药上限', 'ammo_maximum'],
      ['投射物飞行速度', 'projectile_speed'],
      ['初始连击数', 'channeling_damage'],
      ['滑行攻击暴击率', 'critical_chance_on_slide_attack'],
    ]) {
      expect(parseRivenOrderFilters([name], catalog)).to.deep.equal({ ok: true, data: { positiveStats: [slug] } })
    }
  })

  it('rejects polarities disallowed by the attribute catalog', () => {
    const catalog = [
      { ...attributes.data[0], slug: 'positive_only', positiveOnly: true },
      { ...attributes.data[1], slug: 'negative_only', negativeOnly: true },
    ] as RivenAttribute[]
    for (const token of ['负positive_only', 'negative_only']) {
      const result = parseRivenOrderFilters([token], catalog)
      expect(result.ok).to.equal(false)
      if (!result.ok) {
        expect(result.error.code).to.equal('wfm.rivenAttributePolarity')
      }
    }
  })

  it('reports an ambiguous weapon prefix before querying orders', async () => {
    const weapons = ['托里甲', '托里乙'].map((name, i) => ({
      ...items.data[0],
      slug: `weapon_${i}`,
      i18n: { 'zh-hans': { name } },
    })) as RivenItem[]
    overrideGlobalRivenItemData(createAsyncCache(() => globalRivenItemFactory(weapons), -1))
    const result = await getRivenOrders('托里 暴击率 负变焦')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('wfm.itemAmbiguous')
      expect(result.error.params?.input).to.equal('托里')
    }
    expect(requests).to.have.length(0)
  })

  it('encodes slugs containing slashes as query values', async () => {
    expect((await getRivenOrders('托里德 base_damage_/_melee_damage 负变焦')).ok).to.equal(true)
    expect(requests).to.have.length(1)
    expect(requests[0].searchParams.get('positive_stats')).to.equal('base_damage_/_melee_damage')
    expect(requests[0].pathname).to.equal('/v1/auctions/search')
  })
})
