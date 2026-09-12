# @deepseek-ai/dsh-host-auth

HTTP Basic Auth plugin for DeepSeek Harness Web GUI with binding restriction removal.

## Overview

This package provides:

1. **HTTP Basic Auth utilities** for credentials validation and 401 response generation
2. **Binding restriction removal** — allows `0.0.0.0` host binding (normally restricted)
3. **Trusted hosts bypass** — skip authentication when accessing from trusted domains

The credentials are verified server-side only — the browser handles the
authentication dialog automatically via HTTP Basic Auth. No credentials are
ever exposed in the frontend code.

Default credentials: `username=root`, `password=root`.

## API

### `isAuthorized(req, username, password): boolean`

Validates the `Authorization` header against the configured credentials.

```typescript
import { isAuthorized } from '@deepseek-ai/dsh-host-auth'

const authorized = isAuthorized(req, 'root', 'root')
```

### `sendUnauthorized(res, realm?): void`

Writes a 401 Unauthorized response with a `WWW-Authenticate` header.

```typescript
import { sendUnauthorized } from '@deepseek-ai/dsh-host-auth'

sendUnauthorized(res, 'DeepSeek Harness')
```

### `isTrustedHost(req, trustedHosts): boolean`

Checks if the request comes from a trusted host.

```typescript
import { isTrustedHost } from '@deepseek-ai/dsh-host-auth'

const isTrusted = isTrustedHost(req, ['example.com', '*.mydomain.com'])
```

## Configuration

### Trusted Hosts Bypass

When you configure `trustedHosts`, requests from those domains will skip
authentication entirely. This is useful for public deployments where you want
to access the Web GUI without token/cookie exchange.

```yaml
# In your cordis.patch.yml or plugin configuration
- insert:
    - id: host-auth
      name: '@deepseek-ai/dsh-host-auth'
      config:
        trustedHosts:
          - "mydomain.com"          # exact match
          - "*.example.com"         # wildcard match
          - "192.168.1.100"         # IP address
```

Supported formats:
- Exact domain: `"example.com"`
- Wildcard: `"*.example.com"` (matches any subdomain)
- IP address: `"192.168.1.1"`
- With port: `"example.com:8080"`

### Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trustedHosts` | `string[]` | `[]` | List of trusted hosts to bypass auth |
| `forceHostZero` | `boolean` | `true` | Force host binding to `0.0.0.0` |

## Security Notes

- When `trustedHosts` is configured, requests from those hosts skip ALL authentication
- Credentials are hardcoded at composition time; changing them requires rebuilding the bundle
- For production deployments, consider using environment variables or a secrets manager
- This implementation uses simple string comparison; for high-security requirements, use constant-time comparison
- The `0.0.0.0` binding allows network-wide access — ensure proper firewall rules are in place

## Usage in frontend-static

When mounting `frontend-static` with auth enabled:

```typescript
ctx.plugin(FrontendStatic, {
  distIndex: '/path/to/index.html',
  auth: { username: 'root', password: 'root' }
})
```

## Installation

```bash
dsh plugin --profile web add @deepseek-ai/dsh-host-auth
```

## Version History

- `0.2.0-rc.1` — Added binding restriction removal and trusted hosts bypass
- `0.1.0-rc.8` — Added dsh.bundle support for Cordis plugin format
