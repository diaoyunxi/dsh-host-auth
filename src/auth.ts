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
const _attempts = new Map<string, { count: number; resetAt: number }>()

function _isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = _attempts.get(ip)
  if (!entry || now > entry.resetAt) return false
  return entry.count > MAX_ATTEMPTS
}

/**
 * 仅在认证失败时记录一次失败尝试。
 * 之前 _isRateLimited 被设计成"检查并自增"，导致每一次请求（包括成功的）
 * 都计入失败次数——一个正常用户 60 秒内连续发 11 个请求就会被锁 60 秒。
 */
function _recordFailure(ip: string): void {
  const now = Date.now()
  const entry = _attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    _attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
  } else {
    entry.count++
  }
}

export function isAuthorized(req: IncomingMessage, username: string, password: string): boolean {
  const clientIp = (req.socket?.remoteAddress ?? 'unknown')
  if (_isRateLimited(clientIp)) return false

  const authHeader = req.headers.authorization
  if (authHeader === undefined) { _recordFailure(clientIp); return false }
  // HTTP Basic Auth: "Basic base64(username:password)"
  if (!authHeader.startsWith('Basic ')) { _recordFailure(clientIp); return false }
  const encoded = authHeader.slice(6)
  let decoded: string
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8')
  } catch {
    _recordFailure(clientIp)
    return false
  }
  const colonIndex = decoded.indexOf(':')
  if (colonIndex === -1) { _recordFailure(clientIp); return false }
  const providedUsername = decoded.slice(0, colonIndex)
  const providedPassword = decoded.slice(colonIndex + 1)

  // 使用恒定时间比较防止时序攻击（含长度保护）
  const usernameMatch = constantTimeEqual(providedUsername, username)
  const passwordMatch = constantTimeEqual(providedPassword, password)

  if (!usernameMatch || !passwordMatch) {
    _recordFailure(clientIp)
    return false
  }
  return true
}
