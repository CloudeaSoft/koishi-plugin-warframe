import type { ClientHttp2Session, ClientHttp2Stream } from 'node:http2'
import type {
  MappedResponseType,
  ResponseType,
} from 'ofetch'
import { Buffer } from 'node:buffer'
import { connect } from 'node:http2'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'
import {

  ofetch,

} from 'ofetch'

const defaultHeaders = {
  'Accept': 'text/html,application/json;q=0.9,image/*;q=0.8,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Language': 'zh-hans',
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'

interface Http2TextResponse {
  status: number
  body: string
}

type Http2RequestOptions = Pick<RequestInit, 'method' | 'headers' | 'body' | 'signal'> & {
  timeoutMs?: number
}

/** Buffer the entire response within one deadline, including connection and body. */
export async function fetchHttp2Text(
  url: string,
  options: Http2RequestOptions = {},
): Promise<Http2TextResponse | undefined> {
  return new Promise((resolve) => {
    let session: ClientHttp2Session | undefined
    let stream: ClientHttp2Stream | undefined
    let settled = false
    const signal = options.signal
    const timer = setTimeout(finish, options.timeoutMs ?? 20_000)

    function finish(result?: Http2TextResponse): void {
      if (settled)
        return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      stream?.close()
      session?.destroy()
      resolve(result)
    }

    function abort(): void {
      finish()
    }

    if (signal?.aborted) {
      finish()
      return
    }
    signal?.addEventListener('abort', abort, { once: true })

    async function start(): Promise<void> {
      // Request serializes JSON strings, binary and multipart bodies consistently
      // with the upstream fetcher, including generated multipart content types.
      const request = new Request(url, options)
      const body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined
      if (settled)
        return
      const target = new URL(request.url)
      const headers = Object.fromEntries(request.headers)
      for (const name of ['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'host'])
        delete headers[name]
      // Keep the tested identity-encoded request; decode compression if a server
      // nevertheless returns it. No browser cookies or pinned edge IPs are used.
      headers['accept-encoding'] = 'identity'
      session = connect(target.origin)
      session.on('error', abort)
      session.on('close', abort)
      session.once('connect', () => {
        if (settled)
          return
        try {
          stream = session!.request({
            ...headers,
            ':method': request.method,
            ':path': target.pathname + target.search,
          })
          let status = 0
          let encoding: string | undefined
          const chunks: Buffer[] = []
          stream.on('response', (response) => {
            status = response[':status'] ?? 0
            encoding = response['content-encoding']
          })
          stream.on('data', (chunk: Buffer) => chunks.push(chunk))
          stream.on('error', abort)
          stream.on('aborted', abort)
          stream.on('close', abort)
          stream.on('end', () => {
            if (stream!.rstCode || !status) {
              finish()
              return
            }
            try {
              let data = Buffer.concat(chunks)
              if (encoding === 'gzip')
                data = gunzipSync(data)
              else if (encoding === 'br')
                data = brotliDecompressSync(data)
              else if (encoding === 'deflate')
                data = inflateSync(data)
              else if (encoding && encoding !== 'identity')
                throw new Error('Unsupported content encoding')
              finish({ status, body: data.toString('utf8') })
            }
            catch {
              finish()
            }
          })
          stream.end(body)
        }
        catch {
          finish()
        }
      })
    }

    void start().catch(abort)
  })
}

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
  catch {
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
