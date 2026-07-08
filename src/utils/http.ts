import type {
  FetchError,
  MappedResponseType,
  ResponseType,
} from 'ofetch'
import {

  ofetch,

} from 'ofetch'
import { logger } from './logger'

const defaultHeaders = {
  'Accept': 'text/html,application/json;q=0.9,image/*;q=0.8,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Language': 'zh-hans',
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'

async function request<T, R extends ResponseType>(
  url: string,
  method: HttpMethod,
  responseType: R,
): Promise<MappedResponseType<R, T> | undefined> {
  try {
    return await ofetch<T, R>(url, {
      method,
      headers: defaultHeaders,
      responseType,
      timeout: 10_000,
      retry: 3,
      retryDelay: 500,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
    })
  }
  catch (err) {
    const e = err as FetchError
    const status = e.statusCode ?? 'network'
    const detail
      = e.data && typeof e.data === 'object'
        ? JSON.stringify(e.data)
        : ((e.data as string | undefined) ?? e.message ?? '')
    logger.error(`[HTTP] ${method} ${url} -> ${status} ${detail}`.trimEnd())
    return undefined
  }
}

export async function fetchAsyncText(
  url: string,
  method: HttpMethod = 'GET',
): Promise<string | undefined> {
  return request<string, 'text'>(url, method, 'text')
}

export async function fetchAsyncData<T>(
  url: string,
  method: HttpMethod = 'GET',
): Promise<T | undefined> {
  return request<T, 'json'>(url, method, 'json')
}

export async function fetchAsyncImage(
  url: string,
  method: HttpMethod = 'GET',
): Promise<Blob | undefined> {
  return request<Blob, 'blob'>(url, method, 'blob')
}
