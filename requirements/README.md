# Requirements & Plan

Goal: finish **Nodebase** (workflow automation SaaS) task by task, using `code-with-antonio/nodebase` as a *reference*, not a copy. Status: **planning only, no code written for these tasks yet.**

## How to use this folder

1. Read [00-workflow-rules.md](00-workflow-rules.md) (the contract between you and the AI).
2. Read [01-current-state.md](01-current-state.md) (what exists, what is partial, what is missing).
3. Pick the next task file in `tasks/` in order. Each has branch name, scope, files, risks, acceptance criteria.
4. Say: "start T07". The AI will tell you the branch to create, implement **only that task**, update `understand.md`, then tell you it is ready for review.

## Task list (in order)

| # | Task | Branch (you create) | Depends on | Size |
|---|---|---|---|---|
| T06 | [Workflow model + ownership](tasks/T06-workflow-model.md) | `06-workflow-model` | current uncommitted work | S |
| T07 | [Inngest background jobs](tasks/T07-inngest-setup.md) | `07-inngest-setup` | T06 | S |
| T08 | [Dashboard layout (sidebar/header)](tasks/T08-dashboard-layout.md) | `08-dashboard-layout` | T06 | M |
| T09 | [Workflows backend CRUD + params](tasks/T09-workflows-backend.md) | `09-workflows-backend` | T06, T08 | M |
| T10 | [Workflows list UI](tasks/T10-workflows-list-ui.md) | `10-workflows-list-ui` | T09 | M |
| T11 | [Polar billing / premium](tasks/T11-polar-premium.md) | `11-polar-premium` | T09 | M |
| T12 | [Editor: React Flow canvas + Node/Connection schema](tasks/T12-editor-canvas.md) | `12-editor-canvas` | T10 | L |
| T13 | [Editor save + node selector + header](tasks/T13-editor-save-selector.md) | `13-editor-save-selector` | T12 | M |
| T14 | [Execution engine + manual trigger + HTTP node](tasks/T14-execution-engine-http.md) | `14-execution-engine` | T07, T13 | L |
| T15 | [Realtime node status](tasks/T15-realtime-status.md) | `15-realtime-status` | T14 | M |
| T16 | [Webhook triggers (Google Form, Stripe)](tasks/T16-webhook-triggers.md) | `16-webhook-triggers` | T14, T15 | M |
| T17 | [Credentials (schema, CRUD, encryption)](tasks/T17-credentials.md) | `17-credentials` | T09 | L |
| T18 | [AI nodes (Gemini, OpenAI, Anthropic)](tasks/T18-ai-nodes.md) | `18-ai-nodes` | T15, T17 | L |
| T19 | [Discord + Slack nodes](tasks/T19-messaging-nodes.md) | `19-messaging-nodes` | T15 | M |
| T20 | [Executions history](tasks/T20-executions-history.md) | `20-executions-history` | T14 | M |
| T21 | [Sentry + polish + deploy prep](tasks/T21-sentry-polish-deploy.md) | `21-polish-deploy` | all | M |

Order notes: T11 and T17 can swap or be postponed; T16 and T19 are independent of each other. T07 before T14 is mandatory.

## Open questions for you (answer before the affected task)

1. **Billing (T11):** keep Polar (needs a Polar sandbox account) or skip premium gating and leave all features free?
2. **Rename `src/trcp` -> `src/trpc` (T06 or later)?** It touches several imports; optional.
3. **Prisma 7 vs reference Prisma 6:** plan assumes we stay on Prisma 7 (already installed). OK?
4. **Webhook testing (T16):** do you have an ngrok account/static URL?
5. **AI keys (T18):** which providers do you actually want to test (Gemini free tier is cheapest)?
6. **Social login:** the reference also has GitHub/Google login. Want that as an extra task (not currently planned)?
