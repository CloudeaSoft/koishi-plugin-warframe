import type { PluginDependencies } from '../types/config'
import { HotRivenComponent } from '../components/miscs'
import { getHotRivenWeapons } from '../services'

export function createMiscsCommands(deps: PluginDependencies): {
  hotRivenCommand: () => Promise<string>
} {
  const { render } = deps

  return {
    hotRivenCommand: async (): Promise<string> => {
      const result = await getHotRivenWeapons()
      if (!result.ok) {
        return result.message
      }

      return render(
        HotRivenComponent(result.data),
      )
    },
  }
}
