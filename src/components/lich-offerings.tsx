import type { Element } from 'koishi'
import type { LichOfferings } from '../warframe'
import { msToHumanReadable } from '../warframe'

export function LichOfferingsComponent(data: LichOfferings): Element {
  const unverified = data.weapons.some(({ bonus }) => bonus && !bonus.compared)
  return (
    <div style="width:360px;padding:16px;background:var(--wf-bg-card);color:var(--wf-text-body);">
      <p>{`距离轮换 ${msToHumanReadable(data.expiresAt - Date.now())}`}</p>
      {data.weapons.map(({ name, bonus }) => (
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--wf-divider);">
          <b>{name}</b>
          <span>{bonus ? `${bonus.element} +${bonus.percent}%${bonus.compared ? '' : '*'}` : '待上报'}</span>
        </div>
      ))}
      {data.weapons.every(({ bonus }) => !bonus) ? <p style="color:var(--wf-text-secondary);">暂无本期加成上报</p> : null}
      {unverified ? <small>* 尚未核实该数值是否已随本期轮换更新</small> : null}
    </div>
  )
}
