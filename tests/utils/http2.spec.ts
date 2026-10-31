import type { Http2Session } from 'node:http2'
import type { AddressInfo } from 'node:net'
import { Buffer } from 'node:buffer'
import { once } from 'node:events'
import { createServer } from 'node:http2'
import { gzipSync } from 'node:zlib'
import { expect } from 'chai'
import { afterAll as after, beforeAll as before } from 'vitest'
import { fetchHttp2Text } from '../../src/warframe/utils/http'

describe('http/2 transport', () => {
  const server = createServer()
  const sessions = new Set<Http2Session>()
  let origin: string
  let requests = 0

  before(async () => {
    server.on('session', (session) => {
      sessions.add(session)
      session.on('close', () => sessions.delete(session))
    })
    server.on('stream', (stream, headers) => {
      requests++
      stream.on('error', () => {})
      if (headers[':path'] === '/stall') {
        stream.respond({ ':status': 200 })
        stream.write('{"data":')
        return
      }
      if (headers[':path'] === '/reset') {
        stream.respond({ ':status': 200 })
        // Flush a partial body, then force an error reset. close(code) also
        // ends the writable side and can deliver normal EOF before the reset.
        stream.write('{"data":', () => stream.destroy(new Error('Response interrupted')))
        return
      }
      if (headers[':path'] === '/denied') {
        stream.respond({ ':status': 403 })
        stream.end('challenge')
        return
      }
      if (headers[':path'] === '/gzip') {
        stream.respond({ ':status': 200, 'content-encoding': 'gzip' })
        stream.end(gzipSync('{"data":["压缩"]}'))
        return
      }
      const chunks: Buffer[] = []
      stream.on('data', chunk => chunks.push(chunk))
      stream.on('end', () => {
        stream.respond({ ':status': 200 })
        stream.end(JSON.stringify({
          path: headers[':path'],
          method: headers[':method'],
          language: headers.language,
          ua: headers['user-agent'],
          body: Buffer.concat(chunks).toString(),
        }))
      })
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  after(async () => {
    for (const session of sessions) {
      session.destroy()
    }
    await new Promise<void>(resolve => server.close(() => resolve()))
  })

  it('preserves method, body, query and client headers over HTTP/2', async () => {
    const result = await fetchHttp2Text(`${origin}/echo?language=zh-hans`, {
      method: 'POST',
      headers: { 'Language': 'zh-hans', 'User-Agent': 'test-client' },
      body: '{"text":"中文"}',
    })
    expect(result?.status).to.equal(200)
    expect(JSON.parse(result!.body)).to.deep.equal({
      path: '/echo?language=zh-hans',
      method: 'POST',
      language: 'zh-hans',
      ua: 'test-client',
      body: '{"text":"中文"}',
    })
  })

  it('preserves non-success HTTP responses for the API client', async () => {
    expect(await fetchHttp2Text(`${origin}/denied`)).to.deep.equal({ status: 403, body: 'challenge' })
  })

  it('decodes a compressed response before exposing its text', async () => {
    expect(await fetchHttp2Text(`${origin}/gzip`)).to.deep.equal({ status: 200, body: '{"data":["压缩"]}' })
  })

  it('times out even when headers and a partial body have arrived', async () => {
    const start = Date.now()
    expect(await fetchHttp2Text(`${origin}/stall`, { timeoutMs: 100 })).to.equal(undefined)
    expect(Date.now() - start).to.be.lessThan(1000)
  })

  it('discards a reset partial response', async () => {
    expect(await fetchHttp2Text(`${origin}/reset`)).to.equal(undefined)
  })

  it('does not connect for a request already cancelled by its caller', async () => {
    const count = requests
    expect(await fetchHttp2Text(`${origin}/echo`, { signal: AbortSignal.abort() })).to.equal(undefined)
    expect(requests).to.equal(count)
  })

  it('cancels an in-flight body and releases the HTTP/2 session', async () => {
    const controller = new AbortController()
    const request = fetchHttp2Text(`${origin}/stall`, { signal: controller.signal })
    const [stream] = await once(server, 'stream')
    const sessionClosed = once(stream.session, 'close')
    controller.abort()
    expect(await request).to.equal(undefined)
    await sessionClosed
  })
})
