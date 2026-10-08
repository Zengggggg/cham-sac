---
name: git-naming-convention
description: Suggest, validate, and standardize Git branch names, pull request titles, and commit messages using Conventional Commits. Use when the user asks to name a branch, PR/MR, commit, or review naming conventions.
---

# Git Naming Convention Skill

## Purpose

Help developers produce consistent Git branch names, PR/MR titles, and commit messages. Prefer clear, concise English descriptions and meaningful module scopes. Do not create branches, commits, or PRs unless explicitly requested and tooling is available.

## Conventions

### Branch

Format: `<type>/<short-kebab-case-description>`

Allowed types:
- `feat` — new feature
- `fix` — bug fix
- `hotfix` — urgent production fix
- `refactor` — code restructuring without behavior changes
- `chore` — tooling, setup, dependency and maintenance work
- `docs` — documentation changes
- `test` — test coverage or test infrastructure
- `perf` — performance improvement
- `ci` — CI/CD changes

Use lowercase and hyphens, no spaces or accented characters. Keep descriptions concise (roughly 2–6 words). If an issue ID exists, prefer `<type>/<ISSUE-ID>-<description>` (e.g., `feat/PROJ-123-google-login`). Do not invent issue IDs.

### Pull Request / Merge Request

Format: `<type>(<scope>): <imperative summary>`

Examples:
- `feat(auth): implement Google OAuth login`
- `fix(payment): handle duplicate webhook events`
- `refactor(user): simplify profile validation`
- `chore(deploy): configure Railway deployment`

Scope is a short name for the affected module (e.g., `auth`, `user`, `order`, `payment`, `ar`, `database`, `deploy`, `api`, `web`). Omit `(scope)` when the change spans unrelated modules and no single scope is meaningful. Summarize the overall change represented by the PR, not a single internal commit.

### Commit

Use Conventional Commits:

`<type>(<scope>): <imperative summary>`

Supported types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build`, `style`, `revert`.

Examples:
- `feat(auth): add email registration endpoint`
- `feat(auth): implement OTP verification`
- `fix(auth): handle expired refresh tokens`
- `test(auth): cover invalid OTP attempts`
- `docs(api): document authentication endpoints`

Keep commits atomic: each commit should represent one logical change. Avoid vague messages like `update`, `fix bug`, `changes`, or `done`. For breaking changes, use `!` after type/scope (e.g., `feat(api)!: remove legacy endpoint`) and describe the breaking change in the commit body where relevant.

## Workflow

1. Identify what changed, which module was affected, and whether a task/issue ID exists.
2. Pick the type based on the **actual change**, not the ticket label alone.
3. Generate:
   - one recommended branch name;
   - one recommended PR/MR title;
   - 1–5 example atomic commit messages matching the implementation steps.
4. If the user only requests one of these, provide only that item unless extra suggestions are useful.
5. If the implementation details are uncertain, say the examples are provisional; never claim work has been performed.
6. If a team or repository has an explicit convention, follow it over the defaults in this skill.

## Output template

```text
Branch: feat/google-oauth-login
PR: feat(auth): implement Google OAuth login
Commits:
- feat(auth): configure Google OAuth provider
- feat(auth): add OAuth callback handler
- feat(web): integrate Google login button
- test(auth): add OAuth authentication tests
```

## Validation checklist

- Type matches the change.
- Scope is meaningful and consistently spelled.
- Branch is lowercase kebab-case with no spaces.
- Title describes an observable change, using an imperative verb.
- Commit is atomic and specific.
- No credentials, sensitive data, invented ticket IDs, or misleading claims.
