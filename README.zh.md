# @deepseek-ai/dsh-host-auth

DeepSeek Harness Web GUI 的 HTTP Basic Auth 工具包，支持绑定限制解除和信任域名绕过认证。

## 概述

本包提供以下功能：

1. **HTTP Basic Auth 工具函数** — 用于凭据验证和 401 响应生成
2. **绑定限制解除** — 允许 `0.0.0.0` 主机绑定（原本被限制）
3. **信任域名绕过** — 从信任的域名访问时跳过认证

凭据仅在服务器端验证——浏览器通过 HTTP Basic Auth 自动处理身份验证对话框。
凭据永远不会出现在前端代码中。

默认凭据：`username=root`，`password=root`。

## API

### `isAuthorized(req, username, password): boolean`

验证请求的 `Authorization` 头是否匹配配置的凭据。

```typescript
import { isAuthorized } from '@deepseek-ai/dsh-host-auth'

const authorized = isAuthorized(req, 'root', 'root')
```

### `sendUnauthorized(res, realm?): void`

发送包含 `WWW-Authenticate` 头的 401 Unauthorized 响应。

```typescript
import { sendUnauthorized } from '@deepseek-ai/dsh-host-auth'

sendUnauthorized(res, 'DeepSeek Harness')
```

### `isTrustedHost(req, trustedHosts): boolean`

检查请求是否来自信任的主机。

```typescript
import { isTrustedHost } from '@deepseek-ai/dsh-host-auth'

const isTrusted = isTrustedHost(req, ['example.com', '*.mydomain.com'])
```

## 配置

### 信任域名绕过认证

配置 `trustedHosts` 后，来自这些域名的请求将完全跳过认证。适用于希望无需 token/cookie 交换即可访问 Web GUI 的公开部署场景。

```yaml
# 在 cordis.patch.yml 或插件配置中
- insert:
    - id: host-auth
      name: '@deepseek-ai/dsh-host-auth'
      config:
        trustedHosts:
          - "mydomain.com"          # 精确匹配
          - "*.example.com"         # 通配符匹配
          - "192.168.1.100"         # IP 地址
```

支持的格式：
- 精确域名：`"example.com"`
- 通配符：`"*.example.com"`（匹配任意子域名）
- IP 地址：`"192.168.1.1"`
- 带端口：`"example.com:8080"`

### 插件选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trustedHosts` | `string[]` | `[]` | 跳过认证的信任主机列表 |
| `forceHostZero` | `boolean` | `true` | 强制绑定到 `0.0.0.0` |

## 安全说明

- 当配置了 `trustedHosts` 时，来自这些主机的请求将跳过**所有**认证
- 凭据在组合时硬编码；更改它们需要重新构建 bundle
- 对于生产部署，建议使用环境变量或密钥管理器
- 此实现使用简单字符串比较；对于高安全要求，请使用恒定时间比较
- `0.0.0.0` 绑定允许全网访问——请确保已配置适当的防火墙规则

## 在 frontend-static 中的使用

挂载 `frontend-static` 并启用认证：

```typescript
ctx.plugin(FrontendStatic, {
  distIndex: '/path/to/index.html',
  auth: { username: 'root', password: 'root' }
})
```

## 安装

```bash
dsh plugin --profile web add @deepseek-ai/dsh-host-auth
```

## 版本历史

- `0.2.0-rc.1` — 新增绑定限制解除和信任域名绕过认证功能
- `0.1.0-rc.8` — 新增 dsh.bundle 支持 Cordis 插件格式
