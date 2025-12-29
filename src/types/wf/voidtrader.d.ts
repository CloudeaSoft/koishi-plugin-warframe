interface VoidTrader {
  expiry: string;
  items: VoidTraderItem[];
}

interface VoidTraderItem {
  name: string;
  ducats: number;
  credits: number;
}
