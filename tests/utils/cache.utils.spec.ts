import { expect } from 'chai'
import { createAsyncCache } from '../../src/utils/cache'

describe('createAsyncCache Tests', () => {

  it('should call factory on first get', async () => {
    let callCount = 0
    const cache = createAsyncCache(async () => {
      callCount++
      return 'value'
    }, -1)

    const result = await cache.get()
    expect(result).to.equal('value')
    expect(callCount).to.equal(1)
  })

  it('should return cached value without calling factory again (infinite TTL)', async () => {
    let callCount = 0
    const cache = createAsyncCache(async () => {
      callCount++
      return { data: 42 }
    }, -1)

    await cache.get()
    await cache.get()
    await cache.get()
    expect(callCount).to.equal(1)
  })

  it('should return cached value within TTL window', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        return callCount
      },
      60_000,
    )

    const first = await cache.get()
    const second = await cache.get()
    expect(first).to.equal(1)
    expect(second).to.equal(1)
    expect(callCount).to.equal(1)
  })

  it('should refetch after TTL expires', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        return callCount
      },
      50,
    )

    const first = await cache.get()
    expect(first).to.equal(1)

    await new Promise(r => setTimeout(r, 80))

    const second = await cache.get()
    expect(second).to.equal(2)
    expect(callCount).to.equal(2)
  })

  it('should deduplicate concurrent in-flight requests', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        await new Promise(r => setTimeout(r, 50))
        return 'shared'
      },
      60_000,
    )

    const [a, b, c] = await Promise.all([
      cache.get(),
      cache.get(),
      cache.get(),
    ])

    expect(a).to.equal('shared')
    expect(b).to.equal('shared')
    expect(c).to.equal('shared')
    expect(callCount).to.equal(1)
  })

  it('should propagate factory error and clear in-flight lock', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        throw new Error('fetch failed')
      },
      60_000,
    )

    let caught: Error | undefined
    try {
      await cache.get()
    }
    catch (e) {
      caught = e as Error
    }
    expect(caught?.message).to.equal('fetch failed')

    try {
      await cache.get()
    }
    catch (e) {
      caught = e as Error
    }
    expect(caught?.message).to.equal('fetch failed')
    expect(callCount).to.equal(2)
  })

  it('update() should force a refresh regardless of TTL', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        return callCount
      },
      -1,
    )

    const first = await cache.get()
    expect(first).to.equal(1)

    const updated = await cache.update()
    expect(updated).to.equal(2)
    expect(callCount).to.equal(2)

    const cached = await cache.get()
    expect(cached).to.equal(2)
    expect(callCount).to.equal(2)
  })
})
