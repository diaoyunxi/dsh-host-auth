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
 * 默认凭据: username=`root`, password=`root`
 *
 * @module @deepseek-ai/dsh-host-auth
 */
import type { Context } from '@deepseek-ai/cordis';
export { isAuthorized, sendUnauthorized } from './auth.js';
/** Stable Cordis plugin name. */
export declare const name = "host-auth";
/** No services required; this plugin provides utilities only. */
export declare const inject: string[];
/**
 * Apply the host-auth plugin into the Cordis context.
 *
 * This plugin exports pure utility functions (`isAuthorized`, `sendUnauthorized`)
 * for use by other plugins. The `apply` function exists to make this package
 * loadable as a `dsh bundle` via `dsh plugin --profile web add`.
 *
 * @param ctx - The Cordis plugin context.
 */
export declare function apply(_ctx: Context): void;
//# sourceMappingURL=index.d.ts.map