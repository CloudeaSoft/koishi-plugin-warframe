import type { PluginDependencies } from '../types/config'
import { HotRivenComponent } from '../components/miscs'
import { t } from '../i18n'
import { getHotRivenWeapons } from '../warframe'

export function inDevelopment(): string {
  return t('miscs.inDevelopment')
}

export function createMiscsCommands(deps: PluginDependencies): {
  hotRivenCommand: () => Promise<string>
  inDevelopment: () => string
} {
  const { render } = deps

  return {
    inDevelopment,

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
