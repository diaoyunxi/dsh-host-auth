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
 * @module @deepseek-ai/dsh-host-auth
 */

import type { Context } from '@deepseek-ai/cordis'

export { isAuthorized, sendUnauthorized } from './auth.js'

/** Stable Cordis plugin name. */
export const name = 'host-auth'

/** No services required; this plugin provides utilities only. */
export const inject: string[] = []

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
