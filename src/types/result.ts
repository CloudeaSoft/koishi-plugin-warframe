export type ServiceResult<TData>
  = | { ok: true, data: TData }
    | { ok: false, message: string }
