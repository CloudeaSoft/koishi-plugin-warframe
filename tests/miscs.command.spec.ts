import { expect } from 'chai'
import { describe, it } from 'mocha'
import { inDevelopment } from '../src/commands/miscs'

describe('miscs commands', () => {
  it('returns the in-development message', () => {
    expect(inDevelopment()).to.equal('功能暂未开放')
  })
})
