/* global process */

import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

import { normalizeServerManifest } from './scripts/release/normalize-server-manifest.mjs';

// QC-100-FINAL-036-B — deterministic build identity.
//
// Astro generates a fresh random AES key for every build unless `ASTRO_KEY` is
// provided, and embeds it in the SSR manifest. That makes two builds of the
// same source differ, so a promoted artifact can never be proven identical to
// the verified one (DEP-003 "build once, promote the same artifact").
//
// The value below is a fixed, NON-SECRET build constant: this application does
// not enable `astro:env` `getSecret` (`experimentalEnvGetSecretEnabled` is
// false) and no source path reads `ASTRO_KEY`, so the key never protects a
// runtime secret. An operator-supplied `ASTRO_KEY` still takes precedence, and
// rotating it is a build-only change that requires a fresh verification run.
const REPRODUCIBLE_BUILD_KEY = 'RbH1wUkRk5KoP8yrQnlb+c1bDVIs955tAtOcA4AwIAk=';
process.env.ASTRO_KEY ??= REPRODUCIBLE_BUILD_KEY;

let serverDirectory;

// The generated server-manifest chunk embeds its own file name, which is
// derived from its own hash — a fixed point that resolves differently between
// builds. Renaming it to a stable name after the build is what actually makes
// the emitted tree reproducible; see scripts/release/normalize-server-manifest.mjs.
const deterministicServerManifest = {
  name: 'qc-deterministic-server-manifest',
  hooks: {
    'astro:config:done': ({ config }) => {
      // `astro:build:done` reports the client directory for server output, so
      // capture the resolved server directory here instead.
      serverDirectory = fileURLToPath(config.build.server);
    },
    'astro:build:done': async ({ logger }) => {
      const result = await normalizeServerManifest(serverDirectory);
      logger.info(
        result.normalized
          ? `deterministic output: ${result.manifest} normalized (${result.references} reference(s) in ${result.rewritten.join(', ')})`
          : 'deterministic output: server manifest already stable',
      );
    },
  },
};

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [deterministicServerManifest],
  security: {
    checkOrigin: true,
  },
  build: {
    // SECURITY-ARCHITECTURE §76/§77: CSP has no unsafe-inline in production,
    // so stylesheets must be emitted as external files, never inlined <style>.
    inlineStylesheets: 'never',
  },
  vite: {
    ssr: {
      // Astro 4 Actions require its own Zod 3 constructors. Externalizing
      // bare `zod` imports makes the standalone bundle resolve app Zod 4
      // instead, crashing form parsing on missing ZodEffects/ZodPipeline.
      noExternal: ['zod'],
    },
    build: {
      // §196: production source-map exposure is POLICY-DEPENDENT; stay off
      // until an approved policy exists.
      sourcemap: false,
    },
  },
});
