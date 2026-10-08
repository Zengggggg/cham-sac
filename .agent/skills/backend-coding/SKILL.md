---
name: backend-coding
description: Implement, modify, debug, or refactor the Chạm Sắc Việt backend. Use for work under backend/, API endpoints, data models, services, controllers, middleware, validation, integrations, configuration, or backend tests.
---

# Backend Coding

## User verification invariant

- `emailVerifiedAt` is the single persisted source of truth for email verification.
- `isVerified` is response-only and must be derived as `Boolean(emailVerifiedAt)`; never store or update it in MongoDB.

Work from the current repository state. Before implementing product behavior, read the root `README.md` in full, then inspect the relevant files and `backend/package.json`. The standalone `Cham_Sac_Viet_Agent_Project_Spec.md` referenced by older documentation is currently absent; the root README is the available product specification. The specification is the source of truth for product scope; the codebase is the source of truth for what is currently implemented.

If the specification and codebase conflict, report the conflict before making a large architectural change. The project confirmed Node.js/Express with MongoDB/Mongoose on 2026-10-03; translate any older relational schema concepts into explicit Mongoose validation, indexes, references, and MongoDB transactions as appropriate.

## Current baseline

- JavaScript with ES modules (`"type": "module"`), not TypeScript or CommonJS.
- Node.js/Express 4 with Mongoose 8 and MongoDB.
- Entry point: `backend/src/server.js`.
- The canonical API prefix is `/chamsacviet`, defined by `API_PREFIX` in `backend/src/config/api.js` and mounted in `backend/src/server.js`. Keep code, OpenAPI, tests, Postman assets, and documentation aligned with this prefix.
- Required environment variables: `MONGODB_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`. Payment code additionally requires `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_RETURN_URL`, and `PAYOS_CANCEL_URL` when invoked.
- Optional environment variables include `MONGODB_DB_NAME` (default `cham_sac_viet`), `PORT` (default `8080`), `FRONTEND_URL` (default `http://localhost:5173`), token lifetimes, bcrypt rounds, Resend sender name, and email OTP expiry/attempt/cooldown limits. `GOOGLE_CLIENT_ID` is required when Google login is enabled.
- Implemented endpoints include `GET /chamsacviet/status` and the auth routes documented in `backend/README.md`, including registration email verification and OTP resend through Resend. The seven MongoDB collections, strict validators/indexes, dev seed, and payOS provider foundation are implemented; checkout/payment routes are not yet mounted.
- Swagger UI is available at `/api-docs`, with the OpenAPI document at `/api-docs.json`.
- Node.js's built-in test runner is configured through `npm test`; auth validation, token typing, role authorization, and the OpenAPI contract have tests.

Do not assume MySQL, PostgreSQL, SQL migrations, TypeScript, Zod, or other libraries exist merely because legacy rules, workflows, or proposed schemas mention them. Auth currently uses `bcryptjs`, `jsonwebtoken`, `express-rate-limit`, Google's official `google-auth-library`, and the official `resend` SDK. Payments use the official `@payos/node` SDK. Add another dependency only when the task requires it and disclose the change.

## Product invariants

- WebAR is public and processes camera frames on-device; never upload or persist camera images/video in the MVP.
- Product prices and all order totals are calculated from trusted backend data, never from client-supplied prices.
- Snapshot product name, unit price, recipient, and shipping address on an order.
- Make order creation, order items, and stock changes atomic using the transaction mechanism of the database that is ultimately selected.
- Make payOS webhook processing idempotent, verify signatures with the official SDK, and enforce uniqueness for `(provider, providerTransactionId)`.
- Passwords and email verification OTPs must be bcrypt-hashed. OTPs expire, have attempt/resend limits, are never returned or logged, and email/password accounts remain `pending_verification` until confirmation. Refresh tokens must be hashed at rest, rotated, revocable, and never logged.
- Protect admin endpoints with server-side role checks. Current roles are only `user` and `admin`; public registration always creates `user`.
- Keep the MVP to the seven MongoDB collections defined in `mongodb_database_spec.md`; order items are embedded snapshots in `orders`.
- Ask before implementing any item listed under `Open Decisions` in the specification.

## Implementation boundaries

Use the existing folders according to these responsibilities:

- `routes/`: paths, HTTP methods, and middleware composition.
- `controllers/`: translate HTTP input to service calls and return responses; keep business logic out.
- `services/`: business rules and orchestration; do not pass Express `req` or `res` into services.
- `models/`: Mongoose schemas/models and focused persistence behavior.
- `middlewares/`: reusable request pipeline behavior such as authentication and error handling.
- `validations/`: request input validation when a feature needs it.
- `providers/`: integrations with external systems.
- `config/`: environment-dependent application configuration.

## Backend-to-frontend response contract

Every public JSON response must be created with `sendSuccess` or `sendError` from `src/utils/apiResponse.js`. Do not handcraft `res.status(...).json(...)` response envelopes in routes, controllers, validation, rate-limit handlers, or error middleware.

Every response always contains these six fields:

```js
{
    success: true,
    statusCode: 200,
    message: 'Lấy dữ liệu thành công.',
    data: {},
    meta: null,
    errors: null
}
```

- `statusCode` in the body must equal the real HTTP status.
- `success` is `true` only for successful HTTP operations and `false` for errors.
- `message` is a safe Vietnamese user-facing message suitable for a toast; never place secrets or raw infrastructure details in it.
- `data` contains the primary object/array. Use `null` when there is no payload and always use `null` on errors.
- `meta` is `null` unless metadata exists. Pagination metadata uses exactly `currentPage`, `limit`, `totalItems`, and `totalPages`.
- `errors` is `null` when no detailed errors exist. Otherwise it is always an array; field errors use `{ field, message }`. Never return an error string, stack trace, or raw provider/database payload.
- Internal error details may appear only in development and must still be normalized to an `errors` array. Production 500 responses hide internal details.
- Keep OpenAPI response schemas and contract tests aligned whenever a response changes.

Preserve established public routes and response fields unless the user requests a breaking change. Prefer small, feature-focused modules over generic abstractions created in advance.

## Correctness and security

- Treat route params, query strings, headers, and request bodies as untrusted input.
- Validate and normalize input before business or database operations.
- For protected user-owned data, derive identity from verified authentication context, never from a client-supplied user ID, and scope every query by that owner.
- Use explicit Mongoose filters and update options. Check not-found results and handle invalid ObjectIds without exposing stack traces.
- Never hardcode credentials or environment-specific URLs. Do not log secrets or complete sensitive payloads.
- Forward operational errors to centralized error handling when it exists. Until then, return safe and consistent HTTP errors without leaking internals.
- Do not introduce process termination for ordinary request failures.

## Workflow

1. Inspect the affected route and its neighboring modules; confirm the real dependencies and conventions.
2. Define the request, response, status codes, authorization boundary, and failure cases.
3. Implement the smallest complete vertical slice, keeping HTTP, business, and persistence concerns separate.
4. Update routing and environment documentation when necessary.
5. Run from `backend/`:

   ```bash
   npm run lint
   ```

6. When MongoDB is available, start the server and smoke-test the changed endpoint. State clearly when runtime verification cannot be performed.

Run `npm test` after auth changes and report its actual result.

## Keep this skill current

After backend work, compare this file and the root `README.md` with the resulting code. Update them in the same task only when a maintained fact changed, including:

- runtime, framework, database, or module system;
- package scripts or verification commands;
- environment variables, ports, CORS behavior, or API prefix;
- directory responsibilities or an established backend convention.

Record the implemented reality, not a planned architecture. Avoid growing this skill with one-off details that do not affect future backend decisions.
