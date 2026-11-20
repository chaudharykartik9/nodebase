# Nodebase

A workflow-automation app (n8n / Zapier style). Users sign in, create workflows, and background jobs run through Inngest.

## Tech stack

| Area | Technology | Used for |
| --- | --- | --- |
| Framework | Next.js 15 (App Router, Turbopack) + React 19 | Pages, layouts, API routes |
| Language | TypeScript | Type safety everywhere |
| Styling | Tailwind CSS 4, `tw-animate-css` | Utility CSS and animations |
| UI components | shadcn/ui (Radix UI, Base UI, `lucide-react` icons) | Buttons, forms, inputs |
| Toasts | Sonner | Pop-up messages (e.g. "Job queued") |
| Forms | react-hook-form + zod + `@hookform/resolvers` | Login / signup forms and validation |
| API | tRPC 11 + TanStack Query 5 | Type-safe client-to-server calls (`src/trcp/`) |
| Database | PostgreSQL on Neon | Data storage |
| ORM | Prisma 7 with `@prisma/adapter-pg` | Schema, migrations, queries |
| Auth | better-auth (email + password) | Sign up, login, sessions |
| Background jobs | Inngest | Queued / delayed jobs (`src/inngest/`) |
| Lint / format | Biome | `npm run lint`, `npm run format` |

## Project structure

```
prisma/               schema.prisma and migrations
src/app/              pages and API routes
src/app/(auth)/       login and signup pages
src/app/api/trpc/     tRPC endpoint
src/app/api/inngest/  Inngest endpoint (registers functions)
src/trcp/             tRPC setup: init, client, server, routers
src/inngest/          Inngest client and functions
src/lib/              auth, db, helpers
src/components/ui/    shadcn/ui components
```

## Environment variables (`.env`)

```
DATABASE_URL=        # Neon Postgres connection string
BETTER_AUTH_SECRET=  # random secret for better-auth
BETTER_AUTH_URL=     # base URL of the app, e.g. http://localhost:3000
```

## How to run

```bash
npm install
npx prisma generate          # generate the Prisma client (src/generated/prisma)
npx prisma migrate dev       # apply migrations to the database
npm run dev                  # Next.js app on http://localhost:3000
```

### Start Inngest (background jobs)

Run this in a second terminal while `npm run dev` is running:

```bash
npx inngest-cli dev
```

Dev server UI: http://localhost:8288

If it says `Inngest CLI binary not found`, npm skipped the install script. Download the binary manually:

```bash
cd node_modules/inngest-cli && node postinstall.js
```

If the app is not detected automatically, point it at the route:

```bash
npx inngest-cli dev -u http://localhost:3000/api/inngest
```

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Next.js (Turbopack) |
| `npm run build` / `npm start` | Production build / run |
| `npm run lint` | Biome check |
| `npm run format` | Biome format |
| `npx prisma generate` | Regenerate the Prisma client after schema changes |
| `npx prisma migrate dev --name <name>` | Create and apply a migration |
| `npx prisma studio` | Browse the database |
| `npx inngest-cli dev` | Start the Inngest dev server |

## How "Create workflow" works

1. The button calls the tRPC mutation `createWorkflow` ([src/trcp/routers/_app.ts](src/trcp/routers/_app.ts)).
2. The mutation sends the Inngest event `app/task.created` and returns "job queued"; Sonner shows the toast.
3. Inngest runs `processTask` ([src/inngest/functions.ts](src/inngest/functions.ts)): it waits 5 seconds, then inserts a `Workflow` row.
4. The page refetches the workflow list after about 7 seconds.

## Troubleshooting

- **P1001 / EAI_AGAIN (cannot reach the database):** DNS problem reaching Neon. Set DNS to `8.8.8.8 1.1.1.1` and retry.
- **Can't resolve `@/generated/prisma/client`:** run `npx prisma generate`.
- **Inngest function not listed:** make sure `npm run dev` is running and `http://localhost:3000/api/inngest` responds. The client sets `isDev` in development; without it Inngest v4 runs in cloud mode and the route returns 500.
- **Prisma type errors after a schema change:** run `npx prisma generate`.
