---
name: add-workflow-node
description: Add a new workflow node (trigger or action) following the reference nodebase architecture - Prisma NodeType, canvas component, config dialog, executor, Inngest channel and registries. Use only once the editor and Inngest engine exist in this repo.
---

# Add a workflow node

**Prerequisite check:** this repo currently has no editor, `Node` model, or Inngest setup. If `src/features/editor`, `src/inngest`, or `src/features/executions` are missing, stop and tell the user which foundations are needed. Do not scaffold them on your own.

Reference: `code-with-antonio/nodebase` -> `src/features/executions/components/<node>/` and `src/features/triggers/components/<node>/`.

## Files per node (`<node>` = e.g. `slack`)

1. `prisma/schema.prisma`: add the value to `enum NodeType`, then use `prisma-migrate`.
2. `src/inngest/channels/<node>.ts`: realtime channel that publishes `status` (`loading | success | error`) per `nodeId`; register in `executeWorkflow` `channels`.
3. `src/features/executions/components/<node>/executor.ts`: `NodeExecutor<Data>`
   - publish `loading`; validate config (throw `NonRetriableError` + publish `error` if missing);
   - resolve templates with Handlebars against `context`;
   - do side effects inside `step.run("<node>", ...)`;
   - publish `success`; return `{ ...context, [data.variableName]: result }`.
4. `.../<node>/dialog.tsx`: react-hook-form + zod form (variable name, templated fields, credential select). Variable name must match `/^[A-Za-z_$][A-Za-z0-9_$]*$/`.
5. `.../<node>/node.tsx`: memoised React Flow node using `BaseExecutionNode`, `useNodeStatus` with the channel, opens the dialog, saves via `setNodes`.
6. `.../<node>/actions.ts`: `"use server"` `fetch<Node>RealtimeToken()` using `getSubscriptionToken`.
7. Register in **both** registries:
   - `src/config/node-components.ts` (`nodeComponents`)
   - `src/features/executions/lib/executor-registry.ts` (`executorRegistry`, typed `Record<NodeType, NodeExecutor>` so TS flags missing entries)
8. Add it to the node selector (`src/components/node-selector.tsx`) with an icon in `public/logos/`.

## Rules

- Secrets (API keys, webhooks) come from encrypted `Credential` rows, decrypted server-side only. Never store keys in node `data`.
- Executors must be idempotent per step and never swallow errors; always rethrow after publishing `error`.
- Keep node `data` JSON-serialisable.
- Finish with `verify-changes`.
