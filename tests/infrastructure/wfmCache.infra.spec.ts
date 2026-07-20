import { expect } from 'chai'
import { WfmMemoryCache } from '../../src/warframe/infrastructure/wfm-cache'

describe('WfmMemoryCache', () => {
  it('reuses in-flight / cached promises within ttl', async () => {
    const cache = new WfmMemoryCache(16)
    let calls = 0
    const factory = async () => {
      calls++
      return 'ok'
    }

    const [a, b] = await Promise.all([
      cache.get('k', 60, factory),
      cache.get('k', 60, factory),
    ])

    expect(a).to.equal('ok')
    expect(b).to.equal('ok')
    expect(calls).to.equal(1)
  })

  it('evicts failed promises so the next call retries', async () => {
    const cache = new WfmMemoryCache(16)
    let calls = 0
    const failing = async () => {
      calls++
      throw new Error('boom')
    }

    try {
      await cache.get('k', 60, failing)
      expect.fail('expected throw')
    }
    catch {
      // expected
    }

    try {
      await cache.get('k', 60, failing)
      expect.fail('expected throw')
    }
    catch {
      // expected
    }

    expect(calls).to.equal(2)
  })

  it('evicts entries including empty-string keys when over maxSize', async () => {
    const cache = new WfmMemoryCache(1)
    let callsA = 0
    let callsB = 0

    await cache.get('', 60, async () => {
      callsA++
      return 'empty'
    })
    await cache.get('second', 60, async () => {
      callsB++
      return 'second'
    })

    expect(callsA).to.equal(1)
    expect(callsB).to.equal(1)

    await cache.get('', 60, async () => {
      callsA++
      return 'empty-again'
    })

    expect(callsA).to.equal(2)
  })
})
