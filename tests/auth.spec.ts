/**
 * @deepseek-ai/dsh-host-auth — 单元测试
 */

import { isAuthorized, sendUnauthorized } from '../src/auth.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'

describe('isAuthorized', () => {
  it('returns false when no Authorization header', () => {
    const req = { headers: {} } as unknown as IncomingMessage
    expect(isAuthorized(req, 'root', 'root')).toBe(false)
  })

  it('returns false for non-Basic auth header', () => {
    const req = { headers: { authorization: 'Bearer token' } } as unknown as IncomingMessage
    expect(isAuthorized(req, 'root', 'root')).toBe(false)
  })

  it('returns false for invalid base64 encoding', () => {
    const req = { headers: { authorization: 'Basic !!!invalid!!!' } } as unknown as IncomingMessage
    expect(isAuthorized(req, 'root', 'root')).toBe(false)
  })

  it('returns false when credentials do not match', () => {
    const encoded = Buffer.from('wrong:wrong').toString('base64')
    const req = { headers: { authorization: `Basic ${encoded}` } } as unknown as IncomingMessage
    expect(isAuthorized(req, 'root', 'root')).toBe(false)
  })

  it('returns true when credentials match', () => {
    const encoded = Buffer.from('root:root').toString('base64')
    const req = { headers: { authorization: `Basic ${encoded}` } } as unknown as IncomingMessage
    expect(isAuthorized(req, 'root', 'root')).toBe(true)
  })

  it('handles empty password correctly', () => {
    const encoded = Buffer.from('user:').toString('base64')
    const req = { headers: { authorization: `Basic ${encoded}` } } as unknown as IncomingMessage
    expect(isAuthorized(req, 'user', '')).toBe(true)
  })

  it('handles colon in password correctly', () => {
    const encoded = Buffer.from('user:pass:word').toString('base64')
    const req = { headers: { authorization: `Basic ${encoded}` } } as unknown as IncomingMessage
    expect(isAuthorized(req, 'user', 'pass:word')).toBe(true)
  })
})

describe('sendUnauthorized', () => {
  it('writes 401 status with WWW-Authenticate header', () => {
    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse

    sendUnauthorized(res)

    expect(res.writeHead).toHaveBeenCalledWith(401, {
      'content-type': 'text/plain; charset=utf-8',
      'www-authenticate': 'Basic realm="DeepSeek Harness"',
    })
    expect(res.end).toHaveBeenCalledWith('Authorization required')
  })

  it('accepts custom realm', () => {
    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse

    sendUnauthorized(res, 'Custom Realm')

    expect(res.writeHead).toHaveBeenCalledWith(401, {
      'content-type': 'text/plain; charset=utf-8',
      'www-authenticate': 'Basic realm="Custom Realm"',
    })
  })
})
