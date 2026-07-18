import { expect } from 'chai'
import { createAsyncCache } from '../../src/warframe/utils/cache'

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

  it('keeps the last successful value readable during an infinite-TTL update and after failure', async () => {
    let rejectUpdate!: (error: Error) => void
    let calls = 0
    const cache = createAsyncCache(async () => {
      calls++
      if (calls === 1) {
        return 'old'
      }
      return new Promise<string>((_resolve, reject) => {
        rejectUpdate = reject
      })
    }, -1)

    expect(await cache.get()).to.equal('old')
    const updating = cache.update()
    expect(await cache.get()).to.equal('old')
    rejectUpdate(new Error('refresh failed'))
    try {
      await updating
    }
    catch {
    }
    expect(await cache.get()).to.equal('old')
  })

  it('get() returns stale data when refresh fails after TTL expires', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        if (callCount === 1) {
          return 'stale'
        }
        throw new Error('refresh failed')
      },
      50,
    )

    expect(await cache.get()).to.equal('stale')
    await new Promise(r => setTimeout(r, 80))
    expect(await cache.get()).to.equal('stale')
    expect(callCount).to.equal(2)
  })

  it('get() still returns falsy cached values after a failed refresh', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        if (callCount === 1) {
          return 0
        }
        throw new Error('refresh failed')
      },
      50,
    )

    expect(await cache.get()).to.equal(0)
    await new Promise(r => setTimeout(r, 80))
    expect(await cache.get()).to.equal(0)
    expect(callCount).to.equal(2)
  })

  it('does not treat undefined soft failures as fresh cache hits', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        if (callCount === 1) {
          return undefined
        }
        return 'recovered'
      },
      60_000,
    )

    expect(await cache.get()).to.equal(undefined)
    expect(await cache.get()).to.equal('recovered')
    expect(callCount).to.equal(2)
  })

  it('keeps the last successful value when a refresh soft-fails with undefined', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        if (callCount === 1) {
          return 'platinum'
        }
        return undefined
      },
      60_000,
    )

    expect(await cache.get()).to.equal('platinum')
    expect(await cache.update()).to.equal(undefined)
    expect(await cache.get()).to.equal('platinum')
    expect(callCount).to.equal(2)
  })

  it('get() returns stale data when a soft-fail refresh returns undefined after TTL', async () => {
    let callCount = 0
    const cache = createAsyncCache(
      async () => {
        callCount++
        if (callCount === 1) {
          return 'platinum'
        }
        return undefined
      },
      50,
    )

    expect(await cache.get()).to.equal('platinum')
    await new Promise(r => setTimeout(r, 80))
    expect(await cache.get()).to.equal('platinum')
    expect(callCount).to.equal(2)
  })

  it('update() still rejects when refresh fails even if stale data exists', async () => {
    let callCount = 0
    const cache = createAsyncCache(async () => {
      callCount++
      if (callCount === 1) {
        return 'old'
      }
      throw new Error('refresh failed')
    }, -1)

    expect(await cache.get()).to.equal('old')

    let caught: Error | undefined
    try {
      await cache.update()
    }
    catch (e) {
      caught = e as Error
    }
    expect(caught?.message).to.equal('refresh failed')
    expect(await cache.get()).to.equal('old')
  })
})
