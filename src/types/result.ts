import type { MessageKey, MessageParams } from '../messages'

export interface ServiceFailure {
  ok: false
  message: MessageKey
  params?: MessageParams
}

export type ServiceResult<TData>
  = | { ok: true, data: TData }
    | ServiceFailure
