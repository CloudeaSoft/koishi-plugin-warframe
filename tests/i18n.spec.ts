import { expect } from 'chai'
import { t } from '../src/i18n'
import { analyzeRivenStat } from '../src/warframe/services'

describe('i18n', () => {
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

  it('renders ambiguous wm candidates', () => {
    expect(
      t({
        ok: false,
        error: {
          code: 'wfm.itemAmbiguous',
          retryable: false,
          params: {
            input: '无情',
            candidates: '次要·无情、主要·无情',
          },
        },
      }),
    ).to.equal('物品名称“无情”存在歧义，请补充类别：次要·无情、主要·无情')
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
