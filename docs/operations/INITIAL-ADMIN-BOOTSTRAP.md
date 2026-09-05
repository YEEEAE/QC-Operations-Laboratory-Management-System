# Initial administrator bootstrap

This is an explicit, one-time production operation. It never runs during build, deploy, migration, or application startup.

1. Confirm the deployed Web Service is using the intended release, all migrations are complete, and the approved Foundation role/permission seed has completed.
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

4. The safe successful result is `Initial administrator created successfully.` If no approved role-permission grants exist yet, the command also says that grants still require approved configuration. It does not invent or grant permissions.
5. Sign in at `https://qclevel.top/login` with identity `yazeed` and the configured password. Verify authentication first and authorization separately.
6. Immediately remove `BOOTSTRAP_ADMIN_PASSWORD` from Render. Remove `BOOTSTRAP_ADMIN_IDENTITY`, `BOOTSTRAP_ADMIN_DISPLAY_NAME`, and optional email as well unless there is an approved reason to retain them.

If the identity already exists, the command prints `Bootstrap admin already exists. No changes were made.` It never changes passwords, activation state, roles, scopes, or permissions on an existing account. Use the approved password-management workflow for later changes.

The command fails closed when migrations are pending, the canonical `ADMIN` role is missing/inactive, the database is unreachable, or required bootstrap values are invalid. All user, role, scope, and audit writes are one transaction, so a failed assignment rolls back the entire bootstrap.
