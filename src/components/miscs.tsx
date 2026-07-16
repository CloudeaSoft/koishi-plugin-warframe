import type { Element } from 'koishi'
import type { RivenWeaponItem } from '../warframe'

export function HotRivenComponent(data: RivenWeaponItem[]): Element {
  const displayData = data.slice(0, 20)

  return (
    <div style="width:600px;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:16px;background-color:var(--wf-bg-card);border:1px solid var(--wf-border);border-radius:var(--wf-radius);box-shadow:var(--wf-shadow-card);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:var(--wf-text-body);">
      {displayData.map(item => (
        <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;background-color:var(--wf-bg-subtle);padding:8px 10px;border-radius:var(--wf-radius-md);border:1px solid var(--wf-border);">
          <div style="flex:1;min-width:0;max-width:60%;">
            <div style="display:flex;align-items:baseline;gap:4px;">
              <span style="font-size:13px;font-weight:600;color:var(--wf-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                {item.name_zh}
              </span>
              <span style="font-size:10px;color:var(--wf-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                {item.name_en}
              </span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;margin-top:1px;flex-wrap:wrap;">
              <span style="font-size:11px;font-weight:500;color:var(--wf-text-body);">
                倾向
                {' '}
                {item.disposition.toFixed(2)}
              </span>
              <span style="font-size:10px;color:var(--wf-text-faint);">·</span>
              <span style="font-size:10px;color:var(--wf-text-secondary);">
                🟢在线
                {' '}
                {item.active_count}
              </span>
            </div>
          </div>

          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:16px;font-weight:700;color:var(--wf-success);">
              {item.bottom_price}
              p
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
