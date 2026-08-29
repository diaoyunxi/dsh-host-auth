# @deepseek-ai/dsh-host-auth

HTTP Basic Auth utilities for the DeepSeek Harness Web GUI.

## Overview

This package provides pure utility functions for HTTP Basic Auth validation
and 401 response generation. These are used internally by
[`frontend-static`](../frontend-static/README.md) to enforce authentication
on HTTP requests before serving the Web GUI.

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

## Usage in frontend-static

When mounting `frontend-static` with auth enabled:

```typescript
ctx.plugin(FrontendStatic, {
  distIndex: '/path/to/index.html',
  auth: { username: 'root', password: 'root' }
})
```

## Security Notes

- Credentials are hardcoded at composition time; changing them requires rebuilding the bundle.
- For production deployments, consider using environment variables or a secrets manager.
- This implementation uses simple string comparison; for high-security requirements, use constant-time comparison.
