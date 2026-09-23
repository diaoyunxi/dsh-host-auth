/**
 * HTTP Basic Auth 验证工具函数
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

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
  return providedUsername === username && providedPassword === password
}

/**
 * 净化 realm 字符串，防止 HTTP 头注入攻击 (CWE-113)。
 * 移除双引号、回车符、换行符等可破坏 HTTP 头结构的字符。
 * @param realm - 原始认证域字符串
 * @returns 净化后的安全字符串
 */
function sanitizeRealm(realm: string): string {
  // 移除双引号（会破坏 realm="..." 语法）和 CR/LF（会导致头注入）
  return realm.replace(/["\r\n]/g, '')
}

/**
 * 发送 401 Unauthorized 响应，包含 WWW-Authenticate 头
 * @param res - HTTP 响应对象
 * @param realm - 认证域（默认为 "DeepSeek Harness"）
 */
export function sendUnauthorized(res: ServerResponse, realm: string = 'DeepSeek Harness'): void {
  const safeRealm = sanitizeRealm(realm)
  res.writeHead(401, {
    'content-type': 'text/plain; charset=utf-8',
    'www-authenticate': `Basic realm="${safeRealm}"`,
  })
  res.end('Authorization required')
}
