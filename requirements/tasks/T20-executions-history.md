# T20: Executions history

**Branch:** `20-executions-history` · **Size:** M · **Depends on:** T14

## Goal
Persist each run and show list + detail pages (status, duration, error, output).

## Reference
`Execution` model, `ExecutionStatus`, `features/executions/{components/executions.tsx,execution.tsx, hooks, server}`, `(rest)/executions/*`, `executeWorkflow` (`create-execution`, `update-execution`, `onFailure`).

## Plan
1. Schema `Execution` + enum, `Workflow.executions`; migration (ask).
2. Update `executeWorkflow`: create execution at start (`inngestEventId` unique), mark `SUCCESS` with `output`/`completedAt`, `onFailure` marks `FAILED` with error/stack.
3. Router `executions.getMany/getOne` (scoped through `workflow.userId`), prefetch, params, hooks.
4. List + detail UI with status icons, duration (`date-fns`), error collapsible, JSON output.
5. Sidebar link (exists since T08).

## Risks
Modifying `executeWorkflow` affects T14/T15 behavior: re-test runs.

## Acceptance
Every run appears with the correct final status; failures show message.

## understand.md topics
Run auditing, status state machine, idempotency via unique event id, authorization through relations.
