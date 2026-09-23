# 安全策略

## 报告安全漏洞

如果你发现了安全漏洞，请通过以下方式报告：

1. **请勿**在公开的 GitHub Issue 中报告安全漏洞
2. 请通过 GitHub 的 [Security Advisories](https://github.com/diaoyunxi/dsh-host-auth/security/advisories/new) 页面提交报告

## 安全范围

以下属于本项目的安全关注点：

- HTTP Basic Auth 凭据比较（时序攻击 CWE-208）
- WWW-Authenticate 头注入（CWE-113）
- 默认凭据安全（CWE-798）
- Base64 解码异常处理
- 认证绕过向量
