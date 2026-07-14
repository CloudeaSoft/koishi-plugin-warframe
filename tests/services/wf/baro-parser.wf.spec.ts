import { expect } from 'chai'
import { getVoidTraderHistory } from '../../../src/infrastructure/wf/wf-api'

describe('baro Lua Table Parser Tests', () => {

  it('should parse a minimal valid entry', async () => {
    const lua = `[""TestItem""] = {
  Name = ""TestItem"",
  Type = ""Mod"",
  DucatCost = 100,
  CreditCost = 5000,
  Image = ""img.png"",
  Link = ""link"",
}`

    const result = await getVoidTraderHistory(lua)
    expect(result).to.not.equal(undefined)
    expect(result!.TestItem).to.not.equal(undefined)
    expect(result!.TestItem.Name).to.equal('TestItem')
    expect(result!.TestItem.Type).to.equal('Mod')
    expect(result!.TestItem.DucatCost).to.equal(100)
    expect(result!.TestItem.CreditCost).to.equal(5000)
  })

  it('should parse multiple entries', async () => {
    const lua = `[""ItemA""] = {
  Name = ""ItemA"",
  Type = ""Mod"",
  DucatCost = 100,
  CreditCost = 5000,
  Image = ""a.png"",
  Link = ""a"",
},
[""ItemB""] = {
  Name = ""ItemB"",
  Type = ""Weapon"",
  DucatCost = 200,
  CreditCost = 10000,
  Image = ""b.png"",
  Link = ""b"",
}`

    const result = await getVoidTraderHistory(lua)
    expect(Object.keys(result!)).to.have.length(2)
    expect(result!.ItemA.DucatCost).to.equal(100)
    expect(result!.ItemB.DucatCost).to.equal(200)
  })

  it('should parse array fields (OfferingDates)', async () => {
    const lua = `[""Item""] = {
  Name = ""Item"",
  Type = ""Mod"",
  DucatCost = 50,
  CreditCost = 2500,
  Image = ""x.png"",
  Link = ""x"",
  OfferingDates = { ""2024-01-01"", ""2024-02-01"", ""2024-03-01"" },
}`

    const result = await getVoidTraderHistory(lua)
    expect(result!.Item.OfferingDates).to.deep.equal([
      '2024-01-01',
      '2024-02-01',
      '2024-03-01',
    ])
  })

  it('should apply default values for missing fields', async () => {
    const lua = `[""Minimal""] = {
  Name = ""Minimal"",
}`

    const result = await getVoidTraderHistory(lua)
    expect(result!.Minimal.Name).to.equal('Minimal')
    expect(result!.Minimal.Type).to.equal('')
    expect(result!.Minimal.DucatCost).to.equal(0)
    expect(result!.Minimal.CreditCost).to.equal(0)
    expect(result!.Minimal.Image).to.equal('')
    expect(result!.Minimal.Link).to.equal('')
  })

  it('should handle empty-ish input that produces no entries', async () => {
    const result = await getVoidTraderHistory('nothing useful here at all')
    expect(result).to.deep.equal({})
  })

  it('should handle whitespace-only input gracefully', async () => {
    const result = await getVoidTraderHistory('   \n\n  \t  ')
    expect(result).to.deep.equal({})
  })

  it('should skip malformed entries and continue parsing', async () => {
    const lua = `[""Good""] = {
  Name = ""Good"",
  DucatCost = 100,
},
garbage line here
[""AlsoGood""] = {
  Name = ""AlsoGood"",
  DucatCost = 200,
}`

    const result = await getVoidTraderHistory(lua)
    expect(result!.Good).to.not.equal(undefined)
    expect(result!.Good.DucatCost).to.equal(100)
    expect(result!.AlsoGood).to.not.equal(undefined)
  })
})
