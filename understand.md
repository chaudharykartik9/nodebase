# Understanding the Nodebase codebase

One section per branch/task. Newest at the bottom. Written for learning, not as reference docs.

---

## 06-workflow-model: workflows that belong to a user

### What
We turned a tutorial "playground" table into a proper **Workflow** model that is **owned by a user**, and fixed the home page and tRPC code around it.

### Why
A workflow automation app is multi-user: user A must never see user B's workflows. Before this task the `workflow` table had no owner, so the list query accidentally filtered by the wrong column and `create` made ownerless rows. Every later feature (editor, executions, credentials) hangs off "a workflow that belongs to a user", so this has to be right first.

### How: step by step
1. **Schema (Prisma).** `prisma/schema.prisma` describes tables as `model`s. `Workflow` now has `userId` and `user User @relation(..., onDelete: Cascade)`. This creates a *foreign key*: each workflow points at one user, and deleting a user deletes their workflows. `User` got the inverse `workflows Workflow[]` (Prisma needs both sides of a relation).
2. **`@@map("workflow")`.** In code the model is `Workflow` (PascalCase convention), but the database table is still called `workflow`, so Prisma does not need to rename/recreate it.
3. **Migration.** A migration is a SQL file describing one schema change. Ours adds `createdAt`, `updatedAt`, `userId`, an index on `userId` (fast "all workflows of this user" lookups) and the foreign key. It first deletes old test rows because the new `userId` column is `NOT NULL` and old rows had no owner to put in it.
4. **tRPC context.** `createTRPCContext` used to return a fake `userId`. Real identity comes from the session in `protectedProcedure`, so the fake value was removed.
5. **Router.** `getWorkFlows` uses `where: { userId: ctx.auth.user.id }`. `createWorkflow` saves `userId`. `ctx.auth` is added by `protectedProcedure`, which also rejects people who are not logged in.
6. **Server helpers.** `HydrateClient` and `prefetch` were added to `src/trcp/server.tsx` (explained below).
7. **Home page.** Split into a server page (checks login) and a client component (buttons, live data).

### Where
| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | Data model (tables and relations) |
| `prisma/migrations/20261119150000_workflow_user_relation/migration.sql` | The SQL that upgrades the real database |
| `src/lib/db.ts` | The single shared Prisma client (unchanged) |
| `src/trcp/init.ts` | tRPC setup, `protectedProcedure` (login check + `ctx.auth`) |
| `src/trcp/routers/_app.ts` | API procedures `getWorkFlows`, `createWorkflow` |
| `src/trcp/server.tsx` | tRPC for **server** components + `prefetch`/`HydrateClient` |
| `src/trcp/client.tsx` | tRPC for **client** components (`useTRPC`) |
| `src/app/page.tsx` | Server page: `requireAuth()` then renders UI |
| `src/app/workflows-scratch.tsx` | Client component: shows data and the create button |
| `tests/**`, `vitest.config.ts` | Automated tests |

### Code explanation
- **`protectedProcedure`** (`init.ts`): a tRPC "middleware". It reads the session cookie via `auth.api.getSession`. No session -> throws `TRPCError UNAUTHORIZED`. Otherwise it calls `next({ ctx: { ...ctx, auth: session } })`, so your procedure gets `ctx.auth.user.id`.
- **`getWorkFlows`**: `prisma.workflow.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })` = "SELECT * FROM workflow WHERE userId = ? ORDER BY createdAt DESC".
- **`prefetch(queryOptions)`**: starts a data fetch on the server *without waiting*, and stores the result in the server's React Query cache. `void` means "I intentionally don't await this".
- **`HydrateClient`**: takes the server cache, turns it into plain data (`dehydrate`) and passes it to the browser inside a `HydrationBoundary`. The browser's React Query then starts with that data (`hydrate`), so the page shows content immediately with no loading spinner. Not used by a page yet; T08-T10 will use it.
- **`getQueryClient = cache(makeQueryClient)`**: `cache` gives one QueryClient per server request, so `prefetch` and `HydrateClient` share the same cache.

### Flow
```
Browser (workflows-scratch.tsx)
  useQuery(trpc.getWorkFlows)  --HTTP-->  /api/trpc/getWorkFlows
                                              |
                      protectedProcedure: read session cookie (better-auth)
                              | no session -> 401 UNAUTHORIZED
                              v
                      prisma.workflow.findMany({ where: { userId } })
                              v
                         Neon Postgres  --> JSON back to the browser
```
Page load: `GET /` -> `page.tsx` (server) -> `requireAuth()` -> not logged in? redirect to `/login`; logged in? send HTML with the client component.

### Why server vs client component split
`requireAuth()` uses `headers()` from Next.js and the database: **server-only**. A file with `"use client"` is shipped to the browser, so it can't import server-only code. The old page mixed both, which is a bug. Rule of thumb: server components do checks and data prep; client components do clicks, state and hooks (`useQuery`, `useMutation`).

### Examples
- User A logs in, clicks createWorkflow: row `{id, name:"test-workflow", userId: A}`. User B's list stays `[]` because of `where: { userId: B }`.
- Delete user A: Cascade removes A's workflows automatically.

### Testing (new)
`npm test` runs Vitest. Tests replace the database and login with fakes ("mocks") so they are fast and safe: they check the router passes the right `userId`, that logged-out calls are rejected, that the schema/migration contain what we expect, and that the page isn't a client component. See `requirements/reports/T06-workflow-model-report.md`.

### Things to remember
- After changing the schema run `npx prisma generate` (the client in `src/generated` is gitignored) and restart `npm run dev`.
- Never `migrate reset` on the shared Neon database.

---

## 07-inngest-setup: background jobs with Inngest and mprocs

### What
- **Inngest**: a service that runs *background jobs* ("functions") in response to *events*. Your app says "this happened" (`inngest.send(...)`), and Inngest calls your code back later, with retries.
- **A background job**: code that runs outside the web request that started it. We added a small demo job, `hello-world`.
- **mprocs**: a terminal tool that runs several commands side by side (here: the Next.js server and the Inngest dev server) with one command.

### Why
Running a workflow can take seconds or minutes (HTTP calls, AI models). A normal web request would time out, and if the server restarted halfway the work would be lost. Inngest runs the work in small saved **steps**: if step 3 fails it retries only step 3, and `step.sleep` can pause for days without holding a server open. This is the engine that will execute workflows in T14.

### How: step by step
1. Your code sends an event: `inngest.send({ name: "test/hello.world", data: { email } })`.
2. The Inngest **dev server** (a local program on port 8288) receives it and finds functions listening to that event name.
3. It calls your app over HTTP at `/api/inngest` to run the function. The function runs until it reaches a `step.*` call, reports the step's result back, and Inngest saves it.
4. Inngest calls `/api/inngest` again for the next step (after the 2 s sleep, then the message step). When the function returns, the run is `Completed`.
5. Each call re-runs the function from the top, but steps that already finished return their saved result instantly. That is why side effects must live inside `step.run`.

### Where
| File | Responsibility |
|---|---|
| `src/inngest/client.ts` | The Inngest client (`id: "nodebase"`). Sets dev mode from `NODE_ENV` |
| `src/inngest/functions.ts` | Background jobs. `helloWorld` + the `functions` list |
| `src/app/api/inngest/route.ts` | The URL Inngest calls to introspect/run our functions (`GET`, `POST`, `PUT`) |
| `src/trcp/routers/_app.ts` | Temporary `testInngest` procedure: sends the test event (login required) |
| `src/app/workflows-scratch.tsx` | Temporary "Test background job" button |
| `mprocs.yaml` | Which processes `npm run dev:all` starts |
| `package.json` | Scripts `inngest:dev`, `dev:all` |

### Code explanation
- `new Inngest({ id, isDev })`: `isDev` makes the SDK use the local dev server and skip signature checks. **Inngest v4 defaults to cloud mode** (needs `INNGEST_SIGNING_KEY`), so without this the route answers 500 "In cloud mode but no signing key found". The tutorial used v3, which detected dev mode by itself.
- `inngest.createFunction({ id, triggers: [{ event }] }, handler)`: in v4 the trigger lives inside the options object (v3 had it as a second argument).
- `step.sleep("wait-a-moment", "2s")`: durable pause. `step.run("build-message", fn)`: a retryable, saved unit of work. The first argument is the step's id and must be unique per function.
- `serve({ client, functions })` from `inngest/next`: turns the list of functions into the route handlers. Forgetting to add a new function to the `functions` array means Inngest never sees it.
- `testInngest` is a `protectedProcedure`: only a logged-in user can queue the job, and the user's email goes in the event data.
- `inngest-cli dev -u http://localhost:3000/api/inngest`: starts the dev server and tells it where our app is.

### Flow
```
Browser button --tRPC--> testInngest --inngest.send--> Inngest dev server (:8288)
                                                          |  event "test/hello.world"
                                                          v
                         /api/inngest  <--HTTP calls--  runs hello-world step by step
                         (sleep 2s -> "Hello, <email>!")  -> run Completed
```
You can watch runs in the browser at http://localhost:8288.

### Examples
- Run everything: `npm run dev:all` (mprocs starts Next + Inngest; use arrow keys to switch panes, `q` to quit) or run `npm run dev` and `npm run inngest:dev` in two terminals.
- Sign in, click **Test background job**, open http://localhost:8288 -> Runs: `hello-world` completes in about 3 s with `{ message: "Hello, you@example.com!" }`.
- Later (T14) an `execute-workflow` function replaces this demo and runs each workflow node as a step.

### Things to remember
- The Inngest dev server must be running, or `inngest.send` fails in dev.
- `npm run inngest:dev` expects the app on port 3000 (change `-u` if you use another port).
- In production you need `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` (T21).
