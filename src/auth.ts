/**
 * HTTP Basic Auth 验证工具函数
 * 
 * @security 安全注意事项：
 * - 使用恒定时间比较防止时序攻击（已实现）
 * - 必须通过环境变量提供凭据，禁止硬编码
 * - 生产环境必须使用强密码
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { timingSafeEqual } from 'node:crypto'

/**
 * 验证请求的 Authorization 头是否匹配配置的凭据
 * 
 * @param req - HTTP 请求对象
 * @param username - 期望的用户名（应从环境变量读取）
 * @param password - 期望的密码（应从环境变量读取）
 * @returns 如果凭据匹配返回 true，否则返回 false
 * 
 * @security 使用 timingSafeEqual 进行恒定时间比较，防止时序攻击
 */
// ---------------------------------------------------------------------------
// Rate limiting (CWE-307)
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10
const _attempts = new Map<string, { count: number; resetAt: number }>()

function _isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = _attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    _attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

export function isAuthorized(req: IncomingMessage, username: string, password: string): boolean {
  // Rate limit check
  const clientIp = (req.socket?.remoteAddress ?? 'unknown')
  if (_isRateLimited(clientIp)) return false

  const authHeader = req.headers.authorization
  if (authHeader === undefined) return false
  // HTTP Basic Auth: "Basic base64(username:password)"
  if (!authHeader.startsWith('Basic ')) return false
  const encoded = authHeader.slice(6)
  let decoded: string
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8')
  } catch {
    return false
  }
  const colonIndex = decoded.indexOf(':')
  if (colonIndex === -1) return false
  const providedUsername = decoded.slice(0, colonIndex)
  const providedPassword = decoded.slice(colonIndex + 1)
  
  // 使用恒定时间比较防止时序攻击
  const usernameMatch = timingSafeEqual(
    Buffer.from(providedUsername),
    Buffer.from(username)
  )
  const passwordMatch = timingSafeEqual(
    Buffer.from(providedPassword),
    Buffer.from(password)
  )
  
  return usernameMatch && passwordMatch
}

/**
 * 发送 401 Unauthorized 响应，包含 WWW-Authenticate 头
 * @param res - HTTP 响应对象
 * @param realm - 认证域（默认为 "DeepSeek Harness"）
 */
export function sendUnauthorized(res: ServerResponse, realm: string = 'DeepSeek Harness'): void {
  res.writeHead(401, {
    'content-type': 'text/plain; charset=utf-8',
    'www-authenticate': `Basic realm="${realm}"`,
  })
  res.end('Authorization required')
}
