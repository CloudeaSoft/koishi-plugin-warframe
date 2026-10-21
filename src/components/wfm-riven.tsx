import type Element from '@satorijs/element'
import type { RivenAttributeShortInternal, RivenItem, RivenOrderInternal } from '../warframe'

const polarityViewBoxes: Record<string, string> = {
  madurai: '0 0 16.267 16.491',
  vazarin: '0 0 13.546 16.345',
  naramon: '0 0 18 18',
}

export function RivenOrderComponent(item: RivenItem, orders: RivenOrderInternal[]): Element {
  const name = item.i18n?.['zh-hans']?.name ?? item.i18n?.en?.name ?? item.slug
  return (
    <div class="wmr">
      <style>
        {`
        .wmr { box-sizing:border-box; width:600px; padding:20px; background:var(--wf-bg-page); color:var(--wf-text-primary); font-size:20px; line-height:1.4; }
        .wmr * { box-sizing:border-box; }
        .wmr .heading,.wmr .subtitle,.wmr .top,.wmr .seller { display:flex; justify-content:space-between; gap:12px; }
        .wmr .heading { align-items:baseline; }
        .wmr h1 { font-size:32px; overflow-wrap:anywhere; }
        .wmr .count { font-size:17px; flex-shrink:0; color:var(--wf-text-secondary); }
        .wmr .subtitle { font-size:16px; color:var(--wf-text-secondary); margin:5px 0 16px; }
        .wmr .subtitle span { min-width:0; overflow-wrap:anywhere; }
        .wmr .listing { padding:14px 16px 12px; margin-bottom:10px; background:var(--wf-bg-card); border-radius:12px; }
        .wmr .top { align-items:center; margin-bottom:10px; }
        .wmr .title { min-width:0; }
        .wmr .name { font-size:21px; font-weight:600; overflow-wrap:anywhere; }
        .wmr .name::first-letter { text-transform:uppercase; }
        .wmr .version { font-size:15px; color:var(--wf-text-secondary); margin-top:3px; overflow-wrap:anywhere; }
        .wmr .price { flex-shrink:0; font-size:30px; font-weight:700; color:var(--wf-platinum); font-variant-numeric:tabular-nums; }
        .wmr .price svg { width:0.65em; height:0.65em; margin-left:4px; fill:currentColor; vertical-align:baseline; }
        .wmr .attrs { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:6px 10px; }
        .wmr .attr { min-width:0; display:flex; align-items:baseline; gap:6px; padding:6px 8px; color:var(--wf-success); background:color-mix(in srgb,var(--wf-success) 6%,var(--wf-bg-card)); border-radius:5px; }
        .wmr .attr.negative { color:var(--wf-danger); background:color-mix(in srgb,var(--wf-danger) 7%,var(--wf-bg-card)); }
        .wmr .stat { min-width:0; flex:1; font-size:19px; overflow-wrap:anywhere; }
        .wmr .stat b { font-size:21px; font-weight:600; font-variant-numeric:tabular-nums; }
        .wmr .grade { position:relative; isolation:isolate; flex-shrink:0; margin-left:auto; text-align:right; white-space:nowrap; font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; color:var(--wf-text-secondary); }
        .wmr .grade::before { content:''; position:absolute; inset:-1px -4px; z-index:-1; border-radius:4px; background:var(--wf-border); }
        .wmr .grade.above { color:var(--wf-success); }
        .wmr .grade.below { color:var(--wf-danger); }
        .wmr .meta { display:flex; flex-wrap:wrap; align-items:center; gap:6px 16px; margin-top:10px; font-size:16px; color:var(--wf-text-secondary); }
        .wmr .polarity { display:inline-flex; align-items:center; gap:6px; }
        .wmr .polarity svg { width:1.1em; height:1.1em; fill:currentColor; }
        .wmr .seller { border-top:1px solid var(--wf-border); padding-top:9px; margin-top:9px; align-items:baseline; font-size:17px; }
        .wmr .seller-name { min-width:0; overflow-wrap:anywhere; }
        .wmr .reputation { display:inline-flex; align-items:center; gap:4px; white-space:nowrap; font-size:15px; margin-left:9px; }
        .wmr .reputation svg { width:1em; height:1em; fill:currentColor; }
        .wmr .status { flex-shrink:0; font-size:16px; }
      `}
      </style>
      <div class="heading">
        <h1>{name}</h1>
        <span class="count">
          {orders.length}
          条
        </span>
      </div>
      <div class="subtitle">
        <span>
          {item.i18n?.en?.name ?? item.slug}
          {' '}
          · Warframe Market
        </span>
        <span>价格从低到高</span>
      </div>
      {orders.map(order => RivenOrderItemComponent(order))}
    </div>
  )
}

function RivenOrderItemComponent(order: RivenOrderInternal): Element {
  const reputationColor = order.owner.reputation >= 5 ? 'var(--wf-success)' : 'var(--wf-text-muted)'
  const reputationIconLink = order.owner.reputation >= 5 ? '#icon-smile' : '#icon-meh'
  const status = order.owner.status === 'ingame'
    ? ['游戏中', 'var(--wf-success)']
    : order.owner.status === 'online'
      ? ['在线', 'var(--wf-platinum)']
      : order.owner.status === 'offline' ? ['离线', 'var(--wf-text-secondary)'] : ['未知', 'var(--wf-text-secondary)']
  const analysis = order.analysis
  const version = analysis
    ? `${analysis.name}${analysis.variant?.status === 'inferred' ? ' · 推测' : ''}`
    : '版本未确定 · 暂无评分'
  const polarityBox = polarityViewBoxes[order.item.polarity]
  return (
    <div class="listing">
      <div class="top">
        <div class="title">
          <div class="name">{order.item.name}</div>
          <div class="version">{version}</div>
        </div>
        <div class="price">
          {order.starting_price.toLocaleString('en-US')}
          <svg viewBox="0 0 215.535 215.535" aria-label="白金"><use href="#icon-platinum"></use></svg>
        </div>
      </div>
      <ul class="attrs">
        {[...order.item.attributes.filter(attr => attr.positive), ...order.item.attributes.filter(attr => !attr.positive)].map(RivenAttributeComponent)}
      </ul>
      <div class="meta">
        <span>
          段位
          {order.item.mastery_level}
        </span>
        <span>
          等级
          {order.item.mod_rank}
        </span>
        <span>
          循环
          {order.item.re_rolls}
        </span>
        <span class="polarity">
          极性
          {polarityBox
            ? <svg viewBox={polarityBox} aria-label={order.item.polarity}><use href={`#icon-${order.item.polarity}`}></use></svg>
            : '—'}
        </span>
      </div>
      <div class="seller">
        <span class="seller-name">
          {order.owner.ingame_name}
          <span class="reputation" style={`color:${reputationColor};`} aria-label={`好评 ${order.owner.reputation}`}>
            {order.owner.reputation}
            <svg viewBox="0 0 496 512" aria-hidden="true"><use href={reputationIconLink}></use></svg>
          </span>
        </span>
        <span class="status" style={`color:${status[1]};`}>
          ●
          {status[0]}
        </span>
      </div>
    </div>
  )
}

function RivenAttributeComponent(attr: RivenAttributeShortInternal): Element {
  const info = attr.attribute
  const name = info?.i18n?.['zh-hans']?.name ?? info?.i18n?.en?.name ?? attr.url_name
  const unit = info?.unit ?? ''
  const value = attr.displayValue ?? attr.value
  const formatted = unit === 'multiply' ? `×${value}` : `${value > 0 ? '+' : ''}${value}${unit === 'percent' ? '%' : unit === 'second' || unit === 'seconds' ? 's' : ''}`
  const grade = attr.grade !== undefined && Number.isFinite(attr.grade) ? Math.round(attr.grade * 1000) / 10 : undefined
  return (
    <li class={`attr${attr.positive ? '' : ' negative'}`}>
      <div class="stat">
        <b>{formatted}</b>
        {' '}
        <span>{name}</span>
      </div>
      <span class={`grade${grade !== undefined && grade !== 0 ? grade > 0 ? ' above' : ' below' : ''}`}>
        {grade === undefined ? '—' : `${grade >= 0 ? '+' : ''}${grade.toFixed(1)}%`}
      </span>
    </li>
  )
}
