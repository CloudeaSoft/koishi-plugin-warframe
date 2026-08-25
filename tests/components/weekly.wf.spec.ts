import type { ArchiMedea, ArchonHunt } from '../../src/warframe'
import { expect } from 'chai'
import { WeeklyComponent } from '../../src/components/wf'

const emptyArchimedea: ArchiMedea = {
  name: '深层科研',
  missions: [],
  peronal: [],
}

function mission(type: string): ArchonHunt['missions'][number] {
  return {
    type,
    node: {
      name: 'Galatea',
      system: '海王星',
      type: '捕获',
      faction: 'Corpus',
      minLevel: 130,
      maxLevel: 135,
    },
  }
}

describe('weeklyComponent tests', () => {
  it('lays out archon hunt missions as sibling cards', () => {
    const archon: ArchonHunt = {
      modeName: '执刑官猎杀',
      name: '执刑官诡文枭主',
      missions: [
        mission('歼灭'),
        mission('防御'),
        mission('刺杀'),
      ],
    }

    const html = String(WeeklyComponent(
      archon,
      emptyArchimedea,
      { ...emptyArchimedea, name: '时光科研' },
    ))

    expect(html).to.include('歼灭')
    expect(html).to.include('防御')
    expect(html).to.include('刺杀')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('renders archon hunt missions with type and location', () => {
    const archon: ArchonHunt = {
      modeName: '执刑官猎杀',
      name: '执刑官诡文枭主',
      missions: [mission('歼灭')],
    }

    const html = String(WeeklyComponent(
      archon,
      emptyArchimedea,
      { ...emptyArchimedea, name: '时光科研' },
    ))

    expect(html).to.include('执刑官猎杀')
    expect(html).to.include('执刑官诡文枭主')
    expect(html).to.include('歼灭')
    expect(html).to.include('海王星')
    expect(html).to.include('Galatea')
    expect(html).to.include('Corpus')
    expect(html).to.include('Lv.130-135')
    expect(html).to.not.include('关卡:')
    expect(html).to.not.include('特殊:')
  })
})
