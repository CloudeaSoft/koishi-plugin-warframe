import type { Argv, Element } from 'koishi'
import type { PluginDependencies } from '../types/config'
import { generateImageElementOutput } from '../components/render'
import {
  ItemOrderComponent,
  PrimedModHistoryComponent,
  RivenOrderComponent,
} from '../components/wfm'
import { t } from '../i18n'
import { wmMessage } from '../messages/wfm'
import {
  getItemOrders,
  getRivenOrders,
  primedModHistory,
  updateCache,
} from '../warframe'

export function createWfmCommands(deps: PluginDependencies): {
  wmCommand: (_action: Argv, input: string) => Promise<Element | string>
  wmiCommand: (_action: Argv, input: string) => Promise<Element | string>
  wmrCommand: (_action: Argv, input: string) => Promise<string>
  wmuCommand: (_action: Argv, _input: string) => Promise<string>
  pmodhistoryCommand: (_action: Argv, _input: string) => Promise<string>
} {
  const { render } = deps

  async function itemOrdersCommand(
    _action: Argv,
    input: string,
    includeWhispers: boolean,
  ): Promise<Element | string> {
    const result = await getItemOrders(input)
    if (!result.ok) {
      return t(result)
    }

    if (!_action.session?.app.puppeteer) {
      return render(ItemOrderComponent(result.data.item, result.data.orders, result.data.statistics))
    }

    const component = await generateImageElementOutput(_action.session?.app.puppeteer, ItemOrderComponent(result.data.item, result.data.orders, result.data.statistics))

    return wmMessage(component, result.data.item, result.data.orders, result.data.statistics, includeWhispers)
  }

  return {
    wmCommand: async (_action: Argv, input: string) => {
      return itemOrdersCommand(_action, input, false)
    },

    wmiCommand: async (_action: Argv, input: string) => {
      return itemOrdersCommand(_action, input, true)
    },

    wmrCommand: async (_action: Argv, input: string) => {
      const result = await getRivenOrders(input)
      if (!result.ok) {
        return t(result)
      }

      return render(RivenOrderComponent(result.data.item, result.data.orders))
    },

    wmuCommand: async (_action: Argv, _input: string) => {
      return updateCache()
    },

    pmodhistoryCommand: async (_action: Argv, _input: string) => {
      const history = await primedModHistory.get()
      return render(PrimedModHistoryComponent(history))
    },
  }
}
