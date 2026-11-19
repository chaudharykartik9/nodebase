# T17: Credentials (schema, CRUD, encryption)

**Branch:** `17-credentials` · **Size:** L · **Depends on:** T09

## Goal
Users store API keys securely (encrypted at rest) and pick them in AI node dialogs.

## Reference
`Credential` + `CredentialType` in schema, `features/credentials/*`, `lib/encryption.ts` (cryptr), `(rest)/credentials/*` pages, `Node.credentialId`.

## Plan
1. Schema: `Credential`, `CredentialType` (OPENAI, ANTHROPIC, GEMINI), `Node.credentialId?` relation; migration (ask).
2. Install `cryptr`; `lib/encryption.ts` with `ENCRYPTION_KEY` env (add to `.env`, document in CLAUDE.md).
3. `features/credentials/server/{routers,prefetch,params-loader}.ts`: encrypt on create/update, **never return the decrypted value** to the client (getOne returns without `value`, or masked).
4. Hooks, list component (reuse entity components), form component (new/edit), pages `credentials`, `credentials/new`, `credentials/[credentialId]`.
5. Credential-type logos in `public/logos`.

## Risks
Key loss makes secrets unrecoverable; document it. Don't log values.

## Acceptance
CRUD works; DB value is ciphertext; client never sees plaintext.

## understand.md topics
Symmetric encryption, secrets management, why hash != encrypt, server-only decryption.

## Out of scope
Using credentials in nodes (T18).

## Verified against reference (code read)
- `lib/encryption.ts` is just `new Cryptr(process.env.ENCRYPTION_KEY!)` with `encrypt/decrypt`.
- Router has `create` (**premiumProcedure**), `remove`, `update`, `getOne`, `getMany` (search + pagination, same shape as workflows), and `getByType` (used by AI node dialogs to fill the credential dropdown).
- **Deviation (intentional):** reference `getOne` returns the row including the *encrypted* `value`, and `update` re-encrypts the submitted value. We will not return `value` to the client; editing a credential asks for a new value.
- Executors decrypt with `decrypt(credential.value)` after loading the credential scoped by `userId`.
