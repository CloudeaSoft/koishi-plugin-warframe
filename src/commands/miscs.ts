import type { PluginDependencies } from '../types/config'
import { HotRivenComponent } from '../components/miscs'
import { t } from '../i18n'
import { getHotRivenWeapons } from '../warframe'

export function createMiscsCommands(deps: PluginDependencies): {
  hotRivenCommand: () => Promise<string>
} {
  const { render } = deps

  return {
    hotRivenCommand: async (): Promise<string> => {
      const result = await getHotRivenWeapons()
      if (!result.ok) {
        return t(result)
      }

      return render(
        HotRivenComponent(result.data),
      )
    },
  }
}
