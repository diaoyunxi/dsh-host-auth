/**
 * HTTP Basic Auth 验证工具函数
 */
/**
 * 验证请求的 Authorization 头是否匹配配置的凭据
 * @param req - HTTP 请求对象
 * @param username - 期望的用户名
 * @param password - 期望的密码
 * @returns 如果凭据匹配返回 true，否则返回 false
 */
export function isAuthorized(req, username, password) {
    const authHeader = req.headers.authorization;
    if (authHeader === undefined)
        return false;
    // HTTP Basic Auth: "Basic base64(username:password)"
    if (!authHeader.startsWith('Basic '))
        return false;
    const encoded = authHeader.slice(6);
    let decoded;
    try {
        decoded = Buffer.from(encoded, 'base64').toString('utf8');
    }
    catch {
        return false;
    }
    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1)
        return false;
    const providedUsername = decoded.slice(0, colonIndex);
    const providedPassword = decoded.slice(colonIndex + 1);
    return providedUsername === username && providedPassword === password;
}
/**
 * 发送 401 Unauthorized 响应，包含 WWW-Authenticate 头
 * @param res - HTTP 响应对象
 * @param realm - 认证域（默认为 "DeepSeek Harness"）
 */
export function sendUnauthorized(res, realm = 'DeepSeek Harness') {
    res.writeHead(401, {
        'content-type': 'text/plain; charset=utf-8',
        'www-authenticate': `Basic realm="${realm}"`,
    });
    res.end('Authorization required');
}
//# sourceMappingURL=auth.js.map