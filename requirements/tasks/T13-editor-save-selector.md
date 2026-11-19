# T13: Editor save, node selector, header

**Branch:** `13-editor-save-selector` · **Size:** M · **Depends on:** T12

## Goal
Add nodes via a selector sheet, persist the graph, rename the workflow, and provide the editor header (breadcrumb, save button).

## Reference
`components/node-selector.tsx`, `features/editor/components/{add-node-button,editor-header}.tsx`, `workflows.update` / `updateName` in router, `use-workflows.ts` (`useUpdateWorkflow`, `useUpdateWorkflowName`).

## Plan
1. `workflows.update` mutation: input `{id, nodes, edges}`; in a Prisma `$transaction` delete existing nodes and recreate nodes + connections; bump `updatedAt`.
2. `useUpdateWorkflow` hook (toast + invalidate).
3. `components/node-selector.tsx`: shadcn `Sheet` listing trigger and execution nodes (data array with icon, label, type); selecting replaces INITIAL node when adding the first trigger, otherwise adds at a random offset position using `screenToFlowPosition`.
4. `add-node-button.tsx` (floating panel button).
5. `editor-header.tsx`: sidebar trigger, breadcrumbs, inline rename input, Save button reading the `editorAtom`.
6. Hide placeholder when nodes exist.

## Risks
Delete-and-recreate keeps IDs from the client (generate with `crypto.randomUUID` or keep React Flow IDs; must not collide). Large graphs: transaction size.

## Acceptance
Add nodes, connect, save, refresh -> identical graph. Rename persists. Unsaved indicator optional.

## understand.md topics
Transactions; client vs server IDs; optimistic UI vs invalidate; `useReactFlow`/`screenToFlowPosition`.

## Out of scope
Real node implementations (T14+).

## Verified against reference (code read)
- Node IDs come from `createId()` of `@paralleldrive/cuid2` (add this dependency; also used in T14 for event ids). The save button sends `editor.getNodes()` / `editor.getEdges()` from the Jotai `editorAtom` (a `ReactFlowInstance`).
- Selector rules: only one MANUAL_TRIGGER allowed (toast error); the first real node added **replaces** the `INITIAL` placeholder; new nodes are placed at a random offset near screen center via `screenToFlowPosition`.
- Editor flags in reference: `fitView`, `snapToGrid` `[10,10]`, `panOnScroll`, `panOnDrag={false}`, `selectionOnDrag`; Background, Controls, MiniMap, top-right `AddNodeButton` panel.
- Editor page wraps `EditorHeader` + `Editor` in `ErrorBoundary` + `Suspense` + `HydrateClient`.
- Name editing: click breadcrumb -> input, Enter saves, Escape cancels (`updateName` mutation).
