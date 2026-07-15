import { expect } from 'chai'
import { t } from '../../src/messages'
import { analyzeRivenStat } from '../../src/warframe/services'

describe('messages', () => {
  it('resolves a message key', () => {
    expect(t('miscs.inDevelopment')).to.equal('功能暂未开放')
  })

  it('substitutes repeated string and numeric parameters', () => {
    expect(
      t('voidTrader.arriving', { time: 60, unused: 'ignored' }),
    ).to.equal('距离虚空商人到达还有: 60')
  })

  it('resolves a failed service result', () => {
    expect(
      t({
        ok: false,
        error: {
          code: 'wfm.itemNotFound',
          retryable: false,
          params: { input: 'test-item' },
        },
      }),
    ).to.equal('未找到物品: test-item')
  })

  it('returns a failed service result for an unknown riven weapon', () => {
    const result = analyzeRivenStat({
      name: 'not-a-real-weapon',
      attributes: [],
    })

    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('riven.weaponNotFound')
      expect(result.error.params).to.deep.equal({
        weapon: 'not-a-real-weapon',
      })
    }
  })
})
