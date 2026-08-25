import type { Invasion, InvasionBoard, InvasionPlanetGroup } from '../../src/warframe'
import { expect } from 'chai'
import { InvasionComponent } from '../../src/components/wf'

function corpusInvasion(): Invasion {
  return {
    id: 'corpus',
    planet: '谷神星',
    node: 'Kiste',
    attacker: {
      faction: 'Corpus',
      tone: 'corpus',
      rewards: [
        { name: '电磁力场装置', count: 3 },
        { name: '25000 现金', count: 1 },
      ],
    },
    defender: {
      faction: 'Grineer',
      tone: 'grineer',
      rewards: [{ name: '爆燃喷射器', count: 3 }],
    },
    vsInfestation: false,
    completion: 0.506,
  }
}

function infestedInvasion(): Invasion {
  return {
    id: 'infested',
    planet: '火星',
    node: 'War',
    attacker: { faction: 'Infestation', tone: 'infested', rewards: [] },
    defender: {
      faction: 'Grineer',
      tone: 'grineer',
      rewards: [{ name: '突变原聚合物', count: 1 }],
    },
    vsInfestation: true,
    completion: 0.74,
  }
}

function planetGroup(
  planet: string,
  title: string,
  invasions: Invasion[],
  completion = invasions[0]?.completion ?? 0,
): InvasionPlanetGroup {
  return { planet, title, completion, invasions }
}

function board(overrides: Partial<InvasionBoard> = {}): InvasionBoard {
  return {
    title: '入侵',
    planets: [
      planetGroup('火星', 'PHORID 现形', [infestedInvasion()]),
      planetGroup('谷神星', 'Corpus 围攻', [corpusInvasion()]),
    ],
    ...overrides,
  }
}

describe('invasionComponent tests', () => {
  it('renders title, two-column sides, and a tug-of-war progress bar', () => {
    const html = String(InvasionComponent(board({
      planets: [planetGroup('谷神星', 'Corpus 围攻', [corpusInvasion()])],
    })))

    expect(html).to.include('入侵')
    expect(html).to.include('谷神星')
    expect(html).to.include('Corpus 围攻')
    expect(html).to.include('Kiste')
    expect(html).to.not.include('谷神星 · Kiste')
    expect(html).to.include('进攻')
    expect(html).to.include('防守')
    expect(html).to.include('Corpus')
    expect(html).to.include('Grineer')
    expect(html).to.include('电磁力场装置')
    expect(html).to.include('爆燃喷射器')
    expect(html).to.include('display:flex')
    expect(html).to.match(/进攻[\s\S]*防守/)
    expect(html).to.include('50.6%')
    expect(html).to.include('49.4%')
    expect(html).to.include('#c14444')
    expect(html).to.include('#3b7dc4')
    expect(html).to.match(/text-align:right[\s\S]*防守[\s\S]*爆燃喷射器/)
  })

  it('places attacker fill on the left and defender fill on the right', () => {
    const html = String(InvasionComponent(board({
      planets: [planetGroup('火星', 'PHORID 现形', [infestedInvasion()])],
    })))

    const attackerFill = html.indexOf('width:74%')
    const defenderFill = html.indexOf('width:26%')
    expect(attackerFill).to.be.greaterThan(-1)
    expect(defenderFill).to.be.greaterThan(attackerFill)
    expect(html).to.include('#3d9a4a')
    expect(html).to.match(/进攻[\s\S]*74%[\s\S]*26%[\s\S]*防守/)
  })

  it('does not emit empty reward divs for Infested attackers', () => {
    const html = String(InvasionComponent(board({
      planets: [planetGroup('火星', 'PHORID 现形', [infestedInvasion()])],
    })))

    expect(html).to.include('Infestation')
    expect(html).to.include('突变原聚合物')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('groups cards under the planet name and a shared campaign title', () => {
    const html = String(InvasionComponent(board()))

    expect(html).to.match(
      /火星[\s\S]*PHORID 现形[\s\S]*War[\s\S]*谷神星[\s\S]*Corpus 围攻[\s\S]*Kiste/,
    )
    expect(html).to.not.include('火星 · War')
  })

  it('emphasizes planet headings and uses a narrower board', () => {
    const html = String(InvasionComponent(board()))

    expect(html).to.include('max-width: 480px')
    expect(html).to.not.include('max-width: 640px')
    expect(html).to.match(
      /font-size:18px;font-weight:700;color:var\(--wf-text-primary\)[\s\S]*火星/,
    )
    expect(html).to.match(
      /font-size:12px;color:var\(--wf-text-muted\)[\s\S]*PHORID 现形/,
    )
  })

  it('puts planet and campaign title on the same row as separate elements', () => {
    const html = String(InvasionComponent(board()))

    expect(html).to.match(
      /display:flex;align-items:baseline[\s\S]*火星<\/div>[\s\S]*PHORID 现形/,
    )
    expect(html).to.not.include('火星 · PHORID')
    expect(html).to.not.include('火星PHORID')
  })

  it('stacks node cards in a rounded collection split only by a line', () => {
    const html = String(InvasionComponent(board({
      planets: [planetGroup('火星', 'PHORID 现形', [
        infestedInvasion(),
        { ...infestedInvasion(), id: 'infested-2', node: 'Ara' },
      ])],
    })))

    expect(html).to.match(/border-radius:var\(--wf-radius-md\);overflow:hidden/)
    expect(html).to.include('border-bottom:1px solid var(--wf-border)')
    expect(html).to.include('War')
    expect(html).to.include('Ara')
    expect(html).to.not.match(/margin-bottom:\s*8px/)
  })

  it('renders defender meta as percent, faction, then role', () => {
    const html = String(InvasionComponent(board({
      planets: [planetGroup('谷神星', 'Corpus 围攻', [corpusInvasion()])],
    })))

    expect(html).to.include('进攻 · Corpus 50.6%')
    expect(html).to.include('49.4% · Grineer · 防守')
    expect(html).to.not.include('防守 · Grineer 49.4%')
  })
})
