# Working rules (from your requirements)

## One task at a time
- Implement only the task requested. Anything extra goes to "Follow-ups" in the task file, not into the code.
- Adapt reference code to this repo's versions and structure; never paste blindly.

## Git (you own it)
- The AI never runs `git checkout/switch/branch/commit/merge/push/stash/reset`.
- **Before a task:** AI states the branch name to create (see each task file).
- **After a task:** AI says "ready for review and commit" with the list of changed files.
- AI may run read-only git commands (`status`, `diff`, `log`).

## `understand.md` (repo root)
- Created at the start of the first implemented task, then **appended** after each task, never one file per task.
- Sections ordered by branch, e.g. `## 07-inngest-setup`.
- Each section includes: **What / Why / How / Where / Code explanation / Flow / Examples**, in beginner-friendly language.
- Chat replies stay short; teaching content lives in the file.

## Preserve existing work
- Inspect before editing: read the file and its importers first.
- No deleting or replacing working code just to mirror the reference.
- If a change could break something, state the impact **before** doing it and wait for your OK.
- Reuse existing components/utilities (shadcn UI in `src/components/ui`, `@/lib/*`, `protectedProcedure`).
- Prefer the approach that keeps current structure (`src/trcp`, feature folders).
- Database migrations touch the shared Neon DB: ask before running `prisma migrate dev`; never `migrate reset`.

## Definition of done (every task)
1. Acceptance criteria in the task file met.
2. `npm run lint` clean for touched files, `npx tsc --noEmit` has no new errors, manual check in `npm run dev` (see `verify-changes` skill).
3. `understand.md` updated.
4. AI reports: what changed, what was verified, what was not verified, anything for you to decide.

## Task file template
Goal · Branch · Prerequisites · Reference files · Current state · Plan (steps) · Files to create/modify · Dependencies · Risks to existing work · Acceptance criteria · understand.md topics · Out of scope.
