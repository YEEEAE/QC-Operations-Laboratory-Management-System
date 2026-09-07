# Initial administrator bootstrap

This is an explicit, one-time production operation. It never runs during build, deploy, migration, or application startup.

1. Confirm the deployed Web Service is using the intended release, all migrations are complete, then run the production-safe Foundation commands from the approved operator environment:

   ```sh
   pnpm db:seed:foundation
   pnpm db:seed:foundation:check
   ```

   The check must pass before creating the initial administrator. These commands do not create users and do not require `QC_SEED_ALLOW_NON_PRODUCTION=true`.
2. In Render Environment Variables, add the following values securely. Do not put these values in `render.yaml` or Git.

   ```text
   BOOTSTRAP_ADMIN_IDENTITY=yazeed
   BOOTSTRAP_ADMIN_PASSWORD=<secure-value>
   BOOTSTRAP_ADMIN_DISPLAY_NAME=<approved-display-name>
   BOOTSTRAP_ADMIN_EMAIL=<optional-email>
   ```

   `BOOTSTRAP_ADMIN_DISPLAY_NAME` is required by the current `users` schema. The email variable is optional.
3. Open the Render Shell (or run an equivalent one-off command in the deployed Web Service) and run:

   ```sh
   pnpm bootstrap:admin
   ```

4. The safe successful result is `Initial administrator created successfully.` The bootstrap command fails closed if canonical ADMIN authorization is incomplete; it never invents or grants permissions.
5. Sign in at `https://qclevel.top/login` with identity `yazeed` and the configured password. Verify authentication first and authorization separately.
6. Immediately remove `BOOTSTRAP_ADMIN_PASSWORD` from Render. Remove `BOOTSTRAP_ADMIN_IDENTITY`, `BOOTSTRAP_ADMIN_DISPLAY_NAME`, and optional email as well unless there is an approved reason to retain them.

If the identity already exists, the command prints `Bootstrap admin already exists. No changes were made.` It never changes passwords, activation state, roles, scopes, or permissions on an existing account. Use the approved password-management workflow for later changes.

The command fails closed when migrations are pending, the canonical `ADMIN` role is missing/inactive, the database is unreachable, or required bootstrap values are invalid. All user, role, scope, and audit writes are one transaction, so a failed assignment rolls back the entire bootstrap.
