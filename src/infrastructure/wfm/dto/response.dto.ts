export interface WFMResponse<TData> {
  apiVersion: string;
  data: TData;
  error: unknown | null;
}

export interface WFMResponseV1<TPayload> {
  payload: TPayload;
}

export interface Auction<TAuction> {
  auctions: TAuction[];
}
