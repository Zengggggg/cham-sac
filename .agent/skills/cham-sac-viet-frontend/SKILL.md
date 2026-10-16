---
name: cham-sac-viet-frontend
description: Implement, redesign, debug, or review the Chạm Sắc Việt React/Vite and WebAR frontend from the repository's real product brief, API function map, AR guide, brand fonts, palette, key visuals, and .agent rules. Use for frontend pages, flows, responsive UI, API integration, AR/camera experiences, accessibility, and visual verification in this repository; not for unrelated backend-only work.
metadata:
  short-description: Detailed Chạm Sắc Việt frontend implementation playbook
---

# Chạm Sắc Việt frontend implementation playbook

Build production-quality Vietnamese interfaces that feel like a digital extension of the Chạm Sắc Việt printed/digital publications. Visual synchronization with `project-brief/` is a first-class acceptance criterion, alongside functionality, accessibility, responsiveness, and honest backend integration. Requirements and actual code contracts outrank decoration, but do not solve a design task with a generic template.

## Mandatory source reading and precedence

Before changing code, read the relevant sources in this order:

1. The requested feature's files and adjacent CSS/components.
2. `project-brief/` key visuals, palette, and font assets.
3. [references/product-map.md](references/product-map.md) for product areas, routes, invariants, and known scope.
4. [references/api-contracts.md](references/api-contracts.md) when data, authentication, orders, payments, or admin behavior is involved.
5. [references/ar-flow.md](references/ar-flow.md) for camera, image recognition, 3D model, heritage, or QnA work.
6. [references/design-system.md](references/design-system.md) and [references/component-patterns.md](references/component-patterns.md) for visual decisions.

Use this precedence when sources conflict:

1. Explicit user request for the current task.
2. Actual backend routes, validators, services, models, and Swagger definitions.
3. Product/AR/API documents.
4. `.agent/rules/` and existing `.agent/skills/` conventions.
5. Low-risk implementation judgment.

Record conflicts instead of silently inventing behavior. In particular, `.agent/rules/frontend.md` describes Zustand and Tailwind v4, while the current frontend package declares neither. Inspect `package.json` before using either; do not import an uninstalled package.

## Current repository facts

- Frontend: React 19, Vite 8, JavaScript/JSX, React Compiler plugins, ESLint; entry `frontend/src/main.jsx`, root `frontend/src/App.jsx`.
- Current starter UI still contains Vite/React demo content and plain `src/index.css` + `src/App.css`.
- Current frontend dependencies do not include a router, Tailwind, Zustand, React Query, Axios, icon package, AR engine, or test runner.
- Backend: Node 20+, Express, MongoDB/Mongoose, JWT, Google auth, Resend email, PayOS; API prefix is `/chamsacviet`; server default port is 8080.
- Backend currently registers a status route and auth routes. Do not claim shop, AR, QnA, admin, or payment endpoints exist merely because they are listed in `api_function.pdf`.
- Use JavaScript/JSX unless the project is intentionally migrated. Do not create TypeScript-only files in the current baseline.

## Non-negotiable product invariants

- MVP-facing copy is Vietnamese.
- Public AR does not require authentication.
- AR uses image tracking of a landmark card/document, not QR scanning, plane placement, or arbitrary surface detection.
- Recognition and camera processing stay on-device. Never upload camera frames/video to the backend.
- Each recognized `target_index` maps to exactly one active heritage experience. The experience supplies a `.glb` model, poster/thumbnail, and heritage content from configured URLs.
- AR must explain camera permission, show an unsupported/denied fallback, give feedback while recognizing/loading, and provide model controls plus an information path.
- Public views show only active/published content. Admin visibility or controls never replace backend authorization.
- Do not add chatbot, multilingual behavior, social login, or other out-of-scope features unless the user explicitly requests them; note that Google auth exists in backend code but is not the same as enabling every social login listed in the planning PDF.

## Operating workflow

### 1. Inspect

Run repository/file inspection before authoring. Confirm scripts and dependencies from `frontend/package.json` and `backend/package.json`. Read the affected React tree, styling entrypoints, `.agent/rules/frontend.md`, and any matching workflow. Inspect actual route registration and Swagger before designing a request. Check whether a logo, artwork, font, model URL, poster URL, or API response already exists before creating a replacement.

Create a short requirement matrix for non-trivial work:

| Requirement | Route/component | Data/API source | UI states | Verification |
| --- | --- | --- | --- | --- |

Separate confirmed requirements, code-backed behavior, document-only planned behavior, and assumptions.

### 2. Plan

Choose the smallest coherent page/component change. Decide:

- route and navigation entry;
- page shell and responsive composition;
- state owner: local state, context/store only if installed and justified, or server state;
- API service boundary and response normalization;
- loading, empty, validation, unauthorized, network/server error, retry, success, and disabled states;
- assets, typography roles, palette tokens, and decorative layers;
- verification at 375px, a tablet width, and 1280px.

For broad feature work, show the planned files and flow before editing. Do not refactor the whole starter app to satisfy a single screen.

### 3. Implement

Use semantic HTML and focused JSX components. Keep a component responsible for one meaningful UI behavior; extract only repeated or cognitively independent patterns. Use stable domain IDs for list keys. Keep state at the narrowest useful owner and derive values rather than duplicating them.

For API work, centralize requests in `frontend/src/services/` (or the project's established service location), use `import.meta.env.VITE_API_URL` when a base URL is needed, and match the backend's actual prefix and response envelope. The backend response helpers use `{ success, statusCode, message, data, meta, errors }`; do not assume `{ data: [...] }` without checking the endpoint. Handle auth tokens according to the existing auth design; never expose secrets or put private credentials in client code.

For mutations, prevent double submission, preserve or refetch/update affected data, and show user-visible feedback. For destructive actions, require confirmation and make cancellation safe.

### 4. Refine visual quality

Use the supplied palette, fonts, and key visuals as a system. Build a coherent composition with strong focal hierarchy, deliberate color blocking, controlled outlines, layered silhouettes, and purposeful asymmetry. The page should be recognizable as Chạm Sắc Việt even before reading the copy. Use the actual supplied wordmark/artwork wherever the design calls for the brand mark; do not redraw or replace it with plain text.

Avoid a generic SaaS dashboard, random gradients, all-card layouts, or decorative assets that obscure controls. Use CSS geometry for simple shapes and supplied artwork for brand-specific imagery. Keep logos and images undistorted. When choosing between a visually safe but generic layout and a more expressive layout, preserve the brand composition first, then solve legibility through spacing, contrast, layering, and responsive simplification.

Audit every interactive state, not only the happy path. Check contrast, text wrapping in Vietnamese, tap target size, visible focus, keyboard order, reduced motion, object-fit/cropping, z-index, pointer-events on decoration, and horizontal overflow. Before handoff, perform a visual audit against at least one supplied key visual and verify: dominant hue, wordmark treatment, outline/contour treatment, geometric rhythm, decorative motif family, font personality, and responsive crop.

### 5. Verify

Run the available commands from the correct directory:

```text
cd frontend && npm run lint
cd frontend && npm run build
cd backend && npm run lint
cd backend && npm test
```

Only run checks relevant to the change, but report each attempted result. If browser tooling is available, load the built/dev route, inspect console and network errors, test the documented user flow, and compare mobile/desktop renders with the supplied references. Never claim browser, AR-camera, visual, or API verification that was not actually performed.

## Accessibility and failure-state standard

Every control needs a meaningful accessible name, native semantics where possible, visible `:focus-visible`, keyboard behavior, and a state that is not conveyed by color alone. Images need meaningful Vietnamese `alt` text unless decorative. Dialogs need focus management and escape/cancel behavior. Forms need labels, input types/autocomplete, inline field feedback, and a submit-level error strategy. Async views must never hang silently: show progress, preserve context, explain failures plainly, and provide retry or a safe next action.

## Boundaries and escalation

Do not fabricate business rules, routes, response schemas, permissions, model URLs, AR recognition targets, copy, or images. If a requested page is present only in the planning PDF and not in backend code, implement the UI boundary only when that is the user's intent and label the missing integration. Ask for clarification when a choice changes business behavior, AR engine/recognition strategy, authentication, payment behavior, or destructive data handling.

## Completion report

Report: implemented routes/components and user flows; source documents/assets consulted; tokens/fonts/assets used; API endpoints and states wired; dependencies added or intentionally not added; lint/build/test/browser results; unresolved conflicts; assumptions; and exact changed paths. Do not modify or delete original supplied documents.
