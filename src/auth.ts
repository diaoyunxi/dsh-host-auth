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
  
  const usernameBuf = Buffer.from(providedUsername)
  const expectedUsernameBuf = Buffer.from(username)
  const passwordBuf = Buffer.from(providedPassword)
  const expectedPasswordBuf = Buffer.from(password)
  
  // 安全恒定时间比较：先比较长度，不等长时仍执行 dummy 比较以保持恒定时间开销
  // 防止 timingSafeEqual 在长度不等时抛出 TypeError 导致进程崩溃 (DoS)
  const usernameLenMatch = usernameBuf.length === expectedUsernameBuf.length
  const passwordLenMatch = passwordBuf.length === expectedPasswordBuf.length
  
  // 长度不等时，将 provided 与 expected 进行 dummy 比较（耗时恒定），然后返回 false
  const usernameMatch = usernameLenMatch
    ? timingSafeEqual(usernameBuf, expectedUsernameBuf)
    : (timingSafeEqual(expectedUsernameBuf, expectedUsernameBuf), false)
  const passwordMatch = passwordLenMatch
    ? timingSafeEqual(passwordBuf, expectedPasswordBuf)
    : (timingSafeEqual(expectedPasswordBuf, expectedPasswordBuf), false)
  
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
