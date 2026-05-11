# CLAUDE.md

@AGENTS.md

Read the requirements within the @docs/APPSPEC.md, refer to this file for application requirements

For InstantDB skills: use instantdb skills
For UI/UX: use ui-ux-pro-max skills
For clerk: use clerk or clerk-* skills
This application will be on both mobile + desktop view. Make UI responsive

All plans will be created under .claude of this project.

## Quick Start

```bash
npm install
npm run dev    # Dev server (default port 3000)
npm run build  # Production build
npm run lint   # Lint with ESLint
```

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
  - `api/payments/route.ts` — CRUD for payments
  - `api/summarize/route.ts` — Monthly summary report
  - `api/auth/webhook/route.ts` — Clerk → InstantDB user sync
- `src/components/` — UI components (modal, payment-form, summarize-modal, etc.)
- `src/lib/` — Utilities (instant-api, instant-db, format-money, types)
- `instant.schema.ts` — InstantDB schema (entities: $users, system_users, payments)
- `instant.perms.ts` — InstantDB permission rules

## Key Conventions

- **Money display**: Stored as `x`, displayed as `x * 1000` VND (e.g., DB value `5` = "5,000 VND")
- **Soft deletes only**: Payments use `deleted_at` timestamp — never hard delete; list/summarize APIs exclude deleted records
- **InstantDB files at root**: `instant.schema.ts` and `instant.perms.ts` live at project root, not in `src/`
- **Auth sync**: Clerk webhook creates/syncs `system_users` records on sign-in

## Required ENV Variables

- `INSTANTDB_ADMIN_TOKEN` — Backend InstantDB access
- `NEXT_PUBLIC_CLERK_CLIENT_NAME` — Clerk client name for InstantDB

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.