---
name: prisma-migrate
description: Change the Prisma schema and create/apply a migration safely (Prisma 7 + Neon Postgres), then regenerate the client. Use for any model, field, enum or relation change.
---

# Prisma schema change workflow

Facts about this project:
- Prisma 7: `prisma.config.ts` supplies the datasource URL from `DATABASE_URL` (the `datasource db` block in `schema.prisma` has no `url`).
- Generator is `prisma-client` with output `src/generated/prisma` (gitignored). Import as `@/generated/prisma/client`.
- DB is Neon. Migrations must use the **direct** connection string (host without `-pooler`).
- Existing auth models (`User`, `Session`, `Account`, `Verification`) are generated for better-auth. Do not change them casually.

## Steps

1. Edit `prisma/schema.prisma`. Conventions: PascalCase model, `id String @id @default(cuid())`, `createdAt`/`updatedAt`, `userId` + `user User @relation(..., onDelete: Cascade)` for user-owned data, `@@map("snake_case")`, `@@index` on foreign keys.
2. Format/validate: `npx prisma format && npx prisma validate`.
3. Create the migration **only after confirming with the user** (it writes to the live Neon DB):
   `npx prisma migrate dev --name <snake_case_description>`
4. `npx prisma generate` (migrate dev usually does this; run it if types are missing).
5. Update code that uses changed models; restart `npm run dev` if Turbopack cached a failed import.
6. Run `verify-changes`.

## Troubleshooting

- `P1001 can't reach database`: DNS or network issue. Check `getent hosts <host>`, try public DNS, use the direct (non-pooler) URL, make sure the Neon project is active.
- `Module not found '@/generated/prisma/client'`: run `npx prisma generate`.
- Drift / reset prompts: **never** accept `migrate reset` on the shared Neon DB without explicit user approval; it wipes data.
- Never edit applied migration SQL files; create a new migration instead.
