import type { Element } from '@satorijs/element'
import type { AlertBoard } from '../../src/warframe'
import process from 'node:process'
import { AlertComponent } from '../../src/components/wf'
import { getAlerts } from '../../src/warframe'

// Reference preview entry for `yarn preview`. Prefers the live alert board so
// the screenshot shows real output; falls back to a fixture when no alert is
// active or the game API is unreachable (Cloud Agent egress is often blocked
// by api.warframe.com), so the entry always renders something reviewable.
const fixture: AlertBoard = {
  title: '警报',
  alerts: [
    {
      type: '拦截',
      node: {
        name: '乌戈塔',
        system: '虚空',
        type: '捕获',
        faction: '奥罗金',
        minLevel: 65,
        maxLevel: 70,
      },
      rewards: [
        { name: '电磁力场装置', count: 1 },
        { name: '12200 现金', count: 1 },
      ],
      remaining: '1小时0秒',
      expiry: Date.now() + 3_600_000,
    },
  ],
}

export default async function preview(): Promise<Element> {
  const live = await getAlerts()
  if (!live.ok) {
    process.stderr.write(`preview: live alerts unavailable (${live.error.code}), rendering fixture\n`)
  }
  return AlertComponent(live.ok ? live.data : fixture)
}
