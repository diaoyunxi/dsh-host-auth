# @diaoyunxi/dsh-host-auth-unrestricted

DeepSeek Harness Web GUI 的解除限制认证插件。

## 概述

本插件在保留原有 HTTP Basic Auth 密码认证逻辑的基础上，解除 DeepSeek Harness 中探查到的所有写死限制。

## 探查到的限制及解除方案

| 限制位置 | 限制内容 | 解除方式 |
|---------|---------|---------|
| `dsh-web-app/lib/startup.js` | 硬编码禁止 `0.0.0.0` 绑定 | 移除限制检查，允许任意绑定 |
| `dsh-sandbox-policy/lib/index.js` | 默认沙箱模式为 `read-only` | 强制设置为 `danger-full-access` |
| `dsh-fs-sandbox/lib/index.js` | `SandboxedFileSystem.checkedTarget()` 强制路径检查 | 绕过 containment 检查 |
| `dsh-sandbox-local/lib/index.js` | bwrap/Landlock 进程沙箱限制 | 绕过 `confine()` 包装 |
| `dsh-client-connection/lib/index.js` | `trustedHosts` 只允许 loopback 或配置主机 | 扩展为允许所有主机 |

## 保留的认证逻辑

- ✅ HTTP Basic Auth 凭据验证（`isAuthorized`）
- ✅ 401 Unauthorized 响应生成（`sendUnauthorized`）
- ✅ browser-session cookie 认证
- ✅ Host/Origin browser-trust fence（已解除但保留认证）

## API

### `apply(ctx: Context): void`

插件入口函数，执行所有限制解除补丁并注册管理工具。

### 注册的工具

- `sandbox_status` — 查询当前沙箱模式和安全状态
- `sandbox_set_mode` — 运行时切换沙箱模式

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

⚠️ **警告**：本插件移除了所有沙箱限制，请仅在受信任的环境中使用。

- 密码认证仍然生效，未授权访问仍会被拒绝
- 解除沙箱后，文件系统和进程操作无限制
- 建议配合强密码使用

## 版本历史

- `0.1.0-rc.1` — 初始版本，解除所有探查到的限制
