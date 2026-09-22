/**
 * HTTP Basic Auth 验证工具函数
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { timingSafeEqual } from 'node:crypto'

/**
 * 验证请求的 Authorization 头是否匹配配置的凭据
 * 使用 timingSafeEqual 防止时序攻击 (CWE-208)
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

  // 时序安全比较：防止攻击者通过响应时间差异逐字符猜测凭据
  const usernameMatch = timingSafeEqual(
    Buffer.from(providedUsername, 'utf8'),
    Buffer.from(username, 'utf8')
  )
  const passwordMatch = timingSafeEqual(
    Buffer.from(providedPassword, 'utf8'),
    Buffer.from(password, 'utf8')
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
