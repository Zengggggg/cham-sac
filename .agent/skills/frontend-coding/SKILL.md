---
name: frontend-coding
description: Implement, modify, debug, or refactor the Chạm Sắc Việt React and WebAR frontend. Use for work under frontend/, React components, UI behavior, styling, accessibility, camera/AR flows, frontend state, API integration, or frontend tests.
---

# Frontend Coding

Work from the current repository state. Before implementing product behavior, read `Cham_Sac_Viet_Agent_Project_Spec.md` in full, then inspect the affected components, styles, configuration, and `frontend/package.json`. The specification defines product scope; the codebase defines what is currently available.

Do not choose an AR engine, guest checkout behavior, or another item listed under `Open Decisions` without user confirmation. Keep undecided behavior configurable when implementation can safely proceed without that choice.

## Current baseline

- React 19 and Vite 8 using JavaScript/JSX with ES modules.
- React Compiler is enabled through `@vitejs/plugin-react` and `@rolldown/plugin-babel`.
- Entry point: `frontend/src/main.jsx`; root component: `frontend/src/App.jsx`.
- Styling currently uses `src/index.css` and `src/App.css`.
- ESLint is configured; production output is created in `frontend/dist`.
- No router, Tailwind CSS, Zustand, React Query, Axios, component library, or automated test runner is currently installed.
- The frontend does not currently consume environment variables or call the backend.

Do not write TypeScript or assume an uninstalled library is available. Do not introduce a dependency or application-wide pattern for a local problem without a clear benefit to the requested feature.

## Product invariants

- All product-facing content is Vietnamese in the MVP.
- WebAR must work without authentication and must use image tracking rather than QR scanning or plane placement.
- Recognition runs in the browser/on-device. Do not send camera frames or video to the backend.
- Map each recognized `target_index` to exactly one active heritage experience and load its `.glb`, poster, and content from configured URLs.
- Show loading/poster feedback while a model loads and provide a useful fallback when camera access is denied or AR is unsupported.
- Public content only displays active products, heritage sites, rules, and AR experiences.
- Admin controls in the UI never replace backend authorization.
- Do not add chatbot, multilingual behavior, social login, or other out-of-scope features without a new request.

## Component and UI guidance

- Keep each component focused on one UI responsibility. Extract a child component or hook when it makes behavior easier to understand or reuse, not to satisfy an arbitrary line count.
- Keep state at the narrowest useful owner and derive values instead of duplicating them.
- Use effects only to synchronize with external systems. Include correct dependencies and cleanup subscriptions or asynchronous work where relevant.
- Use stable domain IDs as list keys when items may be reordered, added, or removed.
- Prefer semantic HTML and native controls. Provide accessible names, keyboard behavior, visible focus, meaningful image `alt` text, and sufficient contrast.
- Build responsive layouts from small screens upward and avoid horizontal overflow.
- For asynchronous UI, handle the states that can occur: initial/loading, success, empty, and failure. Prevent duplicate submissions while a mutation is pending.

Use the existing CSS approach unless the task explicitly introduces another styling system. Avoid direct DOM manipulation when React state, refs, or declarative rendering can express the behavior.

## API integration

When adding the first API integration, centralize base URL and request/error handling in a small service module rather than scattering fetch calls across presentation components. Use an environment variable such as `VITE_API_URL` for the base URL and document it in the root `README.md`; never hardcode a deployment URL.

Match the backend's actual API prefix and response shape. After mutations, update or refetch the affected UI data so the screen does not remain stale.

## Workflow

1. Inspect the target screen/component and adjacent CSS before editing.
2. Identify user-visible success, loading, empty, error, keyboard, and responsive behavior relevant to the request.
3. Implement the smallest coherent change while preserving existing visual conventions unless redesign is requested.
4. Run from `frontend/`:

   ```bash
   npm run lint
   npm run build
   ```

5. For visual or interaction changes, verify the affected flow in a browser at a mobile and desktop viewport when browser access is available. Report any verification that could not be performed.

## Keep this skill current

After frontend work, compare this file and the root `README.md` with the resulting code. Update them in the same task only when a maintained fact changed, including:

- React/Vite versions, language, compiler, or application entry points;
- dependencies that establish a project-wide pattern, such as routing, state, data fetching, styling, or testing;
- package scripts, environment variables, build output, or verification commands;
- directory responsibilities or an established frontend convention.

Document what the repository actually uses. Do not turn a one-off implementation choice into a permanent rule without evidence that it is project-wide.
