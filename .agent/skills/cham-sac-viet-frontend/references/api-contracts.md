# API and auth implementation reference

## Actual base and response shape

The backend defines `API_PREFIX = '/chamsacviet'` and exposes Swagger JSON at `/api-docs.json` plus a Swagger UI at `/api-docs`. The server defaults to port `8080`. The shared response helpers produce:

```js
{
  success: true|false,
  statusCode,
  message,
  data: value|null,
  meta: value|null,
  errors: array|null
}
```

Use the actual deployed base URL from `VITE_API_URL`; compose paths with `/chamsacviet` only when the service boundary is responsible for the prefix. Do not hardcode a development host.

## Currently registered auth operations

`backend/src/routes/authRoutes.js` currently registers:

| Method | Path under `/chamsacviet/auth` | Auth | Frontend responsibility |
| --- | --- | --- | --- |
| POST | `/register` | public | Validate name/email/password; show pending-verification next step. |
| POST | `/verify-email` | public | Submit email + OTP; handle expired/invalid OTP and success. |
| POST | `/resend-verification-otp` | public | Rate-limit-aware resend feedback and cooldown. |
| POST | `/login` | public | Store/use returned auth data per actual response; show invalid credentials. |
| POST | `/google` | public | Only implement if the product task enables this flow and provider setup exists. |
| POST | `/google/link` | Bearer | Require authenticated session and handle link conflicts. |
| POST | `/refresh-token` | refresh token | Recover expired access token without exposing tokens in UI. |
| POST | `/logout` | refresh token | Clear client auth state even when server logout returns an expected auth error. |
| GET | `/me` | Bearer | Load current user and route unauthorized users appropriately. |

Validation lives in `backend/src/validations/authValidation.js`; auth services, JWT handling, email OTP, and rate limits are in the corresponding service/middleware/provider files. Read those files before assuming field names, token storage, expiry, or error wording.

## Integration rules

- Put fetch/request logic in a service module, not directly in presentational JSX.
- Normalize the shared envelope once; retain `message`, `errors`, and status for UI decisions.
- Use `AbortController` or an equivalent cleanup strategy for requests tied to a component lifecycle.
- Do not retry non-idempotent mutations automatically.
- On `401`, distinguish an expired access token/recovery path from a genuinely unauthorized route; do not loop refresh attempts.
- On `429`, show a cooldown or retry-later message rather than repeatedly submitting.
- Never log passwords, OTPs, access tokens, refresh tokens, payment secrets, or raw webhook payloads.
