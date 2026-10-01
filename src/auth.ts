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
 * 恒定时间比较两个字符串是否相等
 *
 * @param a - 待比较字符串 A
 * @param b - 待比较字符串 B
 * @returns 两个字符串是否相等
 *
 * @security Node 的 timingSafeEqual 在两个 Buffer 长度不一致时会抛出 RangeError。
 * 因此这里先比较字节长度，长度不同则直接返回 false：
 * 长度不同本身即说明内容不匹配，且提前返回只泄露长度信息（长度对凭据校验无关紧要），
 * 对相同长度的比较仍走恒定时间路径，恒定时间语义依然成立，
 * 同时避免未捕获异常导致的 500 / 进程崩溃（DoS）。
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // 长度不一致时直接判定为不匹配，避免 timingSafeEqual 抛出 RangeError
  if (bufA.byteLength !== bufB.byteLength) return false
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
 * @security 使用 timingSafeEqual 进行恒定时间比较，防止时序攻击
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
  
  // 使用恒定时间比较防止时序攻击（safeEqual 已处理长度不一致的情况，避免抛异常）
  const usernameMatch = safeEqual(providedUsername, username)
  const passwordMatch = safeEqual(providedPassword, password)
  
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
