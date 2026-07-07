export interface UserShort {
  id: string;
  ingameName: string;
  avatar: string;
  reputation: number;
  locale: string;
  platform: string;
  crossplay: boolean;
  status: string | "offline" | "online" | "ingame";
  activity: {
    type: string;
    details: string;
    startedAt: string;
  };
  lastSeen: string;
}

export interface OrderWithUser {
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
  user: UserShort;
}
