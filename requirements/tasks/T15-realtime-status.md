# T15: Realtime node status

**Branch:** `15-realtime-status` · **Size:** M · **Depends on:** T14

## Goal
Nodes on the canvas show loading / success / error live while a workflow runs.

## Reference
`src/inngest/channels/*`, `@inngest/realtime`, `features/executions/components/base-execution-node.tsx`, `node-status-indicator.tsx`, per-node `actions.ts` (`fetchRealtimeToken`), `hooks/use-node-status.ts`.

## Plan
1. Install `@inngest/realtime` (ask); add `realtimeMiddleware` to the Inngest client.
2. A `channel` per node type (`manual-trigger`, `http-request`) with a `status` topic `{nodeId, status}`; register in `executeWorkflow` `channels`.
3. Executors publish `loading` / `success` / `error`.
4. `actions.ts` server action: `getSubscriptionToken(inngest, {channel, topics:["status"]})`.
5. `useNodeStatus({nodeId, channel, topic, refreshToken})` hook -> latest status message.
6. `BaseExecutionNode` + `NodeStatusIndicator` show state; wire into both nodes.

## Risks
Retries re-publish `loading`; ensure `error` always published before throwing.

## Acceptance
Run workflow: nodes flip to loading then success; failing HTTP shows error state.

## understand.md topics
Pub/sub, channels/topics, subscription tokens, why realtime instead of polling.

## Out of scope
New node types.

## Verified against reference (code read)
- One channel file per node type (e.g. `http-request-execution`), each with a `status` topic typed `{nodeId, status}`; all channels listed in the `executeWorkflow` function config.
- Inngest client uses `realtimeMiddleware()` from `@inngest/realtime/middleware`.
- Each node has `actions.ts` (`"use server"`) exporting `fetch<Node>RealtimeToken()` via `getSubscriptionToken`.
- `useNodeStatus` uses `useInngestSubscription({refreshToken, enabled: true})`, filters messages by channel/topic/nodeId and picks the newest.
- `BaseExecutionNode` handles delete (removes node + attached edges), settings, double-click, and shows `NodeStatusIndicator`.
