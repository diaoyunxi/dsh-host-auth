/**
 * @deepseek-ai/dsh-host-auth — 客户端补丁插件
 *
 * 本插件解决公网访问时 settings 不可用的问题：
 * - 当通过非 loopback 地址访问时，DSH 会将 ctx.connection.isLoopback 设为 false
 * - 这导致 dsh-client-ui-settings 以 "memory" 模式启动，settings 不可用
 * - 本插件将 isLoopback 强制设为 true，使 settings 正常启用持久化
 */

import type { Context } from '@deepseek-ai/cordis'

// ============================================================================
// 客户端补丁：强制设置 isLoopback 为 true
//
// DSH 的客户端连接插件根据页面 URL 的 hostname 判断是否为 loopback 访问。
// 当通过公网（非 127.0.0.1/localhost）访问时，isLoopback 为 false，
// 导致 settings 包以 "memory" 模式启动，settings 和插件配置不可用。
//
// 本补丁在 settings 包初始化之前将 isLoopback 强制设为 true。
// ============================================================================

/**
 * 强制设置连接为 loopback 模式
 * @param ctx - Cordis 客户端上下文
 */
function patchLoopbackMode(ctx: Context): void {
  const connection = ctx.get('connection')
  if (!connection || typeof connection !== 'object') return

  const conn = connection as Record<string, unknown>

  // 强制设置 isLoopback 为 true
  // 注意：虽然类型定义中标记为 readonly，但运行时属性是可写的
  conn.isLoopback = true
}

// ============================================================================
// 插件入口
// ============================================================================

/** Stable Cordis plugin name. */
export const name = 'host-auth-client'

/** Services required by this plugin. */
export const inject: string[] = ['connection']

/**
 * Apply the client-side patch to enable settings on public networks.
 *
 * @param ctx - The Cordis client context.
 */
export function apply(ctx: Context): void {
  patchLoopbackMode(ctx)
}
