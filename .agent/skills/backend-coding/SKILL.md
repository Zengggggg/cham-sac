---
name: backend-coding
description: Implement, modify, debug, or refactor the Chạm Sắc Việt backend. Use for work under backend/, API endpoints, data models, services, controllers, middleware, validation, integrations, configuration, or backend tests.
---

# Backend Coding

Work from the current repository state. Before implementing product behavior, read `Cham_Sac_Viet_Agent_Project_Spec.md` in full, then inspect the relevant files and `backend/package.json`. The specification is the source of truth for product scope; the codebase is the source of truth for what is currently implemented.

If the specification and codebase conflict, report the conflict before making a large architectural change. In particular, do not create production schemas until the team resolves the current mismatch between MongoDB/Mongoose and the specification's relational PostgreSQL-style schema, types, foreign keys, and migrations.

## Current baseline

- JavaScript with ES modules (`"type": "module"`), not TypeScript or CommonJS.
- Node.js/Express 4 with Mongoose 8 and MongoDB.
- Entry point: `backend/src/server.js`.
- All current routes are mounted below the legacy `/herdays-api` prefix through `backend/src/routes/index.js`; the specification proposes `/api` paths but they are not implemented yet.
- Required environment variable: `MONGODB_URI`.
- Optional environment variables: `PORT` (default `8080`) and `FRONTEND_URL` (default `http://localhost:5173`).
- The only implemented endpoint is `GET /herdays-api/status`; most feature-layer files are placeholders.
- No automated test suite or validation library is configured yet.

Do not assume MySQL, PostgreSQL, SQL migrations, JWT middleware, TypeScript, Zod, or other libraries exist merely because legacy rules, workflows, or proposed schemas mention them. Add a dependency only when the task requires it and disclose the change.

## Product invariants

- WebAR is public and processes camera frames on-device; never upload or persist camera images/video in the MVP.
- Product prices and all order totals are calculated from trusted backend data, never from client-supplied prices.
- Snapshot product name, unit price, recipient, and shipping address on an order.
- Make order creation, order items, and stock changes atomic using the transaction mechanism of the database that is ultimately selected.
- Make SePay webhook processing idempotent and enforce uniqueness for the external transaction ID.
- OTP must expire, be rate-limited, and never be logged or stored long-term as plaintext.
- Protect admin endpoints with server-side role checks. MVP roles are only `customer` and `admin`.
- Keep the MVP to the eight data domains defined in the specification unless a concrete requirement justifies another one.
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

Do not report `npm test` as passing: the current script is only a failing placeholder.

## Keep this skill current

After backend work, compare this file and the root `README.md` with the resulting code. Update them in the same task only when a maintained fact changed, including:

- runtime, framework, database, or module system;
- package scripts or verification commands;
- environment variables, ports, CORS behavior, or API prefix;
- directory responsibilities or an established backend convention.

Record the implemented reality, not a planned architecture. Avoid growing this skill with one-off details that do not affect future backend decisions.
