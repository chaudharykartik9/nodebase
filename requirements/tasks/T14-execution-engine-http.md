# T14: Execution engine + manual trigger + HTTP request node

**Branch:** `14-execution-engine` · **Size:** L · **Depends on:** T07, T13

## Goal
"Execute workflow" button -> Inngest function loads the graph, sorts nodes topologically, runs each node's executor passing a shared `context`. First two real nodes: Manual Trigger and HTTP Request.

## Reference
`src/inngest/{client,functions,utils}.ts`, `features/executions/{types,lib/executor-registry}.ts`, `components/http-request/*`, `features/triggers/components/manual-trigger/*`, `features/editor/components/execute-workflow-button.tsx`, `workflows.execute` mutation.

## Plan
1. Install `toposort` (+types), `handlebars`, `ky` (ask).
2. `inngest/utils.ts`: `topologicalSort(nodes, connections)` (+ handle disconnected nodes), `sendWorkflowExecution({workflowId, initialData?})`.
3. `features/executions/types.ts`: `NodeExecutor`, `WorkflowContext`.
4. `executor-registry.ts`: `Record<NodeType, NodeExecutor>`.
5. Manual trigger: `node.tsx`, `dialog.tsx`, `executor.ts` (passthrough).
6. HTTP node: `node.tsx`, `dialog.tsx` (variableName, method, endpoint, body with Handlebars templates), `executor.ts` using `ky`, returns `{...context, [variableName]: { httpResponse }}`.
7. `inngest/functions.ts`: `executeWorkflow` (event `workflows/execute.workflow`), steps `prepare-workflow`, loop `getExecutor(type)(...)`.
8. `workflows.execute` mutation + `execute-workflow-button.tsx` in editor.
9. Register nodes in `nodeComponents`, node selector, `NodeType` enum (migration if needed).

## Risks
Templating with user input: never `eval`; Handlebars only. Inngest step output must be JSON serialisable. Ensure ownership check in `execute`.

## Acceptance
Manual trigger -> HTTP node calling a public API works; Inngest dashboard shows steps; failures surface as errors.

## understand.md topics
Topological sort; execution context/variables; templating; step-based durable execution; registry pattern.

## Out of scope
Realtime status UI (T15), execution history persistence (T20).

## Verified against reference (code read)
- Also install `@paralleldrive/cuid2`: `sendWorkflowExecution` sends `name: "workflows/execute.workflow"` with `id: createId()` (event id later links to `Execution.inngestEventId`).
- `topologicalSort` returns nodes unchanged when there are no connections; adds self-edges for isolated nodes; throws `"Workflow contains a cycle"` on cycles.
- "Execute workflow" button is only rendered when the canvas has a MANUAL_TRIGGER node.
- Executors share a `json` Handlebars helper (`{{json var}}`), use `NonRetriableError` for config problems, and return `{...context, [variableName]: ...}`.
- `executeWorkflow` retries: `3` in production, `0` in dev. Needs `userId` (looked up from the workflow) passed to executors.
