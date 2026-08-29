# @deepseek-ai/dsh-host-auth

DeepSeek Harness Web GUI 的 HTTP Basic Auth 工具包。

## 概述

本包提供用于 HTTP Basic Auth 验证和 401 响应生成的纯工具函数。这些函数被
[`frontend-static`](../frontend-static/README.zh.md) 插件内部使用，
在提供服务之前对 HTTP 请求强制执行身份验证。

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

## 在 frontend-static 中的使用

挂载 `frontend-static` 并启用认证：

```typescript
ctx.plugin(FrontendStatic, {
  distIndex: '/path/to/index.html',
  auth: { username: 'root', password: 'root' }
})
```

## 安全说明

- 凭据在组合时硬编码；更改它们需要重新构建 bundle。
- 对于生产部署，建议使用环境变量或密钥管理器。
- 此实现使用简单字符串比较；对于高安全要求，请使用恒定时间比较。
