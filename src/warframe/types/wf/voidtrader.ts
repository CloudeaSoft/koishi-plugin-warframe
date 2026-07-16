export interface VoidTrader {
  expiry: string
  items: VoidTraderItem[]
}

export interface VoidTraderItem {
  name: string
  ducats: number
  credits: number
}
