# T11: Polar billing + premium gating (optional, needs your decision)

**Branch:** `11-polar-premium` · **Size:** M · **Depends on:** T09

## Goal
Gate workflow creation behind an active Polar subscription; checkout and customer portal from the sidebar; upgrade modal on FORBIDDEN errors.

## Reference
`src/lib/polar.ts`, `src/lib/auth.ts` (polar plugin), `src/trpc/init.ts` (`premiumProcedure`), `components/upgrade-modal.tsx`, `hooks/use-upgrade-modal.tsx`, `features/subscriptions/*`, sidebar billing items.

## Plan
1. Ask you: do this or skip? Needs Polar sandbox account, product ID, env vars.
2. Install `@polar-sh/sdk`, `@polar-sh/better-auth`.
3. `lib/polar.ts` client (sandbox server), env: `POLAR_ACCESS_TOKEN`, `POLAR_SUCCESS_URL`, `POLAR_PRODUCT_ID`.
4. **Modify `lib/auth.ts`** to add `polar` plugin (checkout, portal, `createCustomerOnSignUp`): this is an existing-file change; I will show the diff first.
5. `premiumProcedure` in `trcp/init.ts`; use on `workflows.create`.
6. Subscription hooks + `useUpgradeModal` (catch TRPC `FORBIDDEN`), `UpgradeModal` (alert-dialog).
7. Sidebar: Upgrade + Billing portal items.

## Risks
Altering auth config can break login/signup if the plugin is misconfigured; test auth flows after. Network calls to Polar on every `create`.

## Acceptance
Non-subscriber creating a workflow sees the upgrade modal; subscriber can create; auth flows unchanged.

## understand.md topics
SaaS billing flow; webhooks vs API checks; better-auth plugins; tRPC middleware chaining (`protectedProcedure` -> `premiumProcedure`).

## Out of scope
Multiple plans, usage limits.

## Verified against reference (code read)
- `lib/polar.ts`: `new Polar({accessToken: POLAR_ACCESS_TOKEN, server: "sandbox"})`.
- `lib/auth.ts` adds the `polar({client, createCustomerOnSignUp: true, use: [checkout({products:[{productId, slug:"pro"}], successUrl: POLAR_SUCCESS_URL, authenticatedUsersOnly: true}), portal()]})` plugin. The reference also enables GitHub/Google `socialProviders`: **not planned here**; tell me if you want OAuth login as an extra task.
- `premiumProcedure` calls `polarClient.customers.getStateExternal({externalId: user.id})` and throws `FORBIDDEN` when there is no active subscription. Credentials `create` also uses it.
- Product ID is hard-coded in the reference; ours should come from an env var.
