export interface VoidTrader {
  expiry: string
  items: VoidTraderItem[]
}

export interface VoidTraderItem {
  name: string
  iconUrl?: string
  ducats: number
  credits: number
}
