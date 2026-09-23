# 贡献指南

感谢你对 dsh-host-auth 项目的关注！

## 开发环境

- **运行时：** Node.js 18+
- **语言：** TypeScript 5+
- **构建：** tsdown

## 安全注意事项

本项目处理 HTTP 认证功能，修改时请特别注意：

- 凭据比较使用 `crypto.timingSafeEqual`（防止时序攻击 CWE-208）
- `WWW-Authenticate` 头的 realm 参数需过滤 CR/LF（防止 HTTP 头注入 CWE-113）
- 默认凭据的安全警告
- Base64 解码的异常处理

## 代码规范

- TypeScript 严格模式
- 所有安全相关函数需有对应的单元测试
- 提交前运行 `npm run build` 和 `npm test`

## 提交 Pull Request

1. Fork 本仓库并创建功能分支
2. 确保编译通过且测试全部通过
3. 如涉及认证逻辑修改，请提供安全分析说明
4. 遵循 Conventional Commits 规范提交
