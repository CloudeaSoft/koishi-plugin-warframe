import { createWfmApiClient } from "wfm-api-client";
import { Ducatnator } from "../../types/wfm/ducatnator";
import {
  ItemShort,
  RivenItem,
  StatisticsCollection,
} from "../../types/wfm/item";
import { OrderWithUser } from "../../types/wfm/order";
import { RivenAttribute, RivenOrder } from "../../types/wfm/riven";

const wfmClient = createWfmApiClient();

export const getWFMItemList = async (): Promise<ItemShort[] | undefined> => {
  return wfmClient.items.getList();
};

export const getWFMItemStatistics = async (
  itemId: string,
): Promise<StatisticsCollection | undefined> => {
  return wfmClient.items.getStatistics(itemId);
};

export const getWFMOrderList = async (
  itemId: string,
): Promise<OrderWithUser[] | undefined> => {
  return wfmClient.items.getOrders(itemId);
};

export const getWFMRivenItemList = async (): Promise<
  RivenItem[] | undefined
> => {
  return wfmClient.rivens.getItems();
};

export const getWFMRivenOrderList = async (
  itemId: string,
): Promise<RivenOrder[] | undefined> => {
  return wfmClient.rivens.getOrders(itemId);
};

export const getWFMRivenAttributeList = async (): Promise<
  RivenAttribute[] | undefined
> => {
  return wfmClient.rivens.getAttributes();
};

export const getWFMDucatnator = async (): Promise<
  | {
      day: Ducatnator[];
      hour: Ducatnator[];
    }
  | undefined
> => {
  return wfmClient.tools.getDucatnator();
};
