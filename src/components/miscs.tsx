import type { Element } from 'koishi'
import type { RivenType, RivenWeaponItem } from '../warframe'

const rivenTypeLabel: Record<RivenType, string> = {
  melee: '近战',
  rifle: '步枪',
  pistol: '手枪',
  shotgun: '霰弹',
  zaw: 'Zaw',
}

export function HotRivenComponent(data: RivenWeaponItem[]): Element {
  const displayData = data.slice(0, 20)
  const rankColors = [
    'var(--wf-rarity-rare)',
    '#8a8a8a',
    'var(--wf-rarity-common)',
  ]
  const rankColor = (i: number): string => (i < 3 ? rankColors[i] : 'var(--wf-border-strong)')

  return (
    <div style="width:640px;background-color:var(--wf-bg-card);border:1px solid var(--wf-border);border-radius:var(--wf-radius);padding:16px;box-shadow:var(--wf-shadow-card);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:var(--wf-text-body);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--wf-divider);">
        <h1 style="font-size:18px;font-weight:bold;color:var(--wf-text-primary);margin:0;">
          热门紫卡
        </h1>
        <span style="font-size:11px;color:var(--wf-text-muted);">
          Top
          {' '}
          {displayData.length}
        </span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        {displayData.map((item, index) => {
          const rank = index + 1
          const color = rankColor(index)
          return (
            <div style={`display:flex;align-items:center;gap:8px;background-color:var(--wf-bg-subtle);padding:8px 10px;border-radius:var(--wf-radius-md);border:1px solid var(--wf-border);border-left:3px solid ${color};`}>
              <span style={`font-size:14px;font-weight:bold;color:${color};min-width:24px;text-align:center;flex-shrink:0;`}>
                #
                {rank}
              </span>
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:baseline;gap:4px;">
                  <span style="font-size:13px;font-weight:600;color:var(--wf-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    {item.name_zh}
                  </span>
                  <span style="font-size:10px;color:var(--wf-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    {item.name_en}
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px;flex-wrap:wrap;">
                  <span style="font-size:10px;color:var(--wf-text-secondary);background-color:rgba(0,0,0,0.04);padding:1px 6px;border-radius:var(--wf-radius-sm);">
                    {rivenTypeLabel[item.rivenType] ?? item.rivenType}
                  </span>
                  <span style="font-size:10px;color:var(--wf-text-secondary);">
                    倾向
                    {' '}
                    {item.disposition.toFixed(2)}
                  </span>
                  <span style="font-size:10px;color:var(--wf-success);white-space:nowrap;">
                    ●
                    {' '}
                    {item.active_count}
                  </span>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:15px;font-weight:700;color:var(--wf-platinum);line-height:1.2;">
                  {item.bottom_price}
                  p
                </div>
                <div style="font-size:9px;color:var(--wf-text-muted);">
                  ≥
                  {item.min_price}
                  p
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--wf-border);font-size:10px;color:var(--wf-text-muted);text-align:center;">
        按底价排序 · ● 在线卖家数 · 数据来源 RivenTracker
      </div>
    </div>
  )
}
