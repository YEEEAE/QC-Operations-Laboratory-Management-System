# Sites Worker ESM starter

Use this starter for a static microsite, click counter, or simple internal UI whose state is browser-scoped. It has no dependencies and needs no install.

Edit `worker/index.js`. Use the Sites checkpoint when a coherent milestone is ready to inspect or share; the remote builder then runs the checked-in build and validation scripts. Do not run them as a normal pre-checkpoint step.

The build copies only `worker/index.js` and `.openai/hosting.json`. Do not add standalone asset files. Embed any essential raster bytes in `worker/index.js` and serve or reference them as a data URL.

For targeted diagnosis after a remote build failure, the same commands are available in the Sites Linux environment:

```sh
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

The deterministic build produces:

```text
dist/
├── .openai/
│   └── hosting.json
└── server/
    └── index.js
```

`dist/server/index.js` is an ES module with a default export containing `fetch(request, env, ctx)`. Edit `worker/index.js`, not the generated file under `dist/`.
