/**
 * HTTP Basic Auth 验证工具函数
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
/**
 * 验证请求的 Authorization 头是否匹配配置的凭据
 * @param req - HTTP 请求对象
 * @param username - 期望的用户名
 * @param password - 期望的密码
 * @returns 如果凭据匹配返回 true，否则返回 false
 */
export declare function isAuthorized(req: IncomingMessage, username: string, password: string): boolean;
/**
 * 发送 401 Unauthorized 响应，包含 WWW-Authenticate 头
 * @param res - HTTP 响应对象
 * @param realm - 认证域（默认为 "DeepSeek Harness"）
 */
export declare function sendUnauthorized(res: ServerResponse, realm?: string): void;
//# sourceMappingURL=auth.d.ts.map