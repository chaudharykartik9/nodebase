# T18: AI nodes (Gemini, OpenAI, Anthropic)

**Branch:** `18-ai-nodes` · **Size:** L · **Depends on:** T15, T17

## Goal
Three AI nodes that take templated prompts, call the provider with a user credential, and return text into the workflow context.

## Reference
`features/executions/components/{gemini,openai,anthropic}/*`, `inngest/channels/*`, `ai` SDK (`generateText`), `@ai-sdk/*`.

## Plan
1. Install `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic` (check current versions).
2. Enum values; migration; registries (components, executors, channels, selector).
3. Per node: `dialog.tsx` (variable name, credential select filtered by type, model, system prompt, user prompt with Handlebars), `executor.ts` (load credential by id + user, decrypt server-side, `generateText`, return `{[variableName]: {text}}`), `node.tsx`, `actions.ts`.
4. `experimental_telemetry` optional (needs Sentry; skip until T21).
5. Share common code between the three where it's obviously identical, but keep nodes separate like the reference.

## Risks
Prompt injection from templated data; API costs during testing; model name deprecation: verify names at implementation time.

## Acceptance
Workflow Manual -> HTTP -> AI node produces text using a stored credential; missing credential gives a clear error.

## understand.md topics
LLM API calls, system vs user prompt, templating context data into prompts, credential lookup.

## Verified against reference (code read, Gemini executor)
- Flow: publish loading -> validate `variableName`, `credentialId`, `userPrompt` (NonRetriableError) -> compile Handlebars prompts (default system prompt `"You are a helpful assistant."`) -> `step.run("get-credential")` scoped by `userId` -> `createGoogleGenerativeAI({apiKey: decrypt(...)})` -> `step.ai.wrap("gemini-generate-text", generateText, {model: google("gemini-2.0-flash"), system, prompt, experimental_telemetry})` -> return `{...context, [variableName]: {text}}`.
- `step.ai.wrap` is Inngest's AI helper (traces in the Inngest dashboard); telemetry flags can stay on without Sentry. The model id is hard-coded in the reference: pick a current model id when implementing and consider making it a dialog field.
