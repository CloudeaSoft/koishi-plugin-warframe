import type { Element } from 'koishi'
import type { LichOfferings } from '../warframe'
import { msToHumanReadable } from '../warframe'

export function LichOfferingsComponent(data: LichOfferings): Element {
  const title = data.family === 'tenet' ? '信条武器 · Ergo Glast' : `终幕武器 · Eleanor · ${data.batch} 批`
  const sources = new Set(data.weapons.flatMap(({ bonus }) => bonus ? [bonus.source] : []))
  const unverified = data.weapons.some(({ bonus }) => bonus && !bonus.compared)
  return (
    <div style="width:420px;padding:16px;background:var(--wf-bg-card);color:var(--wf-text-body);">
      <h2>{title}</h2>
      <p>{`距离轮换 ${msToHumanReadable(data.expiresAt - Date.now())}`}</p>
      {data.weapons.map(({ name, bonus }) => (
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--wf-divider);">
          <b>{name}</b>
          <span>{bonus ? `${bonus.element} +${bonus.percent}%${bonus.compared ? '' : '*'}` : '待上报'}</span>
        </div>
      ))}
      <p style="color:var(--wf-text-secondary);">
        {sources.size ? `玩家上报 · ${[...sources].join(' / ')}` : '暂无本期加成上报'}
      </p>
      {unverified ? <small>* 尚未核实该数值是否已随本期轮换更新</small> : null}
    </div>
  )
}
