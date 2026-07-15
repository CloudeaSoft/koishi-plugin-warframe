import { expect } from 'chai'
import {
  fullWidthToHalfWidth,
  normalizeName,
  pascalToSpaced,
} from '../../src/warframe/utils/text'

describe('normalizeName Tests', () => {
  it('should convert to lowercase', () => {
    expect(normalizeName('HELLO')).to.equal('hello')
    expect(normalizeName('MixedCase')).to.equal('mixedcase')
  })

  it('should remove all whitespace', () => {
    expect(normalizeName('hello world')).to.equal('helloworld')
    expect(normalizeName('  a b c  ')).to.equal('abc')
    expect(normalizeName('a\tb\n c')).to.equal('abc')
  })

  it('should strip redundant symbols', () => {
    expect(normalizeName('test\'s')).to.equal('tests')
    expect(normalizeName('a-b+c')).to.equal('abc')
    expect(normalizeName('(test)')).to.equal('test')
    expect(normalizeName('[test]')).to.equal('test')
    expect(normalizeName('{test}')).to.equal('test')
    expect(normalizeName('【test】')).to.equal('test')
    // full-width 。 is NOT in the full-width-to-halfwidth range, so regex strips it
    expect(normalizeName('test。test')).to.equal('testtest')
    // full-width ！？；： ARE in the full-width range, get converted to half-width !?;: before regex runs
    expect(normalizeName('test！？；：')).to.equal('test!?;:')
  })

  it('should convert full-width characters to half-width', () => {
    expect(normalizeName('ＡＢＣ')).to.equal('abc')
    expect(normalizeName('１２３')).to.equal('123')
  })

  it('should handle mixed full-width, symbols, and spaces', () => {
    expect(normalizeName(' Ａ-Ｂ ')).to.equal('ab')
  })

  it('should handle empty string', () => {
    expect(normalizeName('')).to.equal('')
  })

  it('should preserve CJK characters', () => {
    expect(normalizeName('古纪A1')).to.equal('古纪a1')
  })

  it('should remove middle dot (·)', () => {
    expect(normalizeName('a·b')).to.equal('ab')
  })
})

describe('fullWidthToHalfWidth Tests', () => {
  it('should convert full-width uppercase letters', () => {
    expect(fullWidthToHalfWidth('ＡＢＣＤＥ')).to.equal('ABCDE')
  })

  it('should convert full-width lowercase letters', () => {
    expect(fullWidthToHalfWidth('ａｂｃｄｅ')).to.equal('abcde')
  })

  it('should convert full-width digits', () => {
    expect(fullWidthToHalfWidth('０１２３４５６７８９')).to.equal(
      '0123456789',
    )
  })

  it('should convert full-width space to half-width space', () => {
    expect(fullWidthToHalfWidth('a\u3000b')).to.equal('a b')
  })

  it('should leave ASCII characters unchanged', () => {
    expect(fullWidthToHalfWidth('hello123')).to.equal('hello123')
  })

  it('should leave CJK characters unchanged', () => {
    expect(fullWidthToHalfWidth('中文测试')).to.equal('中文测试')
  })

  it('should handle mixed content', () => {
    expect(fullWidthToHalfWidth('Ａ中ｂ文１２３')).to.equal('A中b文123')
  })
})

describe('pascalToSpaced Tests', () => {
  it('should insert space before each uppercase letter', () => {
    expect(pascalToSpaced('HelloWorld')).to.equal('Hello World')
  })

  it('should trim leading space', () => {
    expect(pascalToSpaced('Hello')).to.equal('Hello')
  })

  it('should handle consecutive capitals', () => {
    expect(pascalToSpaced('XMLParser')).to.equal('X M L Parser')
  })

  it('should leave lowercase-only strings unchanged', () => {
    expect(pascalToSpaced('hello')).to.equal('hello')
  })

  it('should handle empty string', () => {
    expect(pascalToSpaced('')).to.equal('')
  })

  it('should handle single character', () => {
    expect(pascalToSpaced('A')).to.equal('A')
  })
})
