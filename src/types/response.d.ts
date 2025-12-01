interface WFMResponse<TData> {
  apiVersion: string;
  data: TData;
  error: any | null;
}
