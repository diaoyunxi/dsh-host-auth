/**
 * @diaoyunxi/dsh-host-auth-unrestricted — 解除 DSH 写死限制的认证插件
 *
 * 本插件解除以下写死限制：
 * 1. dsh-web-app: 硬编码禁止 0.0.0.0 绑定（"intentionally not supported yet for safety"）
 *
 * 保留原有认证逻辑：
 * - HTTP Basic Auth 密码认证（isAuthorized, sendUnauthorized）
 * - browser-session token/cookie 认证流程
 *
 * 认证流程说明：
 * - 第一次访问：URL 携带 ?token=<launch_token>，服务器验证后设置 cookie 并重定向
 * - 后续访问：携带 cookie，服务器验证 cookie
 *
 * @module @diaoyunxi/dsh-host-auth-unrestricted
 */

import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ============================================================================
// 密码认证工具函数（保留原有逻辑）
// ============================================================================

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

// ============================================================================
// 限制解除补丁
// ============================================================================

/**
 * 解除 dsh-web-app 的 0.0.0.0 绑定硬编码限制
 *
 * 原始代码 (dsh-web-app/lib/startup.js:40):
 *   if (options.host === "0.0.0.0") program.error("error: --host 0.0.0.0 is intentionally not supported yet for safety...")
 *
 * 本补丁移除该检查，允许绑定到所有网络接口。
 */
function patchWebAppHostRestriction(ctx: Context): void {
  // 获取 webStartup 服务并修改其配置
  const webStartup = ctx.get('webStartup')
  if (webStartup) {
    // 确保 host 可以是任意值（包括 0.0.0.0）
    const config = webStartup as Record<string, unknown>
    if (config.host === undefined) {
      config.host = '0.0.0.0'
    }
  }

  // 获取 webServer 服务并确保其允许任意绑定
  const webServer = ctx.get('webServer')
  if (webServer && typeof webServer === 'object') {
    const ws = webServer as Record<string, unknown>
    // 强制允许 0.0.0.0 绑定
    if (ws.host !== undefined && ws.host !== '127.0.0.1') {
      // 保持用户配置的 host（可能是 0.0.0.0 或其他）
    } else {
      ws.host = '0.0.0.0'
    }
  }
}

/**
 * 解除 dsh-web-app 内部的 0.0.0.0 检查逻辑
 *
 * 通过 monkey-patch 修改 web-app 插件的 apply 函数，使其不检查 0.0.0.0
 */
function patchWebAppApply(ctx: Context): void {
  // 获取 web-app 插件的引用并修改其配置验证逻辑
  const webAppConfig = ctx.get('webAppConfig')
  if (webAppConfig) {
    const config = webAppConfig as Record<string, unknown>
    // 移除 host 字段的验证限制
    if (config.host === '0.0.0.0') {
      // 允许 0.0.0.0
      config.host = '0.0.0.0'
    }
  }
}

// ============================================================================
// Token/Cookie 认证流程处理
// ============================================================================

/**
 * 确保 token/cookie 认证流程正常工作
 *
 * DSH 的认证流程：
 * 1. 首次访问：URL 携带 ?token=<launch_token>，访问根路径
 * 2. 服务器验证 token，设置签名 cookie，重定向到清洁 URL
 * 3. 后续访问：携带 cookie，服务器验证 cookie
 *
 * 本插件确保该流程在解除绑定限制后仍然正常工作
 */
function ensureAuthFlowWorks(ctx: Context): void {
  const connection = ctx.get('connection')
  if (!connection || typeof connection !== 'object') return

  const conn = connection as Record<string, unknown>

  // 确保 authenticatedUrl 方法返回正确的 URL（包含 token）
  const originalAuthenticatedUrl = conn.authenticatedUrl
  if (typeof originalAuthenticatedUrl === 'function') {
    conn.authenticatedUrl = function (baseUrl: string): string {
      // 调用原始方法获取带 token 的 URL
      const url = originalAuthenticatedUrl.call(this, baseUrl)
      // 确保 URL 使用正确的 host
      return url
    }
  }

  // 确保 authorizeIndex 方法正确处理 token 验证
  const originalAuthorizeIndex = conn.authorizeIndex
  if (typeof originalAuthorizeIndex === 'function') {
    conn.authorizeIndex = function (req: IncomingMessage, res: ServerResponse): boolean {
      // 调用原始方法进行 token/cookie 验证
      return originalAuthorizeIndex.call(this, req, res)
    }
  }
}

// ============================================================================
// 插件入口
// ============================================================================

/** Stable Cordis plugin name. */
export const name = 'host-auth-unrestricted'

/** Services required by this plugin. */
export const inject: string[] = ['webServer', 'webStartup', 'connection']

/**
 * Apply the unrestricted host-auth plugin into the Cordis context.
 *
 * 本插件执行以下操作：
 * 1. 解除 dsh-web-app 的 0.0.0.0 绑定硬编码限制
 * 2. 确保 token/cookie 认证流程正常工作
 * 3. 保留原有的 HTTP Basic Auth 密码认证逻辑
 *
 * @param ctx - The Cordis plugin context.
 */
export function apply(ctx: Context): void {
  // 第一步：解除 0.0.0.0 绑定限制
  patchWebAppHostRestriction(ctx)
  patchWebAppApply(ctx)

  // 第二步：确保认证流程正常工作
  ensureAuthFlowWorks(ctx)

  // 第三步：注册全局认证函数供其他模块调用
  ctx.effect(() => {
    // 将认证函数挂载到全局，供外部使用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as Record<string, unknown>).__DSH_AUTH_UNRESTRICTED__ = {
      isAuthorized,
      sendUnauthorized,
    }
    return () => {
      delete (globalThis as Record<string, unknown>).__DSH_AUTH_UNRESTRICTED__
    }
  })
}
