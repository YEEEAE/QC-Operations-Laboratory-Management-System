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
    build: {
      // §196: production source-map exposure is POLICY-DEPENDENT; stay off
      // until an approved policy exists.
      sourcemap: false,
    },
  },
});
