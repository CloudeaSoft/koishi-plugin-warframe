import type { ClientHttp2Session, ClientHttp2Stream } from 'node:http2'
import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import * as http2 from 'node:http2'
import { expect } from 'chai'
import { afterEach, vi } from 'vitest'
import { fetchHttp2Text } from '../../src/warframe/utils/http'

vi.mock('node:http2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:http2')>()
  return { ...actual, connect: vi.fn() }
})

describe('http/2 response completion ordering', () => {
  afterEach(() => vi.resetAllMocks())

  it('rejects a reset reported after the readable end event', async () => {
    // CI can deliver readable EOF before the stream finalizes its reset code.
    // Drive this public event order explicitly instead of relying on OS timing.
    const stream = Object.assign(new EventEmitter(), {
      rstCode: 0,
      end() {},
      close() {},
    })
    const session = Object.assign(new EventEmitter(), {
      request: () => stream,
      destroy() {},
    })
    vi.mocked(http2.connect).mockReturnValue(session as unknown as ClientHttp2Session)

    const result = fetchHttp2Text('https://api.warframe.market/v2/items')
    session.emit('connect')
    stream.emit('response', { ':status': 200 })
    stream.emit('data', Buffer.from('{"data":'))
    stream.emit('end')
    stream.rstCode = http2.constants.NGHTTP2_INTERNAL_ERROR
    stream.emit('close')

    expect(await result).to.equal(undefined)
  })

  it('does not accept a closed stream without readable completion', async () => {
    const stream = Object.assign(new EventEmitter(), {
      rstCode: 0,
      end() {},
      close() {},
    }) as unknown as ClientHttp2Stream
    const session = Object.assign(new EventEmitter(), {
      request: () => stream,
      destroy() {},
    })
    vi.mocked(http2.connect).mockReturnValue(session as unknown as ClientHttp2Session)

    const result = fetchHttp2Text('https://api.warframe.market/v2/items')
    session.emit('connect')
    stream.emit('response', { ':status': 200 })
    stream.emit('data', Buffer.from('{"data":'))
    stream.emit('close')

    expect(await result).to.equal(undefined)
  })
})
