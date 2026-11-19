# T12: Editor: React Flow canvas + Node/Connection schema

**Branch:** `12-editor-canvas` · **Size:** L · **Depends on:** T10

## Goal
`/workflows/[workflowId]` page rendering an interactive React Flow canvas loaded from the DB (nodes, edges), with the INITIAL placeholder node.

## Reference
`prisma/schema.prisma` (Node, Connection, NodeType), `features/workflows/server/routers.ts` (`getOne` returns nodes/edges), `features/editor/components/editor.tsx`, `components/initial-node.tsx`, `components/react-flow/*`, `components/workflow-node.tsx`, `config/node-components.ts`, `(editor)/workflows/[workflowId]/page.tsx`.

## Plan
1. Install `@xyflow/react` (ask).
2. Schema: `NodeType` (start with `INITIAL`, `MANUAL_TRIGGER`, `HTTP_REQUEST`), `Node`, `Connection`; relations on `Workflow`. Migration via `prisma-migrate` (ask before applying). Add other enum values later per node task.
3. `workflows.create` also creates an INITIAL node; `getOne` maps DB nodes/connections to React Flow `Node`/`Edge`.
4. `components/react-flow/{base-node,base-handle,placeholder-node,node-status-indicator}.tsx`: copy-adapt from the reference (these are shadcn-registry style components).
5. `components/workflow-node.tsx` (toolbar with delete/settings), `components/initial-node.tsx`.
6. `config/node-components.ts` registry (`nodeComponents`).
7. `features/editor/components/editor.tsx`: `ReactFlow` + Background, Controls, MiniMap; handlers `onNodesChange`, `onEdgesChange`, `onConnect`.
8. `features/editor/store/atoms.ts`: Jotai `editorAtom` holding the ReactFlow instance.
9. Editor page + `requireAuth` + prefetch `getOne`; reserved route group `(editor)` without the normal header.

## Files
Create: editor feature, react-flow components, config registry, page. Modify: schema, workflows router (`create`, `getOne`).

## Risks
Changing `create`/`getOne` affects T09/T10 code: re-test the list page. React Flow CSS import in the editor only.

## Acceptance
Open a new workflow -> see canvas with placeholder node; pan/zoom/drag works; connecting nodes draws edges (not persisted yet).

## understand.md topics
Graph model (nodes/edges/handles); how React Flow state works; DB design for graphs; node type registry; Jotai atoms for sharing the instance.

## Out of scope
Saving (T13), adding nodes (T13), execution.
