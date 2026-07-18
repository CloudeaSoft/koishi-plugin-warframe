import type { Element } from 'koishi'
import type { WeeklyRiven } from 'warframe-weekly-rivens'
import type {
  Arbitration,
  ArchiMedea,
  ArchonHunt,
  Fissure,
  OutputRelic,
  OutputRelicReward,
  RelicRewardRarity,
  RivenAttributeUnit,
  RivenStatAnalyzeResult,
  RivenStatResult,
  VoidTrader,
} from '../warframe'
import { hexToRgb, lerp, rgbToHex } from '../utils'
import { msToHumanReadable } from '../warframe'

export function ArbitrationComponent(arbi: Arbitration[]): Element {
  const rewardTier = (rewards: number): { color: string, bg: string } => {
    if (rewards >= 400)
      return { color: 'var(--wf-rarity-rare)', bg: 'rgba(255, 215, 0, 0.12)' }
    if (rewards >= 380)
      return { color: 'var(--wf-warning)', bg: 'rgba(255, 140, 66, 0.12)' }
    if (rewards >= 350)
      return { color: 'var(--wf-success)', bg: 'rgba(46, 125, 50, 0.12)' }
    return { color: 'var(--wf-rarity-common)', bg: 'rgba(205, 127, 50, 0.12)' }
  }

  const formatDayLabel = (dateStr: string): string => {
    const parts = dateStr.split('/')
    if (parts.length >= 3) {
      return `${Number(parts[1])}月${Number(parts[2])}日`
    }
    return dateStr
  }

  const groups = new Map<string, Arbitration[]>()
  for (const a of arbi) {
    const spaceIdx = a.time.indexOf(' ')
    const dateKey = spaceIdx > 0 ? a.time.slice(0, spaceIdx) : a.time
    if (!groups.has(dateKey))
      groups.set(dateKey, [])
    groups.get(dateKey)!.push(a)
  }

  return (
    <div
      style="width:600px;background-color:var(--wf-bg-card);border-radius:var(--wf-radius);padding:16px;box-shadow:var(--wf-shadow-card);border:1px solid var(--wf-border);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:var(--wf-text-body);"
    >
      <h1 style="font-size:22px;font-weight:bold;color:var(--wf-text-primary);margin:0 0 16px 0;padding-bottom:12px;border-bottom:1px solid var(--wf-divider);text-align:center;">
        高掉落仲裁时间表
      </h1>
      <div style="display:flex;flex-direction:column;gap:14px;">
        {[...groups.entries()].map(([dateKey, items]) => (
          <div>
            <div
              style="font-size:13px;font-weight:bold;color:var(--wf-text-secondary);margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--wf-border);"
            >
              {formatDayLabel(dateKey)}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              {items.map((a) => {
                const tier = rewardTier(a.rewards)
                const timeLabel = a.time.includes(' ')
                  ? a.time.slice(a.time.indexOf(' ') + 1)
                  : a.time
                return (
                  <div
                    style="display:flex;align-items:center;gap:10px;padding:6px 10px;background-color:var(--wf-bg-subtle);border-radius:var(--wf-radius-sm);border-left:3px solid var(--wf-border-strong);"
                  >
                    <span
                      style="font-size:13px;font-weight:600;color:var(--wf-text-primary);font-family:monospace;min-width:52px;"
                    >
                      {timeLabel}
                    </span>
                    <span style="font-size:13px;color:var(--wf-text-body);flex:1;min-width:0;">
                      {`${a.name} ${a.system}-${a.type}`}
                    </span>
                    <span
                      style="font-size:13px;color:var(--wf-accent);background-color:rgba(71,181,165,0.1);padding:1px 8px;border-radius:var(--wf-radius-sm);white-space:nowrap;"
                    >
                      {a.faction}
                    </span>
                    <span
                      style={`font-size:13px;font-weight:700;color:${tier.color};background-color:${tier.bg};padding:2px 8px;border-radius:var(--wf-radius-sm);white-space:nowrap;min-width:96px;text-align:right;`}
                    >
                      {a.rewards}
                      {' '}
                      精华/h
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CircuitComponent(currentIncarnons: number, currentWarframes: number, allIncarnons: string[][], allWarframes: string[][]): Element {
  return (
    <div
      style={`
      background-color: var(--wf-bg-card);
      border-radius: var(--wf-radius);
      padding: 16px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      width: 1000px;
      box-shadow: var(--wf-shadow-card);
      border: 1px solid var(--wf-border);
      color: var(--wf-text-body);
    `}
    >
      {/* 标题 */}
      <div
        style={`
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--wf-divider);
      `}
      >
        <h1
          style={`
          font-size: 22px;
          font-weight: bold;
          color: var(--wf-text-primary);
          margin: 0 0 8px 0;
        `}
        >
          回廊奖励总览
        </h1>
        <p
          style={`
          color: var(--wf-text-secondary);
          font-size: 11px;
          margin: 0;
        `}
        >
          灵化周
          {' '}
          {currentIncarnons + 1}
          /
          {allIncarnons.length}
          {' '}
          · 战甲周
          {' '}
          {currentWarframes + 1}
          /
          {allWarframes.length}
        </p>
      </div>

      {/* 两列布局 */}
      <div
        style={`
        display: flex;
        gap: 16px;
      `}
      >
        {/* 灵化之源 */}
        <div
          style={`
          flex: 1;
          background-color: var(--wf-bg-subtle);
          border-radius: var(--wf-radius);
          padding: 12px;
          border: 1px solid var(--wf-border);
          box-shadow: var(--wf-shadow-inner);
        `}
        >
          <div
            style={`
            font-weight: bold;
            font-size: 15px;
            color: var(--wf-text-body);
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--wf-border);
          `}
          >
            灵化之源
          </div>
          <div
            style={`
            display: flex;
            flex-direction: column;
            gap: 8px;
          `}
          >
            {allIncarnons.map((incarnons, weekIdx) => {
              const isCurrent = weekIdx === currentIncarnons

              return (
                <div
                  style={`
                    background-color: ${isCurrent ? 'var(--wf-bg-tint)' : 'var(--wf-bg-card)'};
                    border-radius: var(--wf-radius-sm);
                    padding: 8px 10px;
                    border-left: 4px solid ${isCurrent ? 'var(--wf-warning)' : 'var(--wf-border-strong)'};
                    box-shadow: var(--wf-shadow-subtle);
                  `}
                >
                  <div
                    style={`
                    font-size: 10px;
                    font-weight: bold;
                    color: ${isCurrent ? 'var(--wf-warning)' : 'var(--wf-text-muted)'};
                    margin-bottom: 6px;
                  `}
                  >
                    第
                    {weekIdx + 1}
                    周
                    {' '}
                    {isCurrent ? '· 当前' : null}
                  </div>
                  <div
                    style={`
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                  `}
                  >
                    {incarnons.map(item => (
                      <span
                        style={`
                        background-color: ${isCurrent ? 'var(--wf-bg-tint)' : 'var(--wf-bg-subtle)'};
                        padding: 3px 10px;
                        border-radius: var(--wf-radius-sm);
                        font-size: 11px;
                        font-weight: 500;
                        color: var(--wf-text-body);
                        border: 1px solid ${isCurrent ? 'var(--wf-border-strong)' : 'var(--wf-border)'};
                      `}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 战甲 */}
        <div
          style={`
          flex: 1;
          background-color: var(--wf-bg-subtle);
          border-radius: var(--wf-radius);
          padding: 12px;
          border: 1px solid var(--wf-border);
          box-shadow: var(--wf-shadow-inner);
        `}
        >
          <div
            style={`
            font-weight: bold;
            font-size: 15px;
            color: var(--wf-text-body);
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--wf-border);
          `}
          >
            战甲
          </div>
          <div
            style={`
            display: flex;
            flex-direction: column;
            gap: 8px;
          `}
          >
            {allWarframes.map((warframes, weekIdx) => {
              const isCurrent = weekIdx === currentWarframes

              return (
                <div
                  style={`
                    background-color: ${isCurrent ? 'var(--wf-bg-tint)' : 'var(--wf-bg-card)'};
                    border-radius: var(--wf-radius-sm);
                    padding: 8px 10px;
                    border-left: 4px solid ${isCurrent ? 'var(--wf-accent)' : 'var(--wf-border-strong)'};
                    box-shadow: var(--wf-shadow-subtle);
                  `}
                >
                  <div
                    style={`
                    font-size: 10px;
                    font-weight: bold;
                    color: ${isCurrent ? 'var(--wf-accent)' : 'var(--wf-text-muted)'};
                    margin-bottom: 6px;
                  `}
                  >
                    第
                    {weekIdx + 1}
                    周
                    {' '}
                    {isCurrent ? '· 当前' : null}
                  </div>
                  <div
                    style={`
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                  `}
                  >
                    {warframes.map(item => (
                      <span
                        style={`
                        background-color: ${isCurrent ? 'var(--wf-bg-tint)' : 'var(--wf-bg-subtle)'};
                        padding: 3px 10px;
                        border-radius: var(--wf-radius-sm);
                        font-size: 11px;
                        font-weight: 500;
                        color: var(--wf-text-body);
                        border: 1px solid ${isCurrent ? 'var(--wf-border-strong)' : 'var(--wf-border)'};
                      `}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 底部备注 */}
      <div
        style={`
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--wf-border);
        font-size: 10px;
        color: var(--wf-text-muted);
        text-align: center;
      `}
      >
        每周一更新
      </div>
    </div>
  )
}

export function FissureComponent(fissures: Fissure[], type: 'fissure' | 'sp-fissure' | 'rj-fissure'): Element {
  const titles = {
    'fissure': '虚空裂缝',
    'sp-fissure': '虚空裂缝 (钢铁之路)',
    'rj-fissure': '虚空裂缝 (九重天)',
  }
  const tierColors = [
    'var(--wf-rarity-common)',
    'var(--wf-success)',
    'var(--wf-rarity-uncommon)',
    'var(--wf-rarity-rare)',
    'var(--wf-danger)',
    'var(--wf-accent)',
  ]

  return (
    <div style="display:flex;flex-direction:column;align-items:center;background-color:var(--wf-bg-card);border-radius:var(--wf-radius);padding:16px;box-shadow:var(--wf-shadow-card);border:1px solid var(--wf-border);">
      <h1 style="font-size:50px;color:var(--wf-text-primary);">{titles[type]}</h1>
      <ul style="font-size:30px;margin-top:30px;">
        {fissures
          .filter(f => f.expiry - Date.now() > 0)
          .map((f) => {
            const timeLeft = f.expiry - Date.now()
            return (
              <li style="margin-top:10px;color:var(--wf-text-body);">
                <span style={`color:${tierColors[f.tierNum - 1]};`}>
                  {`${f.tier}(T${f.tierNum})`}
                </span>
                <span style="margin-left:20px;">
                  {f.node.name}
                  {' '}
                  {f.node.system}
                </span>
                <span style="margin-left:10px;">{f.node.type}</span>
                <span style="margin-left:10px;color:var(--wf-accent);">
                  {f.node.faction}
                  (
                  {f.node.minLevel + 5 + (f.hard ? 100 : 0)}
                  -
                  {f.node.maxLevel + 5 + (f.hard ? 100 : 0)}
                  )
                </span>
                <span
                  style={`margin-left:10px;color:${
                    timeLeft > 3600000
                      ? 'var(--wf-success)'
                      : timeLeft > 600000
                        ? 'var(--wf-info)'
                        : 'var(--wf-danger)'
                  };`}
                >
                  剩余
                  {msToHumanReadable(timeLeft)}
                </span>
              </li>
            )
          })}
      </ul>
      <div style="margin-top:30px;font-size:30px;color:var(--wf-text-muted);">
        注: 该功能的数据有一定延迟
      </div>
    </div>
  )
}

export function WeeklyRivenComponent(
  items: WeeklyRiven[],
  minPrice: number,
): Element {
  const formatPrice = (value: number): string =>
    Number.isInteger(value) ? value.toString() : value.toFixed(1)

  return (
    <div
      style={`
        color: var(--wf-text-body);
        line-height: 1.5;
        font-size: 14px;
        background-color: var(--wf-bg-card);
        font-family: 'Segoe UI', system-ui, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 16px;
        border-radius: var(--wf-radius);
        box-shadow: var(--wf-shadow-card);
        border: 1px solid var(--wf-border);
      `}
    >
      <h1
        style={`
          font-size: 22px;
          font-weight: bold;
          color: var(--wf-text-primary);
          margin: 0 0 16px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--wf-divider);
          text-align: center;
        `}
      >
        每周紫卡交易参考 (零洗中位价 &ge;
        {' '}
        {minPrice}
        P)
      </h1>
      <div
        style={`
          display: flex;
          flex-direction: column;
          gap: 6px;
        `}
      >
        {items.map((item, index) => {
          const weaponName = item.compatibility
            ? `${item.compatibility}`
            : item.itemType.replace(' Riven Mod', '')
          const tierNum = index + 1
          const tierColors = ['var(--wf-rarity-rare)', 'var(--wf-rarity-uncommon)', 'var(--wf-rarity-common)', 'var(--wf-border-strong)']
          const tierColor = tierNum === 1
            ? tierColors[0]
            : tierNum === 2 ? tierColors[1] : tierNum === 3 ? tierColors[2] : tierColors[3]

          return (
            <div
              style={`
                background-color: var(--wf-bg-card);
                border: 1px solid var(--wf-border);
                border-radius: var(--wf-radius-md);
                padding: 10px 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 4px solid ${tierColor};
                box-shadow: var(--wf-shadow-subtle);
              `}
            >
              <div
                style={`
                  display: flex;
                  align-items: center;
                  gap: 10px;
                `}
              >
                <span
                  style={`
                    font-weight: bold;
                    color: ${tierColor};
                    font-size: 16px;
                    min-width: 24px;
                  `}
                >
                  #
                  {tierNum}
                </span>
                <span
                  style={`
                    font-weight: 600;
                    font-size: 15px;
                    color: var(--wf-text-body);
                  `}
                >
                  {weaponName}
                </span>
              </div>
              <div
                style={`
                  display: flex;
                  align-items: center;
                  gap: 16px;
                `}
              >
                <span
                  style={`
                    color: var(--wf-success);
                    font-weight: 600;
                    font-size: 15px;
                  `}
                >
                  {formatPrice(item.median ?? item.avg)}
                  P
                </span>
                <span style={{ color: 'var(--wf-text-muted)', fontSize: 12 }}>
                  {`均价:${formatPrice(item.avg)}P 交易量:${item.pop} 区间:[${item.min}-${item.max}]`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div
        style={`
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--wf-border);
          font-size: 10px;
          color: var(--wf-text-muted);
          text-align: center;
        `}
      >
        数据来源: warframe.com weeklyRivensPC · 按未洗卡中位价排序，均价仅作参考
      </div>
    </div>
  )
}

export function WeeklyComponent(archon: ArchonHunt, deepArchimedea: ArchiMedea, temporalArchimedea: ArchiMedea): Element {
  const sectionStyle = `
    border-radius: var(--wf-radius);
    border: 1px solid var(--wf-border);
    padding: 12px 14px;
    background-color: var(--wf-bg-subtle);
    box-shadow: var(--wf-shadow-inner);
    color: var(--wf-text-body);
  `
  const missionCardStyle = `
    border-radius: var(--wf-radius-md);
    border: 1px solid var(--wf-border);
    padding: 8px 10px;
    margin-bottom: 8px;
    background-color: var(--wf-bg-card);
  `

  const archonHuntSection = (
    <section style={sectionStyle}>
      <div style="font-size:12px;color:var(--wf-text-muted);margin-bottom:6px;">
        Archon Hunt
      </div>

      <div style="font-size:16px;font-weight:600;color:var(--wf-text-primary);">
        {`执行官刺杀: ${archon.name}`}
      </div>
    </section>
  )

  const deepArchimedeaSection = (
    <section style={sectionStyle}>
      <div style="font-size:12px;color:var(--wf-success);margin-bottom:6px;">
        Deep Archimedea
      </div>

      <div style="font-size:16px;font-weight:600;color:var(--wf-text-primary);margin-bottom:8px;">
        {deepArchimedea.name}
      </div>

      {deepArchimedea.missions.map(m => (
        <div style={missionCardStyle}>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--wf-text-body);">
            {m.type}
          </div>

          <div style="font-size:12px;color:var(--wf-text-secondary);">
            <div>
              <span style="font-weight:600;margin-right:4px;color:var(--wf-text-body);">
                偏差:
              </span>
              {`${m.deviation.name}(${m.deviation.desc})`}
            </div>

            {m.risks.map(r => (
              <div>
                <span style="font-weight:600;margin-right:4px;color:var(--wf-text-body);">
                  风险:
                </span>
                {`${r.name}(${r.desc})`}
              </div>
            ))}
          </div>
        </div>
      ))}

      {deepArchimedea.peronal.map(p => (
        <div style="font-size:12px;margin-top:4px;color:var(--wf-text-secondary);">
          <span style="font-weight:600;margin-right:4px;color:var(--wf-text-body);">
            个人变量:
          </span>
          {`${p.name}(${p.desc})`}
        </div>
      ))}
    </section>
  )

  const temporalArchimedeaSection = (
    <section style={sectionStyle}>
      <div style="font-size:12px;color:var(--wf-info);margin-bottom:6px;">
        Temporal Archimedea
      </div>

      <div style="font-size:16px;font-weight:600;color:var(--wf-text-primary);margin-bottom:8px;">
        {temporalArchimedea.name}
      </div>

      {temporalArchimedea.missions.map(m => (
        <div style={missionCardStyle}>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--wf-text-body);">
            {m.type}
          </div>

          <div style="font-size:12px;color:var(--wf-text-secondary);">
            <div>
              <span style="font-weight:600;margin-right:4px;color:var(--wf-text-body);">
                偏差:
              </span>
              {`${m.deviation.name}(${m.deviation.desc})`}
            </div>

            {m.risks.map(r => (
              <div>
                <span style="font-weight:600;margin-right:4px;color:var(--wf-text-body);">
                  风险:
                </span>
                {`${r.name}(${r.desc})`}
              </div>
            ))}
          </div>
        </div>
      ))}

      {temporalArchimedea.peronal.map(p => (
        <div style="font-size:12px;margin-top:4px;color:var(--wf-text-secondary);">
          <span style="font-weight:600;margin-right:4px;color:var(--wf-text-body);">
            个人变量:
          </span>
          {`${p.name}(${p.desc})`}
        </div>
      ))}
    </section>
  )

  return (
    <div
      style={`
        color: var(--wf-text-body);
        line-height: 1.5;
        font-size: 14px;
        background-color: var(--wf-bg-card);
        font-family: 'Segoe UI', system-ui, sans-serif;
        max-width: 1024px;
        margin: 0 auto;
        padding: 16px;
        border-radius: var(--wf-radius);
        border: 1px solid var(--wf-border);
        box-shadow: var(--wf-shadow-card);
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
      `}
    >
      {archonHuntSection}
      {deepArchimedeaSection}
      {temporalArchimedeaSection}
    </div>
  )
}

export function RelicComponent(relic: OutputRelic): Element {
  const gold = relic.items.filter(i => i.rarity === 'RARE')
  const silver = relic.items.filter(i => i.rarity === 'UNCOMMON')
  const bronze = relic.items.filter(i => i.rarity === 'COMMON')

  // 辅助函数：根据掉落率获取颜色
  const getRateColor = (rarity: RelicRewardRarity): string => {
    if (rarity === 'RARE')
      return 'var(--wf-rarity-rare)'
    if (rarity === 'UNCOMMON')
      return 'var(--wf-rarity-uncommon)'
    if (rarity === 'COMMON')
      return 'var(--wf-rarity-common)'
    return 'var(--wf-text-primary)'
  }

  const relicRewardDropRate = {
    RARE: '2/4/6/10',
    UNCOMMON: '11/13/17/20',
    COMMON: '25/23/20/17',
  }

  const renderRewards = (items: OutputRelicReward[]): Element[] | null => {
    if (items.length === 0)
      return null

    return items.map(item => (
      <div
        style={`padding: 8px 12px;
          margin: 4px 0;
          border-radius: var(--wf-radius-sm);
          background-color: var(--wf-bg-subtle);
          border-left: 4px solid ${getRateColor(item.rarity)};
          display: flex;
          justify-content: space-between;
          align-items: center;
          line-height: 1;`}
      >
        <span style="color: var(--wf-text-primary); font-size: 14px;">{item.name}</span>
        <span
          style={`color: var(--wf-text-faint);
              font-size: 12px;
              font-family: monospace;
              display:flex;
              gap:10px;`}
        >
          <span
            style="
                color: var(--wf-platinum);
                display:flex;
                line-height:1;"
          >
            {item.platinum ?? '??'}
            <svg
              viewBox="0 0 18 18"
              style="
                  color: rgb(64 64 64 / 75%);
                  height: 1em;
                  width: 1em;
                  vertical-align: -.125em;
                  fill: currentcolor;
                  margin-left:2px;"
            >
              <use href="#icon-platinum"></use>
            </svg>
          </span>
          <span style="color: var(--wf-ducats);display:flex;line-height:1;">
            {item.ducats ?? '??'}
            <svg
              viewBox="0 0 18 18"
              style="
                color: rgb(64 64 64 / 75%);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
            >
              <use href="#icon-ducats"></use>
            </svg>
          </span>
          <span>
            {relicRewardDropRate[item.rarity]}
            %
          </span>
        </span>
      </div>
    ))
  }

  return (
    <div
      style={`
        border-radius: var(--wf-radius);
        padding: 16px;
        margin: 12px;
        border: 1px solid var(--wf-border);
        box-shadow: var(--wf-shadow-card);
        background-color: var(--wf-bg-card);
        color: var(--wf-text-primary);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 500px;
        min-width: 320px;`}
    >
      {/* 遗物标题 */}
      <div
        style={`display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--wf-divider);`}
      >
        <h1
          style={`font-size: 20px;
            font-weight: bold;
            margin: 0;
            color: var(--wf-text-primary);`}
        >
          {`${relic.tier} ${relic.num} 遗物`}
        </h1>
      </div>

      {/* 金奖励 */}
      {gold.length > 0 && (
        <div style="margin-bottom: 12px;">
          <div
            style={`display: flex;
              align-items: center;
              margin-bottom: 8px;`}
          >
            <h3
              style={`font-size: 14px;
                font-weight: bold;
                color: var(--wf-rarity-rare);
                margin: 0;
                text-transform: uppercase;`}
            >
              稀有
            </h3>
          </div>
          {renderRewards(gold)}
        </div>
      )}

      {/* 银奖励 */}
      {silver.length > 0 && (
        <div style="margin-bottom: 12px;">
          <div
            style={`display: flex;
              align-items: center;
              margin-bottom: 8px;`}
          >
            <h3
              style={`font-size: 14px;
                font-weight: bold;
                color: var(--wf-rarity-uncommon);
                margin: 0;
                text-transform: uppercase;`}
            >
              罕见
            </h3>
          </div>
          {renderRewards(silver)}
        </div>
      )}

      {/* 铜奖励 */}
      {bronze.length > 0 && (
        <div style="margin-bottom: 12px;">
          <div
            style={`display: flex;
              align-items: center;
              margin-bottom: 8px;`}
          >
            <h3
              style={`font-size: 14px;
                font-weight: bold;
                color: var(--wf-rarity-common);
                margin: 0;
                text-transform: uppercase;`}
            >
              常见
            </h3>
          </div>
          {renderRewards(bronze)}
        </div>
      )}

      {/* 备注信息 */}
      <div
        style={`margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--wf-border);
          font-size: 10px;
          color: var(--wf-text-muted);
          text-align: center;`}
      >
        价格数据来源于 WFM Ducanator, 约有1小时延迟
      </div>
    </div>
  )
}

export function RivenComponent(data: RivenStatAnalyzeResult): Element {
  // 格式化数值显示
  const formatValue = (value: number, unit: RivenAttributeUnit): string => {
    switch (unit) {
      case 'percent':
        return `${value.toFixed(1)}%`
      case 'multiply':
        return `x${value.toFixed(2)}`
      case 'seconds':
        return `${value.toFixed(2)}s`
      default:
        return value.toString()
    }
  }

  // 格式化范围显示
  const formatRange = (
    min: number,
    max: number,
    unit: RivenAttributeUnit,
  ): string => {
    const format = (num: number): string => {
      switch (unit) {
        case 'percent':
          return `${num.toFixed(1)}%`
        case 'multiply':
          return `x${num.toFixed(2)}`
        case 'seconds':
          return `${num.toFixed(2)}s`
        default:
          return num.toString()
      }
    }
    return `${format(min)} - ${format(max)}`
  }

  const isInRange = (percent: number): boolean => {
    return percent <= 0.1 && percent >= -0.1
  }

  const getPercentColor = (percent: number): string => {
    const clampedPercent = Math.max(-0.1, Math.min(0.1, percent))
    const normalized = (clampedPercent + 0.1) / 0.2
    const colors = [
      { pos: 0.0, color: '#fa4336' },
      { pos: 0.25, color: '#ff9800' },
      { pos: 0.5, color: '#ff9800' },
      { pos: 0.75, color: '#8bc34a' },
      { pos: 1.0, color: '#4caf50' },
    ]

    let startColor = colors[0]
    let endColor = colors[colors.length - 1]
    for (let i = 0; i < colors.length - 1; i++) {
      if (normalized >= colors[i].pos && normalized <= colors[i + 1].pos) {
        startColor = colors[i]
        endColor = colors[i + 1]
        break
      }
    }

    const range = endColor.pos - startColor.pos
    const relativePosition
      = range > 0 ? (normalized - startColor.pos) / range : 0

    const startRgb = hexToRgb(startColor.color)
    const endRgb = hexToRgb(endColor.color)

    const r = lerp(startRgb.r, endRgb.r, relativePosition)
    const g = lerp(startRgb.g, endRgb.g, relativePosition)
    const b = lerp(startRgb.b, endRgb.b, relativePosition)

    return rgbToHex(r, g, b)
  }

  const getDispositionIcon = (disposition: number): string => {
    if (disposition < 0.5) {
      return '◯◯◯◯◯'
    }
    else if (disposition < 0.69) {
      return '⬤◯◯◯◯'
    }
    else if (disposition <= 0.89) {
      return '⬤⬤◯◯◯'
    }
    else if (disposition <= 1.1) {
      return '⬤⬤⬤◯◯'
    }
    else if (disposition <= 1.3) {
      return '⬤⬤⬤⬤◯'
    }
    else {
      return '⬤⬤⬤⬤⬤'
    }
  }

  const getProgressWidth = (percent: number): string => {
    const normalized = ((percent + 1) / 2) * 100
    return `${Math.max(0, Math.min(100, normalized))}%`
  }

  return (
    <div style="display: flex; gap: 20px; width: 600px;">
      <div
        style="width: 100%; border-radius: var(--wf-radius); padding: 20px; box-shadow: var(--wf-shadow-card); border: 1px solid var(--wf-border); background-color: var(--wf-bg-card); color: var(--wf-text-body);"
      >
        {/* 武器名称和倾向 */}
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--wf-divider);"
        >
          <h2 style="margin: 0; font-size: 20px; color: var(--wf-text-primary);">{data.name}</h2>
          <div
            style="background-color: var(--wf-bg-subtle); padding: 4px 12px; border-radius: 12px; font-size: 14px; line-height: 1; color: var(--wf-text-body);"
          >
            {`倾向: ${getDispositionIcon(
              data.disposition,
            )} (${data.disposition.toFixed(2)})`}
          </div>
        </div>

        {/* 正面词条 */}
        <div style="margin-bottom: 25px;">
          <h3
            style="color: var(--wf-success); margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;"
          >
            正面词条 (
            {data.buffs.length}
            )
          </h3>

          <ul>
            {data.buffs.map((buff) => {
              const inRange = isInRange(buff.percent)
              const percentColor = getPercentColor(buff.percent)

              return (
                <li
                  style={`
                    background-color: var(--wf-bg-subtle);
                    border-radius: var(--wf-radius-md);
                    padding: 12px;
                    margin-bottom: 10px;
                    border-left: 4px solid ${percentColor};
                    position: relative;`}
                >
                  <div
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"
                  >
                    <span style="font-weight: bold; color: var(--wf-text-primary);">{buff.name}</span>
                    <span style="font-size: 18px; font-weight: bold; color: var(--wf-text-primary);">
                      {formatValue(buff.value, buff.unit)}
                    </span>
                  </div>

                  {/* 进度条 */}
                  <div
                    style="height: 10px; background-color: var(--wf-border-strong); border-radius: 3px; margin-bottom: 8px;"
                  >
                    <div
                      style="height: 10px; position: relative; overflow: hidden;"
                    >
                      <p
                        style={`position: absolute; left: 0; top: 0; height: 100%; width: ${getProgressWidth(
                          buff.percent * 10,
                        )}; background-color: ${percentColor}; border-radius: 3px;`}
                      >
                      </p>
                    </div>
                  </div>

                  <div
                    style="display: flex; justify-content: space-between; font-size: 12px; color: var(--wf-text-muted);"
                  >
                    <span>
                      范围:
                      {' '}
                      {formatRange(buff.min, buff.max, buff.unit)}
                    </span>
                    <span style={`color: ${percentColor};`}>
                      {buff.percent > 0 ? '+' : ''}
                      {`${(buff.percent * 100).toFixed(2)}%`}
                    </span>
                  </div>

                  {/* 范围警告 */}
                  {!inRange
                    ? (
                        <div
                          style="margin-top: 8px; padding: 6px; background-color: rgba(224, 80, 80, 0.12); border-radius: var(--wf-radius-sm); font-size: 12px; color: var(--wf-danger); display: flex; align-items: center;"
                        >
                          <span style="margin-right: 6px;">⚠</span>
                          数值不在正常范围内（可能未满级或倾向未更新）
                        </div>
                      )
                    : (
                        ''
                      )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* 负面词条 */}
        {data.curses.length > 0
          ? (
              <div>
                <h3
                  style="color: var(--wf-danger); margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;"
                >
                  负面词条 (
                  {data.curses.length}
                  )
                </h3>

                <ul>
                  {data.curses.map((curse) => {
                    const inRange = isInRange(curse.percent)
                    const percentColor = getPercentColor(curse.percent)
                    return (
                      <li
                        style={`background-color: var(--wf-bg-subtle); border-radius: var(--wf-radius-md); padding: 12px; margin-bottom: 10px; border-left: 4px solid ${percentColor};`}
                      >
                        <div
                          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"
                        >
                          <span style="font-weight: bold; color: var(--wf-text-primary);">{curse.name}</span>
                          <span style="font-size: 18px; font-weight: bold; color: var(--wf-text-primary);">
                            {formatValue(curse.value, curse.unit)}
                          </span>
                        </div>

                        {/* 进度条 */}
                        <div
                          style="height: 10px; background-color: var(--wf-border-strong); border-radius: 3px; margin-bottom: 8px;"
                        >
                          <div
                            style="height: 10px; position: relative; overflow: hidden;"
                          >
                            <p
                              style={`position: absolute; left: 0; top: 0; height: 100%; width: ${getProgressWidth(
                                curse.percent * 10,
                              )}; background-color: ${percentColor}; border-radius: 3px;`}
                            >
                            </p>
                          </div>
                        </div>

                        <div
                          style="display: flex; justify-content: space-between; font-size: 12px; color: var(--wf-text-muted);"
                        >
                          <span>
                            范围:
                            {' '}
                            {formatRange(curse.min, curse.max, curse.unit)}
                          </span>
                          <span style={`color: ${percentColor};`}>
                            {curse.percent > 0 ? '+' : ''}
                            {`${(curse.percent * 100).toFixed(2)}%`}
                          </span>
                        </div>

                        {/* 范围警告 */}
                        {!inRange
                          ? (
                              <div
                                style="margin-top: 8px; padding: 6px; background-color: rgba(224, 80, 80, 0.12); border-radius: var(--wf-radius-sm); font-size: 12px; color: var(--wf-danger); display: flex; align-items: center;"
                              >
                                <span style="margin-right: 6px;">⚠</span>
                                数值不在正常范围内（可能未满级或倾向未更新）
                              </div>
                            )
                          : (
                              ''
                            )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          : (
              ''
            )}
      </div>
    </div>
  )
}

export function RivenStatComponent(data: RivenStatResult): Element {
  const getValue = (value: number, unit: RivenAttributeUnit): string => {
    switch (unit) {
      case 'multiply':
        return `x${(1 + value).toFixed(2)}`
      case 'seconds':
        return `${value.toFixed(2)}s`
      case 'percent':
        return `${value.toFixed(2)}%`
      default:
        return value.toFixed(2)
    }
  }
  return (
    <div
      style={`
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        font-family: 'Segoe UI', system-ui, sans-serif;
        background-color: var(--wf-bg-card);
        border: 1px solid var(--wf-border);
        border-radius: var(--wf-radius);
        box-shadow: var(--wf-shadow-card);
        color: var(--wf-text-body);
        max-width: 600px;
      `}
    >
      <div
        style={`
        display: flex;
        gap: 16px;
      `}
      >
        {/* 正面属性列 */}
        <div
          style={`
          flex: 1;
        `}
        >
          <div
            style={`
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              padding: 0 4px;
            `}
          >
            <h3
              style={`
              margin: 0;
              color: var(--wf-success);
              font-size: 16px;
              font-weight: 600;
            `}
            >
              正面属性
            </h3>
            <div
              style={`
              display: flex;
              gap: 12px;
            `}
            >
              <span
                style={`
                color: var(--wf-text-muted);
                font-size: 12px;
              `}
              >
                最小
              </span>
              <span
                style={`
                color: var(--wf-text-muted);
                font-size: 12px;
              `}
              >
                最大
              </span>
            </div>
          </div>
          <div
            style={`
              display: flex;
              flex-direction: column;
              gap: 4px;
            `}
          >
            {Object.entries(data.positive).map(([, value]) => (
              <div
                style={`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background-color: var(--wf-bg-subtle);
      border-radius: var(--wf-radius-sm);
      border-left: 3px solid var(--wf-success);
    `}
              >
                <span
                  style={`
      color: var(--wf-text-body);
      font-size: 13px;
    `}
                >
                  {value.name}
                </span>
                <div
                  style={`
      display: flex;
      gap: 16px;
    `}
                >
                  <span
                    style={`
        color: var(--wf-success);
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                  >
                    {getValue(value.min, value.unit)}
                  </span>
                  <span
                    style={`
        color: var(--wf-success);
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                  >
                    {getValue(value.max, value.unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 负面属性列 */}
        {data.negative
          ? (
              <div
                style={`
            flex: 1;
        `}
              >
                <div
                  style={`
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding: 0 4px;
            `}
                >
                  <h3
                    style={`
                margin: 0;
                color: var(--wf-danger);
                font-size: 16px;
                font-weight: 600;
            `}
                  >
                    负面属性
                  </h3>
                  <div
                    style={`
                display: flex;
                gap: 12px;
            `}
                  >
                    <span
                      style={`
                  color: var(--wf-text-muted);
                  font-size: 12px;
              `}
                    >
                      最小
                    </span>
                    <span
                      style={`
                  color: var(--wf-text-muted);
                  font-size: 12px;
              `}
                    >
                      最大
                    </span>
                  </div>
                </div>
                <div
                  style={`
                display: flex;
                flex-direction: column;
                gap: 4px;
            `}
                >
                  {Object.entries(data.negative).map(([, value]) => (
                    <div
                      style={`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background-color: var(--wf-bg-subtle);
      border-radius: var(--wf-radius-sm);
      border-left: 3px solid var(--wf-danger);
    `}
                    >
                      <span
                        style={`
      color: var(--wf-text-body);
      font-size: 13px;
    `}
                      >
                        {value.name}
                      </span>
                      <div
                        style={`
      display: flex;
      gap: 16px;
    `}
                      >
                        <span
                          style={`
        color: var(--wf-danger);
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                        >
                          {getValue(value.min, value.unit)}
                        </span>
                        <span
                          style={`
        color: var(--wf-danger);
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                        >
                          {getValue(value.max, value.unit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          : (
              <></>
            )}
      </div>
    </div>
  )
}

export function VoidTraderComponent(data: VoidTrader): Element {
  return (
    <div
      style="width:400px;padding:16px;font-family:'Segoe UI',sans-serif;font-size:14px;background-color:var(--wf-bg-card);border-radius:var(--wf-radius);border:1px solid var(--wf-border);box-shadow:var(--wf-shadow-card);color:var(--wf-text-body);"
    >
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th
              style="border-bottom:1px solid var(--wf-border-strong);text-align:left;padding:6px;color:var(--wf-text-primary);"
            >
              名称
            </th>
            <th
              style="border-bottom:1px solid var(--wf-border-strong);text-align:left;padding:6px;color:var(--wf-text-primary);"
            >
              价格
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map(item => (
            <tr>
              <td style="padding:6px;border-bottom:1px solid var(--wf-border);">
                {item.name}
              </td>
              <td
                style="padding:6px;border-bottom:1px solid var(--wf-border);text-align:center;line-height:1;"
              >
                <span>{item.ducats}</span>
                <svg
                  viewBox="0 0 18 18"
                  style="
                color: rgb(64 64 64 / 75%);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
                >
                  <use href="#icon-ducats"></use>
                </svg>
                <span>+</span>
                <span>{item.credits}</span>
                <span>现金</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
