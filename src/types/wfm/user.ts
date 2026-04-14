interface Activity {
  type: string;
  details: string;
  startedAt: string;
}

export interface UserShort {
  id: string;
  ingameName: string;
  avatar: string;
  reputation: number;
  locale: string;
  platform: string;
  crossplay: boolean;
  status: string | "offline" | "online" | "ingame";
  activity: Activity;
  lastSeen: string;
}
