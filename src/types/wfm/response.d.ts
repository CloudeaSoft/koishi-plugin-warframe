interface WFMResponse<TData> {
  apiVersion: string;
  data: TData;
  error: any | null;
}

interface WFMResponseV1<TPayload> {
  payload: TPayload;
}

interface Auction<TAuction> {
  auctions: TAuction[];
}
