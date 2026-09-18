# Starter capabilities

- **Build:** Preserve `sites()` from `./build/sites-vite-plugin` in `vite.config.ts`; `node <plugin-root>/scripts/build-site.mjs` runs the project's build script to emit the Worker, hosting metadata, and migrations.
- **Auth:** Use the bundled `app/chatgpt-auth.ts` helpers for sign-in-gated routes; do not install another auth scaffold. Preserve equivalent integrations in existing/retained projects and follow the shared authentication guidance.
- **Storage:** Declare logical D1/R2 bindings in `.openai/hosting.json` (`DB`/`BUCKET` when enabled); preserve existing binding names. Access R2 only server-side through `env` from `cloudflare:workers`. For bundled-starter D1 previews, follow [Local D1 migrations](../templates/vinext-starter/README.md#local-d1-migrations).
