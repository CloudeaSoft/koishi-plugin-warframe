interface Order {
  id: string;
  type: string;
  platinum: number;
  quantity: number;
  perTrade: number;
  rank: number;
  charges: number;
  subtype: string;
  amberStars: number;
  cyanStars: number;
  vosfor: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  itemId: string;
}

interface OrderWithUser extends Order {
  user: UserShort;
}
