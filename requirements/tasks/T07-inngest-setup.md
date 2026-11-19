# T07: Inngest background jobs

**Branch:** `07-inngest-setup` · **Size:** S · **Depends on:** T06

## Goal
Add Inngest so long-running work (workflow execution later) runs in the background, with a simple demo function proving the pipeline works.

## Reference
`src/inngest/client.ts`, `src/inngest/functions.ts`, `src/app/api/inngest/route.ts`, `mprocs.yaml`, `package.json` scripts (`inngest:dev`, `dev:all`).

## Plan
1. Install `inngest`, `inngest-cli` (dev), `dotenv-cli`, `mprocs` (dev) (ask before installing).
2. `src/inngest/client.ts`: `new Inngest({ id: "nodebase" })`.
3. `src/inngest/functions.ts`: one demo function (event `test/hello.world` with a `step.sleep` + `step.run`).
4. `src/app/api/inngest/route.ts`: `serve({ client, functions })` exporting GET/POST/PUT.
5. Temporary trigger: a tRPC mutation or button that `inngest.send(...)` (remove or keep behind a dev flag after verifying).
6. Scripts: `inngest:dev` (`inngest-cli dev`), optional `dev:all` + `mprocs.yaml` (ngrok line only when T16 starts).
7. Test: run `npm run dev` + `npx inngest-cli dev`, send event, observe run at `localhost:8288`.

## Files
Create: `src/inngest/{client,functions}.ts`, `src/app/api/inngest/route.ts`, `mprocs.yaml` (optional). Modify: `package.json` scripts.

## Risks
Only additive. Adding scripts to `package.json` is the sole edit to an existing file.

## Acceptance
Inngest dev UI shows the app, the demo function, and a successful run; app unaffected otherwise.

## understand.md topics
What a background job/queue is; events vs functions vs steps; retries and durability; why not just `await` in a request; how the dev server and the Inngest dev server talk.

## Out of scope
Workflow execution logic (T14), realtime (T15).
