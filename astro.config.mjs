import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
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
