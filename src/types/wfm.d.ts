import type {
  RivenAttribute,
  RivenOrder,
} from "wfm-api-client";

export type {
  Ducatnator,
  ItemShort,
  OrderWithUser,
  RivenAttribute,
  RivenAttributeUnit,
  RivenItem,
  RivenOrder,
  StatisticsCollection,
  WFMLang,
} from "wfm-api-client";

export interface PrimedModHistoryItem {
  name: string | undefined;
  last: string;
  plats?: number;
}

export type RivenAttributeShortInternal =
  RivenOrder["item"]["attributes"][number] & {
    attribute: RivenAttribute;
  };

export type RivenOrderInternal = Omit<RivenOrder, "item"> & {
  item: Omit<RivenOrder["item"], "attributes"> & {
    attributes: RivenAttributeShortInternal[];
  };
};
