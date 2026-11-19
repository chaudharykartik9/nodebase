---
name: verify-changes
description: Run the project's lint, typecheck and build checks before declaring work done, and report results honestly. Use at the end of any code change.
---

# Verify changes

Run from the repo root, in this order, and report real output:

1. `npx prisma generate` - only if the schema changed or `src/generated/prisma` is missing.
2. `npm run lint` - Biome. Fix issues in files you touched; do **not** mass-reformat untouched files (`npm run format` rewrites many files; avoid it unless asked).
3. `npx tsc --noEmit` - typecheck.
4. `npm run build` - only for larger changes or when routing/config changed (needs a valid `.env`).

## Reporting

- State which commands ran and whether they passed.
- Pre-existing failures (see "Known quirks" in `CLAUDE.md`) are not yours to fix: list them separately from failures you introduced.
- If a check could not run (e.g. no DB access), say so instead of implying success.
- Never claim a UI change works without running `npm run dev` and checking it, or saying it was not checked.
