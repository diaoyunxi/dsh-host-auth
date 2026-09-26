/**
 * HTTP Basic Auth 验证工具函数
 *
 * 安全说明：凭据比较使用 `crypto.timingSafeEqual()` 进行恒定时间比较，
 * 防止通过响应时间差异逐字符猜测用户名或密码的时序攻击 (CWE-208)。
 */

import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * 恒定时间字符串比较，防止时序攻击
 * 两个字符串长度不同时仍执行完整比较（不提前短路），返回值语义与 `===` 一致
 */
function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  // 长度不同时不能直接调用 timingSafeEqual（会抛异常），
  // 但仍对较长 buffer 做一次完整比较以消耗等量时间，最终返回 false
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA) // 恒定时间占位，保持时间特征一致
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

/**
 * 验证请求的 Authorization 头是否匹配配置的凭据
 * @param req - HTTP 请求对象
 * @param username - 期望的用户名
 * @param password - 期望的密码
 * @returns 如果凭据匹配返回 true，否则返回 false
 */
export function isAuthorized(req: IncomingMessage, username: string, password: string): boolean {
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
  return secureCompare(providedUsername, username) && secureCompare(providedPassword, password)
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
