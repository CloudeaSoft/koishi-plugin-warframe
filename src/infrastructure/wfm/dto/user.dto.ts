interface ActivityDTO {
  type: string;
  details: string;
  startedAt: string;
}

export interface UserShortDTO {
  id: string;
  ingameName: string;
  avatar: string;
  reputation: number;
  locale: string;
  platform: string;
  crossplay: boolean;
  status: string | "offline" | "online" | "ingame";
  activity: ActivityDTO;
  lastSeen: string;
}
