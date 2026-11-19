# T16: Webhook triggers (Google Form, Stripe)

**Branch:** `16-webhook-triggers` · **Size:** M · **Depends on:** T14, T15

## Goal
Start workflows from external events via `/api/webhooks/google-form` and `/api/webhooks/stripe`.

## Reference
`app/api/webhooks/{google-form,stripe}/route.ts`, `features/triggers/components/{google-form-trigger,stripe-trigger}/*`, `lib/utils.ts` (webhook URL), `ngrok:dev` script.

## Plan
1. Add enum values `GOOGLE_FORM_TRIGGER`, `STRIPE_TRIGGER` (migration, ask).
2. Webhook routes: read `workflowId` from query, validate body, call `sendWorkflowExecution({workflowId, initialData:{googleForm|stripe: ...}})`. **Security:** add a secret/token check (reference is minimal; we should do better).
3. Trigger node UIs: dialog shows webhook URL (copy button), Google Apps Script snippet / Stripe instructions.
4. Executors + channels like T15.
5. Dev: ngrok (`npm run ngrok:dev`), `NGROK_URL` env, `mprocs`.

## Risks
Public endpoints: validate input, never trust payload, rate-limit if possible. Ask for ngrok details before starting.

## Acceptance
POST to the webhook triggers a run visible in Inngest with payload in context.

## understand.md topics
Webhooks, tunnels, signature/secret validation, trigger vs action nodes.

## Out of scope
Stripe signature verification beyond the basic secret (follow-up).

## Verified against reference (code read)
- Both routes: `POST`, read `workflowId` from query string (400 if missing), parse JSON, call `sendWorkflowExecution({workflowId, initialData: {stripe|googleForm: {...}}})`.
- Stripe payload mapped to `{eventId, eventType, timestamp, livemode, raw}`; Google Form to `{formId, formTitle, responseId, timestamp, respondentEmail, responses, raw}`.
- Reference has **no auth/secret check** on these endpoints: our secret/token addition is a deliberate improvement; also verify the workflow exists before sending.
- Trigger executors are passthroughs (`step.run(..., async () => context)`) that publish loading/success.
