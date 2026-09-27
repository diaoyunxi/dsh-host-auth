/**
 * @deepseek-ai/dsh-host-auth — HTTP Basic Auth Cordis 插件
 *
 * 提供 HTTP Basic Auth 验证和 401 响应生成的纯工具函数。
 * 这些函数被 [frontend-static](../frontend-static/README.md) 插件内部使用，
 * 在提供服务之前对 HTTP 请求强制执行身份验证。
 *
 * 凭据仅在服务器端验证——浏览器通过 HTTP Basic Auth 自动处理身份验证对话框。
 * 凭据永远不会出现在前端代码中。
 *
 * @security 重要安全提示：
 * - 必须通过环境变量或配置文件提供凭据，禁止在代码中硬编码
 * - 生产环境必须使用强密码（至少 16 字符，包含大小写、数字、特殊字符）
 * - 建议定期轮换凭据
 * - 考虑使用密钥管理服务（如 HashiCorp Vault）存储凭据
 *
 * ⚠️ **安全警告**: 默认凭据 `root:root` 仅供开发环境使用。
 * 生产部署**必须**通过配置修改为强密码，否则认证形同虚设。
 * 使用 `warnIfDefaultCredentials()` 在启动时检测并输出警告。
 *
 * @module @deepseek-ai/dsh-host-auth
 */

import type { Context } from '@deepseek-ai/cordis'

export { isAuthorized, sendUnauthorized } from './auth.js'

/** Stable Cordis plugin name. */
export const name = 'host-auth'

/** No services required; this plugin provides utilities only. */
export const inject: string[] = []

/** 默认凭据常量，用于检测是否仍在使用不安全的初始配置 */
const DEFAULT_USERNAME = 'root'
const DEFAULT_PASSWORD = 'root'

/**
 * 检查当前凭据是否为默认弱凭据，若是则输出安全警告。
 *
 * 调用方应在服务启动时调用此函数，确保生产环境不会意外使用
 * `root:root` 默认凭据，从而避免未授权访问风险。
 *
 * @param username - 当前配置的用户名
 * @param password - 当前配置的密码
 * @returns 如果使用的是默认凭据返回 true，否则返回 false
 *
 * @example
 * ```ts
 * import { warnIfDefaultCredentials } from '@deepseek-ai/dsh-host-auth'
 *
 * // 在 HTTP 服务启动前调用
 * warnIfDefaultCredentials(config.username, config.password)
 * ```
 */
export function warnIfDefaultCredentials(username: string, password: string): boolean {
  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    console.warn(
      '[dsh-host-auth] ⚠️  WARNING: Using default credentials (root:root). ' +
      'This is insecure and MUST be changed before production deployment. ' +
      'Configure custom username and password in your plugin settings.',
    )
    return true
  }
  return false
}

/**
 * Apply the host-auth plugin into the Cordis context.
 *
 * This plugin exports pure utility functions (`isAuthorized`, `sendUnauthorized`)
 * for use by other plugins. The `apply` function exists to make this package
 * loadable as a `dsh bundle` via `dsh plugin --profile web add`.
 *
 * @param ctx - The Cordis plugin context.
 */
export function apply(_ctx: Context): void {
  // no-op: utilities are exported directly; no services or tools to register
}
