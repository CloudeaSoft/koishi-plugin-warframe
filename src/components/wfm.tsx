import type Element from '@satorijs/element'
import type {
  ItemShort,
  ItemStatisticsSummary,
  OrderWithUser,
  PrimedModHistoryItem,
  RivenAttributeShortInternal,
  RivenItem,
  RivenOrderInternal,
} from '../warframe'

function formatShortDate(datetime: string): string {
  const d = new Date(datetime)
  if (Number.isNaN(d.getTime()))
    return ''
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${month}-${day}`
}

function trendArrow(trend: 'up' | 'down' | 'flat'): string {
  return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '≈'
}

function trendColor(trend: 'up' | 'down' | 'flat'): string {
  return trend === 'up' ? 'var(--wf-danger)' : trend === 'down' ? 'var(--wf-success)' : 'var(--wf-text-muted)'
}

function ItemStatisticsChart(stats: ItemStatisticsSummary): Element {
  const points = stats.chart
  const W = 1600 - 2 * 12
  const H = 240
  const padL = 55
  const padR = 25
  const padT = 25
  const padB = 45
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  let dataMin = Infinity
  let dataMax = -Infinity
  for (const p of points) {
    if (p.donchBot < dataMin)
      dataMin = p.donchBot
    if (p.median < dataMin)
      dataMin = p.median
    if (p.donchTop > dataMax)
      dataMax = p.donchTop
    if (p.median > dataMax)
      dataMax = p.median
  }
  const range = dataMax - dataMin
  const pad = range > 0 ? range * 0.1 : 5
  const yMin = dataMin - pad
  const yMax = dataMax + pad
  const yScale = yMax - yMin

  const xPos = (i: number): number => padL + (points.length > 1 ? i * chartW / (points.length - 1) : 0)
  const yPos = (v: number): number => padT + (1 - (v - yMin) / yScale) * chartH

  const bandTop = points.map((p, i) => `${xPos(i)},${yPos(p.donchTop)}`)
  const bandBot = points.map((p, i) => `${xPos(points.length - 1 - i)},${yPos(p.donchBot)}`)
  const bandPoints = [...bandTop, ...bandBot].join(' ')

  const linePoints = points.map((p, i) => `${xPos(i)},${yPos(p.median)}`).join(' ')

  const baselineY = stats.baselineMedian !== undefined ? yPos(stats.baselineMedian) : null

  const onlineYRaw = yPos(stats.onlineMin)
  const onlineY = Math.max(padT, Math.min(H - padB, onlineYRaw))

  return (
    <svg width={W} height={H} style="font-family: Arial, sans-serif; background: var(--wf-bg-subtle);">
      <polygon points={bandPoints} fill="#5a95ff" fillOpacity={0.12} stroke="none" />
      <line x1={padL} y1={onlineY} x2={W - padR} y2={onlineY} stroke="var(--wf-warning)" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={W - padR} y={onlineY - 6} textAnchor="end" fontSize={12} fill="var(--wf-warning)">
        在线最低
        {stats.onlineMin}
        p
      </text>
      {baselineY !== null
        ? (
            <g>
              <line x1={padL} y1={baselineY} x2={W - padR} y2={baselineY} stroke="var(--wf-text-faint)" strokeWidth={1} strokeDasharray="3 3" />
              <text x={padL + 4} y={baselineY - 5} textAnchor="start" fontSize={11} fill="var(--wf-text-muted)">
                7天中位
                {stats.baselineMedian}
                p
              </text>
            </g>
          )
        : null}
      <polyline points={linePoints} fill="none" stroke="#5a95ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle cx={xPos(i)} cy={yPos(p.median)} r={3.5} fill="#5a95ff" stroke="var(--wf-bg-card)" strokeWidth={1} />
      ))}
      {points.map((p, i) => (
        <text x={xPos(i)} y={H - padB + 20} textAnchor="middle" fontSize={11} fill="var(--wf-text-secondary)">
          {formatShortDate(p.datetime)}
        </text>
      ))}
      <text x={padL - 8} y={padT + 5} textAnchor="end" fontSize={11} fill="var(--wf-text-secondary)">
        {Math.round(dataMax)}
      </text>
      <text x={padL - 8} y={H - padB} textAnchor="end" fontSize={11} fill="var(--wf-text-secondary)">
        {Math.round(dataMin)}
      </text>
    </svg>
  )
}

function StatCard(label: string, value: string, accent?: string): Element {
  return (
    <div style="flex:1;min-width:0;border-radius:var(--wf-radius-md);padding:8px 10px;background:var(--wf-bg-subtle);border:1px solid var(--wf-border);display:flex;flex-direction:column;align-items:center;gap:2px;">
      <span style="font-size:0.9rem;color:var(--wf-text-muted);">{label}</span>
      <span style={`font-size:1.4rem;font-weight:700;color:${accent ?? 'var(--wf-text-primary)'};`}>{value}</span>
    </div>
  )
}

function ItemStatisticsCards(stats: ItemStatisticsSummary): Element {
  const arrow = trendArrow(stats.trend)
  const tColor = trendColor(stats.trend)
  return (
    <div style="display:flex;gap:8px;margin-top:12px;">
      {StatCard(
        '近7天中位',
        stats.baselineMedian !== undefined ? `${stats.baselineMedian}p` : '—',
      )}
      {StatCard(
        '近3天均价',
        stats.recentAvg !== undefined ? `${stats.recentAvg}p ${arrow}` : '—',
        stats.recentAvg !== undefined ? tColor : undefined,
      )}
      {StatCard('近3天成交', `${stats.recentVolume}笔`)}
      {StatCard(
        '90天区间',
        stats.rangeMin !== undefined && stats.rangeMax !== undefined
          ? `${stats.rangeMin}-${stats.rangeMax}p`
          : '—',
      )}
      {StatCard('在线最低', `${stats.onlineMin}p`, 'var(--wf-warning)')}
    </div>
  )
}

function ItemStatisticsComponent(stats: ItemStatisticsSummary): Element {
  const hasData
    = stats.chart.length > 0
      || stats.recentAvg !== undefined
      || stats.baselineMedian !== undefined
  if (!hasData) {
    return (
      <div style="margin-top:16px;padding:12px;border-top:2px solid var(--wf-divider);text-align:center;color:var(--wf-text-muted);font-size:1.2rem;">
        暂无近期成交统计数据
      </div>
    )
  }
  return (
    <div style="margin-top:16px;padding:12px;border-top:2px solid var(--wf-divider);">
      {stats.chart.length >= 2 ? ItemStatisticsChart(stats) : null}
      {ItemStatisticsCards(stats)}
    </div>
  )
}

export function ItemOrderComponent(item: ItemShort, orders: OrderWithUser[], statistics?: ItemStatisticsSummary): Element {
  const itemNameCN = item.i18n?.['zh-hans']?.name
  const itemNameEN = item.i18n?.en?.name
  return (
    <div style="display:flex;flex-direction:column;width:1600px;background-color:var(--wf-bg-card);border-radius:var(--wf-radius);padding:16px;border:1px solid var(--wf-border);box-shadow:var(--wf-shadow-card);color:var(--wf-text-body);">
      <style>
        {`
          th {
            align-items: center;
            font-size: 1.8rem;
            color: var(--wf-text-primary);
            border-bottom: 1px solid var(--wf-border-strong);
          }

          td {
            text-align: center;
            font-size: 1.5rem;
            border-bottom: 1px solid var(--wf-border);
          }

          tr {
            height: 3rem;
          }
          `}
      </style>
      <h1 style="text-align:center;color:var(--wf-text-primary);">
        {itemNameCN}
        {' '}
        /
        {itemNameEN}
        {' '}
        (ID:
        {item.slug}
        )
      </h1>
      <table style="width:100%;">
        <tr>
          <th style="width:40%;">玩家名</th>
          <th style="width:20%;">状态</th>
          <th style="width:10%;">价格</th>
          <th style="width:10%;">数量</th>
          {item.maxRank && item.maxRank > 0
            ? <th style="width:10%;">等级</th>
            : null}
          <th style="width:10%;">好评</th>
        </tr>
        {orders.map(order => (
          <tr>
            <td>{order.user?.ingameName ?? '未知'}</td>
            <td>{order.user?.status ?? '未知'}</td>
            <td style="color:var(--wf-platinum);font-weight:600;">{order.platinum}</td>
            <td>{order.quantity}</td>
            {item.maxRank && item.maxRank > 0
              ? <td>{order.rank}</td>
              : null}
            <td>{order.user?.reputation ?? '未知'}</td>
          </tr>
        ))}
      </table>
      {statistics ? ItemStatisticsComponent(statistics) : null}
    </div>
  )
}

export function RivenOrderComponent(item: RivenItem, orders: RivenOrderInternal[]): Element {
  const itemNameCN = item.i18n ? item.i18n['zh-hans']?.name : undefined
  const itemNameEN = item.i18n ? item.i18n.en?.name : undefined
  const itemThumb = item.i18n ? item.i18n.en?.thumb : undefined
  return (
    <div style="display:flex;flex-direction:column;font-size:12px;background-color:var(--wf-bg-card);border-radius:var(--wf-radius);padding:16px;border:1px solid var(--wf-border);box-shadow:var(--wf-shadow-card);color:var(--wf-text-body);">
      <h1 style="text-align:center;color:var(--wf-text-primary);">
        {itemNameCN}
        {' '}
        /
        {itemNameEN}
        {' '}
        (ID:
        {item.slug}
        )
      </h1>
      <ul style="width:100%;">
        {orders.map((order) => {
          return RivenOrderItemComponent(
            order,
            itemNameCN,
            itemNameEN,
            itemThumb,
          )
        })}
      </ul>
    </div>
  )
}

function RivenOrderItemComponent(order: RivenOrderInternal, cnName?: string, enName?: string, thumb?: string): Element {
  const itemNameCN = cnName ?? enName
  const itemIconLink = thumb
    ? `https://warframe.market/static/assets/${thumb}`
    : undefined
  const ownerAvatarLink = order.owner.avatar
    ? `https://warframe.market/static/assets/${order.owner.avatar}`
    : undefined

  const reputationColor = order.owner.reputation >= 5 ? 'var(--wf-success)' : 'var(--wf-text-muted)'
  const reputationIconLink
    = order.owner.reputation >= 5 ? '#icon-smile' : '#icon-meh'

  const statusData = {
    ingame: ['ONLINE IN GAME', 'var(--wf-accent)'],
    online: ['ONLINE', 'var(--wf-success)'],
    offline: ['OFFLINE', 'var(--wf-danger)'],
    _: ['UNKNOWN', 'var(--wf-text-muted)'],
  }
  const status
    = order.owner.status in statusData
      ? (order.owner.status as keyof typeof statusData)
      : '_'
  const statusText = statusData[status][0]
  const statusColor = statusData[status][1]

  return (
    <div style="border:1px solid var(--wf-border-strong);margin:20px;padding:10px 15px 10px 11px;font-family:'Segoe UI',sans-serif,Helvetica,Arial;display:flex;flex-direction:column;background-color:var(--wf-bg-subtle);border-radius:var(--wf-radius-md);">
      <div style="display:flex;align-items:center;padding-bottom:10px;min-height:45px;">
        <img
          src={itemIconLink}
          style="height:30px;width:30px;object-fit:contain;border-radius:50%;box-shadow:0 0 10px 1px rgba(0,0,0,.15);vertical-align:middle;"
        />
        <span
          id="title"
          style="margin-left:15px;font-size:16px;line-height:16px;font-weight:700;text-overflow:ellipsis;color:var(--wf-text-primary);"
        >
          {itemNameCN}
          {' '}
          {order.item.name}
        </span>
      </div>
      <div
        id="body"
        style="display:flex;flex-wrap:wrap;justify-content:space-between;"
      >
        <div id="body-left">
          <ul style="display:flex;padding-top:5px;">
            {order.item.attributes
              .filter(attr => attr.positive)
              .map(RivenAttributeComponent)}
          </ul>
          <ul style="display:flex;width:100%;padding-top:5px;">
            {order.item.attributes
              .filter(attr => !attr.positive)
              .map(RivenAttributeComponent)}
          </ul>
          <ul style="display:flex;padding:5px 0;font-size:12px;color:var(--wf-text-secondary);">
            <li style="margin-right:10px;">
              <span>段位 </span>
              <b style="color:var(--wf-text-primary);">{order.item.mastery_level}</b>
            </li>
            <li style="margin-right:10px;">
              <span>等级: </span>
              <b style="color:var(--wf-text-primary);">{order.item.mod_rank}</b>
            </li>
            <li style="margin-right:10px;">
              <span>循环: </span>
              <b style="color:var(--wf-text-primary);">{order.item.re_rolls}</b>
            </li>
            <li style="margin-right:10px;">
              <span>极性: </span>
              <b>
                <svg
                  viewBox="0 0 18 18"
                  style="
                color: rgb(64 64 64 / 75%);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
                >
                  <use href={`#icon-${order.item.polarity}`}></use>
                </svg>
              </b>
            </li>
          </ul>
        </div>
        <div
          id="body-right"
          style="display:flex;flex-direction:column;justify-content:center;padding-left:10px;"
        >
          <div style="display:flex;justify-content:flex-end;font-size:16px;color:var(--wf-text-body);">
            <span>售价: </span>
            <div style="padding-left:5px;line-height:1.5;">
              <b style="color:var(--wf-platinum);">{order.starting_price}</b>
              <svg
                viewBox="0 0 215.535 215.535"
                style="
                margin: 0 0 0 3px;
                color: var(--wf-platinum);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
              >
                <use href="#icon-platinum"></use>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div
        id="footer"
        style="display:flex;margin-top:10px;line-height:1.5;align-items:center;"
      >
        <div style="display:flex;align-items:center;">
          <img
            src={ownerAvatarLink}
            style="height:20px;width:20px;object-fit:contain;border-radius:50%;box-shadow:0 0 10px 1px rgba(0,0,0,.15);vertical-align:middle;"
          />
          <span style="margin-left:5px;color:var(--wf-text-body);">{order.owner.ingame_name}</span>
        </div>
        <div
          style={`margin-left:10px;color:${statusColor};font-size:12px;font-weight:600;`}
        >
          {statusText}
        </div>
        <div style={`margin-left:10px;color:${reputationColor};display:flex;align-items:center;`}>
          {order.owner.reputation}
          <svg
            viewBox="0 0 496 512"
            style="margin-left:5px;margin-top:-2px;overflow:hidden;height:1em;width:1em;vertical-align:-.125em;fill:currentcolor;"
          >
            <use href={reputationIconLink}></use>
          </svg>
        </div>
      </div>
    </div>
  )
}

function RivenAttributeComponent(attr: RivenAttributeShortInternal, index: number): Element {
  const attrInfo = attr.attribute
  const attrName
    = attrInfo?.i18n?.['zh-hans']?.name ?? attrInfo?.i18n?.en?.name ?? attr.url_name
  const unit = attrInfo?.unit ?? ''
  const attrValuePrefix = unit === 'multiply' ? 'x' : ''
  const attrValueSuffix = unit === 'percent' ? '%' : unit === 'second' ? 's' : ''
  const attrValue = attrValuePrefix + attr.value + attrValueSuffix
  const positiveColors = ['#2e7d32', '#4a8c5a', '#6b9b78']
  const negativeColor = '#e05050'
  const color = attr.positive
    ? positiveColors[index] ?? positiveColors[0]
    : negativeColor

  return (
    <li
      style={`
        border: 1px solid ${color}80;
        background-color: ${color}1a;
        color: ${color};
        padding: 2px 10px;
        border-radius: var(--wf-radius-sm);
        margin-right: 5px;
        font-size: 14px;
        line-height: 1.5;`}
    >
      <b>
        {attr.positive && !attrValuePrefix && attr.value > 0 ? '+' : ''}
        {attrValue}
        {' '}
      </b>
      <span>{attrName}</span>
    </li>
  )
}

const PMH_ITEMS_PER_COLUMN = 15
const PMH_GRID_GAP = 6

function getPriceTier(plats: number): {
  borderColor: string
  bgColor: string
  label: string
  textGlow?: string
} {
  if (plats > 250) {
    return {
      borderColor: '#ff6eb4',
      bgColor:
        'linear-gradient(135deg, rgba(255,110,180,0.18), rgba(110,200,255,0.18), rgba(255,230,80,0.18))',
      label: 'legendary',
      textGlow: '0 0 6px rgba(255,110,180,0.6)',
    }
  }
  if (plats > 80) {
    return {
      borderColor: 'var(--wf-warning)',
      bgColor: 'rgba(255,140,66,0.12)',
      label: 'premium',
    }
  }
  if (plats > 50) {
    return {
      borderColor: '#f0c040',
      bgColor: 'rgba(240,192,64,0.10)',
      label: 'high',
    }
  }
  return { borderColor: 'var(--wf-border-strong)', bgColor: 'transparent', label: 'normal' }
}

function calcDaysAgo(dateStr: string): number | null {
  if (!dateStr)
    return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime()))
    return null
  const now = Date.now()
  const diff = now - d.getTime()
  return Math.floor(diff / 86400000)
}

function PMHCard(item: PrimedModHistoryItem, _index: number): Element {
  const pr = item.plats
  const tier
    = pr !== undefined
      ? getPriceTier(pr)
      : { borderColor: 'var(--wf-border-strong)', bgColor: 'transparent', label: 'normal' }

  const dateStr = item.last
    ? (() => {
        const d = new Date(item.last)
        if (!Number.isNaN(d.getTime())) {
          const year = d.getUTCFullYear()
          const month = String(d.getUTCMonth() + 1).padStart(2, '0')
          const day = String(d.getUTCDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        return item.last
      })()
    : ''

  const daysAgo = calcDaysAgo(item.last)
  const isOld = daysAgo !== null && daysAgo > 90

  const isLegendary = pr !== undefined && pr > 300
  const showGlow = pr !== undefined && pr > 80

  const cardContent = (
    <div
      style={`
        border-radius: 6px;
        padding: 6px 10px;
        background: ${isLegendary ? 'linear-gradient(135deg, rgba(255,50,100,0.20), rgba(255,200,50,0.20), rgba(50,255,100,0.20), rgba(50,150,255,0.20), rgba(200,50,255,0.20))' : tier.bgColor};
        border-left: 4px solid ${tier.borderColor};
        box-shadow: ${showGlow ? (isLegendary ? '0 0 14px rgba(255,50,100,0.30), 0 0 28px rgba(200,50,255,0.20)' : `0 0 8px ${tier.borderColor}44`) : '0 1px 2px rgba(0,0,0,0.04)'};
        ${isLegendary ? 'border-image: linear-gradient(135deg, #ff3264, #ffcc33, #33ff66, #3399ff, #cc33ff) 1; border-image-slice: 1; border-left: 4px solid transparent;' : ''}
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 11px;
        min-width: 0;
        overflow: hidden;
      `}
    >
      <div
        style={`
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: var(--wf-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        `}
      >
        <span style="overflow:hidden;text-overflow:ellipsis;">
          {item.name ?? '未知'}
        </span>
        {daysAgo
          ? (
              <span
                style={`flex-shrink:0;margin-left:4px;background:var(--wf-bg-subtle);color:${isOld ? 'var(--wf-danger)' : 'var(--wf-text-muted)'};border-radius:3px;padding:0 5px;font-size:9px;font-weight:400;line-height:1.5;`}
              >
                距今
                {daysAgo}
                天
              </span>
            )
          : null}
      </div>
      <div
        style={`
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-variant-numeric: tabular-nums;
        `}
      >
        <span style="color:var(--wf-text-muted);font-size:10px;">{dateStr || '未知'}</span>
        {pr !== undefined
          ? (
              <span
                style={`
              display: inline-flex;
              align-items: center;
              gap: 2px;
              font-weight: 700;
              font-size: 12px;
              color: var(--wf-platinum);
              ${isLegendary ? 'text-shadow: 0 0 6px rgba(255,50,100,0.7), 0 0 12px rgba(200,50,255,0.4);' : ''}
            `}
              >
                {pr}
                <svg
                  viewBox="0 0 215.535 215.535"
                  style="height: 0.85em; width: 0.85em; fill: currentcolor;"
                >
                  <use href="#icon-platinum"></use>
                </svg>
              </span>
            )
          : (
              <span style="color:var(--wf-text-faint);font-size:10px;">暂无</span>
            )}
      </div>
    </div>
  )

  return cardContent
}

export function PrimedModHistoryComponent(history: PrimedModHistoryItem[]): Element {
  // 按 plats 降序排列（价格高的在前）
  const sorted = [...history].sort((a, b) => {
    const pa = a.plats ?? 0
    const pb = b.plats ?? 0
    if (pb !== pa)
      return pb - pa
    return 0
  })

  // 切分为每 15 个一列
  const columns: PrimedModHistoryItem[][] = []
  for (let i = 0; i < sorted.length; i += PMH_ITEMS_PER_COLUMN) {
    columns.push(sorted.slice(i, i + PMH_ITEMS_PER_COLUMN))
  }

  return (
    <div
      style={`
        border-radius: var(--wf-radius);
        padding: 16px;
        margin: 12px;
        border: 1px solid var(--wf-border);
        box-shadow: var(--wf-shadow-card);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 100%;
        min-width: 320px;
        background: var(--wf-bg-card);
        color: var(--wf-text-body);
      `}
    >
      {/* 标题 */}
      <div
        style={`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--wf-border);
        `}
      >
        <div style="display:flex;align-items:baseline;gap:8px;">
          <h1
            style={`
              font-size: 18px;
              font-weight: bold;
              margin: 0;
              color: var(--wf-text-primary);
            `}
          >
            Prime Mod 历史记录
          </h1>
          <span style="font-size:10px;color:var(--wf-text-faint);">
            {new Date().toLocaleString('zh-cn', { hour12: false })}
          </span>
        </div>
        <span style="color: var(--wf-text-muted); font-size: 11px;">
          {history.length}
          {' '}
          项
        </span>
      </div>

      {/* 多列网格 */}
      <div
        style={`
          display: flex;
          gap: ${PMH_GRID_GAP}px;
          align-items: flex-start;
        `}
      >
        {columns.map(col => (
          <div
            style={`
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 4px;
              min-width: 0;
            `}
          >
            {col.map((item, idx) => PMHCard(item, idx))}
          </div>
        ))}
      </div>
    </div>
  )
}
