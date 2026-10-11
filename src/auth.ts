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

// Token 最大有效时间 (1小时)，防止过期 token 被重放
const MAX_TOKEN_AGE_SECONDS = 3600;

/**
 * 恒定时间比较两个字符串，即使长度不同也不会泄漏长度信息
 * 
 * @security 当长度不同时，仍然进行完整比较以避免时序泄漏
 */
function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // 长度不同时，使用较长 buffer 与自身比较（恒定时间返回 false）
  // 这避免了 timingSafeEqual 在长度不同时立即返回导致的信息泄漏
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA) // 消耗相同时间
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

/**
 * 验证请求的 Authorization 头是否匹配配置的凭据
 * 
 * @param req - HTTP 请求对象
 * @param username - 期望的用户名（应从环境变量读取）
 * @param password - 期望的密码（应从环境变量读取）
 * @returns 如果凭据匹配返回 true，否则返回 false
 * 
 * @security 使用恒定时间比较防止时序攻击
 */
// ---------------------------------------------------------------------------
// Rate limiting (CWE-307)
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10
/** Map 条目上限，超过后清理过期条目防止内存无限增长 (CWE-770) */
const MAX_ATTEMPT_ENTRIES = 1000
const _attempts = new Map<string, { count: number; resetAt: number }>()

/**
 * 清理已过期的速率限制条目。
 * 当 Map 大小超过 MAX_ATTEMPT_ENTRIES 时触发，防止长期运行后内存泄漏。
 */
function _cleanupExpiredAttempts(): void {
  if (_attempts.size <= MAX_ATTEMPT_ENTRIES) return
  const now = Date.now()
  for (const [ip, entry] of _attempts) {
    if (now > entry.resetAt) {
      _attempts.delete(ip)
    }
  }
}

function _isRateLimited(ip: string): boolean {
  _cleanupExpiredAttempts()
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
  
  // 使用恒定时间比较防止时序攻击（含长度保护）
  const usernameMatch = constantTimeEqual(providedUsername, username)
  const passwordMatch = constantTimeEqual(providedPassword, password)
  
  return usernameMatch && passwordMatch
}

/**
 * 向客户端发送 401 Unauthorized 响应，附带 WWW-Authenticate 头触发浏览器登录弹窗
 *
 * @param res - HTTP 响应对象
 * @param realm - HTTP Basic Auth realm 名称，默认 "dsh-host-auth"
 *
 * @security realm 参数会拼入响应头，注意防止 header injection
 */
export function sendUnauthorized(res: ServerResponse, realm = 'dsh-host-auth'): void {
  // 校验 realm 不含换行符，防止 HTTP header injection (CWE-113)
  const safeRealm = realm.replace(/[\r\n]/g, '')
  res.writeHead(401, {
    'WWW-Authenticate': `Basic realm="${safeRealm}", charset="UTF-8"`,
    'Content-Type': 'text/plain; charset=utf-8',
  })
  res.end('401 Unauthorized')
}
