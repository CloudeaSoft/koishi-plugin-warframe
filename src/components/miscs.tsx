import type { Element } from 'koishi'
import type { RivenWeaponItem } from '../warframe'

export function HotRivenComponent(data: RivenWeaponItem[]): Element {
  const displayData = data.slice(0, 20)

  return (
    <div style="width: 600px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      {displayData.map(item => (
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; background-color: #ffffff; padding: 8px 10px; border-radius: 6px; border: 1px solid #e8ecf0;">
          <div style="flex: 1; min-width: 0; max-width: 60%;">
            <div style="display: flex; align-items: baseline; gap: 4px;">
              <span style="font-size: 13px; font-weight: 600; color: #1a2332; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {item.name_zh}
              </span>
              <span style="font-size: 10px; color: #6b7a8f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {item.name_en}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 1px; flex-wrap: wrap;">
              <span style="font-size: 11px; font-weight: 500; color: #1a2332;">
                倾向
                {' '}
                {item.disposition.toFixed(2)}
              </span>
              <span style="font-size: 10px; color: #9aabb8;">·</span>
              <span style="font-size: 10px; color: #6b7a8f;">
                🟢在线
                {' '}
                {item.active_count}
              </span>
            </div>
          </div>

          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 16px; font-weight: 700; color: #2d7a6d;">
              {item.bottom_price}
              p
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
