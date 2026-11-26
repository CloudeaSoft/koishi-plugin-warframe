import type { Element } from 'koishi'
import type { LichOfferings } from '../warframe'
import { msToHumanReadable } from '../warframe'

function bonusColor(percent: number): string {
  if (percent === 60)
    return '#c62828'
  if (percent >= 52.9)
    return '#a69500'
  if (percent >= 48.1)
    return '#2166ac'
  return 'inherit'
}

export function LichOfferingsComponent(data: LichOfferings): Element {
  const unverified = data.weapons.some(({ bonus }) => bonus && !bonus.compared)
  return (
    <div style="width:360px;padding:16px;background:var(--wf-bg-card);color:var(--wf-text-body);">
      <p>{`距离轮换 ${msToHumanReadable(data.expiresAt - Date.now())}`}</p>
      {data.weapons.map(({ name, bonus }) => (
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--wf-divider);">
          <b>{name}</b>
          {bonus
            ? (
                <span>
                  {`${bonus.element} `}
                  <span style={`color:${bonusColor(bonus.percent)}`}>{`+${bonus.percent}%`}</span>
                  {bonus.compared ? '' : '*'}
                </span>
              )
            : <span>待上报</span>}
        </div>
      ))}
      {data.weapons.every(({ bonus }) => !bonus) ? <p style="color:var(--wf-text-secondary);">暂无本期加成上报</p> : null}
      {unverified ? <small>* 尚未核实该数值是否已随本期轮换更新</small> : null}
    </div>
  )
}
