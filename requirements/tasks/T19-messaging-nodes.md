# T19: Discord + Slack nodes

**Branch:** `19-messaging-nodes` · **Size:** M · **Depends on:** T15

## Goal
Send messages to Discord/Slack incoming webhooks with templated content from the workflow context.

## Reference
`features/executions/components/{discord,slack}/*`, channels, `html-entities` for decoding.

## Plan
1. Install `html-entities` (ask). Enum values + migration.
2. Dialog: variable name, webhook URL, content template (Discord: username optional; Slack: text).
3. Executor: render with Handlebars, decode entities, POST via `ky`, return `{[variableName]: {messageContent}}`.
4. Register everywhere (selector, components, executors, channels), logos.

## Risks
Webhook URLs are secrets: reference stores in node data in plain text; consider moving to credentials later (follow-up, ask).

## Acceptance
Run sends a message; errors show node error status.

## understand.md topics
Incoming webhooks, templating, error handling in executors.

## Verified against reference (code read, Discord executor)
- Content/username compiled with Handlebars then `decode()`d (html-entities); content truncated to 2000 chars (Discord limit); POST via `ky.post(webhookUrl, {json: {content, username}})` inside `step.run`; returns `{...context, [variableName]: {messageContent}}`. Slack not read line by line: assume the same shape and confirm when starting.
