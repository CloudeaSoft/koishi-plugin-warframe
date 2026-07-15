import type { WarframeResult } from '../../src/types/warframe-result'
import { expect } from 'chai'
import { failure } from '../../src/types/warframe-result'

describe('WarframeResult', () => {
  it('creates a non-retryable failure by default', () => {
    expect(failure('relic.notFound')).to.deep.equal({
      ok: false,
      error: {
        code: 'relic.notFound',
        retryable: false,
      },
    })
  })

  it('preserves retryability and interpolation parameters', () => {
    expect(
      failure('wfm.orderFetchFailed', true, { input: 'forma' }),
    ).to.deep.equal({
      ok: false,
      error: {
        code: 'wfm.orderFetchFailed',
        retryable: true,
        params: { input: 'forma' },
      },
    })
  })

  it('narrows successful data', () => {
    const result: WarframeResult<number> = { ok: true, data: 42 }
    expect(result.data).to.equal(42)
  })
})
