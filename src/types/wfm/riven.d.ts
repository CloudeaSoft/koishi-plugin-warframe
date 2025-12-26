interface Riven {
  polarity: string;
  mod_rank: number;
  re_rolls: number;
  attributes: RivenAttributeShort[];
  type: string;
  name: string;
  weapon_url_name: string;
  mastery_level: number;
}

interface RivenAttributeShort {
  value: number;
  positive: boolean;
  url_name: string;
}

type RivenAttributeUnit = "percent" | "multiply" | "seconds" | string;

interface RivenAttribute {
  id: string;
  slug: string;
  gameRef: string;
  group: string;
  prefix: string;
  suffix: string;
  exclusiveTo: Array<"shotgun" | "rifle" | "pistol" | "kitgun" | string>;
  positiveIsNegative: boolean;
  positiveOnly: boolean;
  negativeOnly: boolean;
  unit: RivenAttributeUnit;
  i18n: {
    [key: WFMLang]: {
      name: string;
      icon: string;
      thumb: string;
    };
  };
}

interface RivenOrder {
  buyout_price: number | null;
  visible: boolean;
  minimal_reputation: number;
  starting_price: number;
  note: string;
  platform: string;
  crossplay: boolean;
  closed: boolean;
  top_bid: number | null;
  is_marked_for: string | null;
  marked_operation_at: string | null;
  created: string;
  updated: string;
  note_raw: string;
  is_direct_sell: boolean;
  id: string;
  owner: RivenUser;
  winner: RivenUser | null;
  item: Riven;
  private: boolean;
}

interface RivenUser {
  reputation: number;
  platform: string;
  locale: string;
  avatar: string | null;
  last_seen: string;
  crossplay: boolean;
  ingame_name: string;
  slug: string;
  status: "offline" | "online" | "ingame" | string;
  id: string;
  region: string;
}
