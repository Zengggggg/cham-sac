# Project context and source-of-truth routing

The current repository is a Vite React frontend and an Express/Mongoose backend. Frontend scripts are `dev`, `build`, `lint`, and `preview`. Backend scripts include `dev`, `start`, `lint`, and `test`. Existing frontend dependencies are React/ReactDOM, Vite, and ESLint; no Tailwind, router, icon package, or animation package is currently declared. Reuse what exists and add only justified compatible dependencies.

Relevant source locations:

- `frontend/src/`: React entrypoint, current styles, components, and bundled assets/fonts.
- `backend/src/config/swagger.js`: inspect API documentation setup.
- `backend/src/routes/`, `controllers/`, `services/`, `models/`, and `validations/`: inspect actual contracts and state transitions before wiring UI.
- `project-brief/`: inspect project brief, key visuals, palette, and supplied artwork.
- User-supplied `api_function.pdf` and `Hướng dẫn sử dụng chức năng AR.docx`: consult for endpoint/function behavior and AR flow when the relevant feature is implemented.

When adding API integration, map each documented operation to explicit UI states: idle, loading, success, empty, validation failure, authorization failure, network/server failure, and retry where appropriate. Keep request/response shapes aligned with the documents and existing backend code. Do not replace missing backend behavior with fake success states.
