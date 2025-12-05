interface WFMResponse<TData> {
  apiVersion: string;
  data: TData;
  error: any | null;
}

interface WFMResponseV1<TData> {
  payload: Auction<TData>;
}

interface Auction<TData> {
  auctions: TData[];
}
