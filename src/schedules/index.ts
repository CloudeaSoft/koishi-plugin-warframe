import type { Context } from 'koishi'

import type { PluginDependencies } from '../types/config'

import { setupPrimedModHistorySchedule } from './pmod-history'
import { setupWorldStateSchedule } from './world-state'

export function setupSchedules(ctx: Context, deps: PluginDependencies): void {
  setupWorldStateSchedule(ctx, deps)
  setupPrimedModHistorySchedule(ctx, deps)
}
