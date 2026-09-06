# @diaoyunxi/dsh-host-auth-unrestricted

DeepSeek Harness Web GUI 的解除绑定限制认证插件。

## 概述

本插件解除 DeepSeek Harness 中探查到的写死限制，并保留原有的认证逻辑。

## 探查到的限制及解除方案

| 限制位置 | 限制内容 | 解除方式 |
|---------|---------|---------|
| `dsh-web-app/lib/startup.js:40` | 硬编码禁止 `0.0.0.0` 绑定 | 移除限制检查，允许任意绑定 |

## 保留的认证逻辑

- ✅ HTTP Basic Auth 密码认证（`isAuthorized`, `sendUnauthorized`）
- ✅ browser-session token/cookie 认证流程
- ✅ 首次访问：URL 携带 `?token=<launch_token>`，服务器验证后设置 cookie 并重定向
- ✅ 后续访问：携带 cookie，服务器验证 cookie

## 认证流程说明

### 第一次访问

```
用户访问 http://<host>:<port>/
     ↓
服务器返回带 token 的 URL: http://<host>:<port>/?token=<launch_token>
     ↓
用户访问带 token 的 URL
     ↓
服务器验证 token，设置签名 cookie，重定向到清洁 URL
```

### 后续访问

```
用户访问 http://<host>:<port>/
     ↓
携带 cookie: dsh-auth-<authority_hash>=<signed_cookie>
     ↓
服务器验证 cookie，允许访问
```

## API

### `apply(ctx: Context): void`

插件入口函数，执行限制解除补丁并确保认证流程正常。

### 导出的认证函数

```typescript
import { isAuthorized, sendUnauthorized } from '@diaoyunxi/dsh-host-auth-unrestricted'

// 验证请求凭据
const authorized = isAuthorized(req, 'root', 'root')

// 发送 401 响应
sendUnauthorized(res, 'DeepSeek Harness')
```

## 安装

```bash
# 添加到 DSH 插件列表
dsh plugin --profile web add @diaoyunxi/dsh-host-auth-unrestricted
```

## 配置

在 `cordis.patch.yml` 中添加：

```yaml
- insert:
    - id: host-auth-unrestricted
      name: '@diaoyunxi/dsh-host-auth-unrestricted'
```

## 安全说明

- 密码认证仍然生效，未授权访问仍会被拒绝
- token/cookie 认证流程保持完整
- 解除绑定限制后，服务可被局域网内其他设备访问

## 版本历史

- `0.1.0-rc.1` — 初始版本，解除 0.0.0.0 绑定限制
