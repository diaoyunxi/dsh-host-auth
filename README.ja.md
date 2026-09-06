# @diaoyunxi/dsh-host-auth-unrestricted

DeepSeek Harness Web GUI の制限解除認証プラグイン。

## 概要

本プラグインは、既存の HTTP Basic Auth パスワード認証ロジックを保持した上で、
DeepSeek Harness 内で検出されたすべてのハードコードされた制限を解除します。

## 検出された制限と解除方法

| 制限箇所 | 制限内容 | 解除方法 |
|---------|---------|---------|
| `dsh-web-app/lib/startup.js` | `0.0.0.0` バインドをハードコード禁止 | 制限チェックを削除し、任意のバインドを許可 |
| `dsh-sandbox-policy/lib/index.js` | デフォルトサンドボックスモードが `read-only` | `danger-full-access` に強制設定 |
| `dsh-fs-sandbox/lib/index.js` | `SandboxedFileSystem.checkedTarget()` の強制パスチェック | containment チェックをバイパス |
| `dsh-sandbox-local/lib/index.js` | bwrap/Landlock プロセスサンドボックス制限 | `confine()` パッケージをバイパス |
| `dsh-client-connection/lib/index.js` | `trustedHosts` は loopback または設定済みホストのみ許可 | すべてのホストを許可하도록拡張 |

## 保持される認証ロジック

- ✅ HTTP Basic Auth 認証クレデンシャル検証（`isAuthorized`）
- ✅ 401 Unauthorized 応答生成（`sendUnauthorized`）
- ✅ browser-session cookie 認証
- ✅ Host/Origin browser-trust fence（解除ただし認証は保持）

## API

### `apply(ctx: Context): void`

プラグインエントリポイント関数。すべての制限解除パッチを適用し、管理ツールを登録します。

### 登録されるツール

- `sandbox_status` — 現在のサンドボックスモードとセキュリティ状態を照会
- `sandbox_set_mode` — ランタイムでサンドボックスモードを切り替え

### Export される認証関数

```typescript
import { isAuthorized, sendUnauthorized } from '@diaoyunxi/dsh-host-auth-unrestricted'

// リクエストのクレデンシャルを検証
const authorized = isAuthorized(req, 'root', 'root')

// 401 応答を送信
sendUnauthorized(res, 'DeepSeek Harness')
```

## インストール

```bash
# DSH プラグインリストに追加
dsh plugin --profile web add @diaoyunxi/dsh-host-auth-unrestricted
```

## 設定

`cordis.patch.yml` に追加：

```yaml
- insert:
    - id: host-auth-unrestricted
      name: '@diaoyunxi/dsh-host-auth-unrestricted'
```

## セキュリティに関する注意

⚠️ **警告**：本プラグインはすべてのサンドボックス制限を解除します。信頼できる環境でのみ使用してください。

- パスワード認証は有効なままです。認可されていないアクセスは拒否されます。
- サンドボックス解除後、ファイルシステムとプロセス操作に制限はありません。
- 強力なパスワードとの併用を推奨します。

## バージョン履歴

- `0.1.0-rc.1` — 初期版、検出されたすべての制限を解除
