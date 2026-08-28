# Azure Optimizer V2 Benchmark

This is the independently tracked Azure product fixture for ZtotheZ Design Engineering V2 Item 7. It preserves the normalized comparison dataset and task model while implementing the interface trust, information design, visual polish, accessibility, and quality-gate contracts.

The fixture does not connect to an Azure tenant. The connected scenario exercises a real local HTTP analysis boundary over the imported comparison dataset. Demo, fallback, stale, partial, and disconnected states remain visibly distinct in the interface and exported evidence.

## Run

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Use the evidence scenario selector or a `state` query parameter: `demo`, `live`, `slow`, `fallback`, `disconnected`, `partial`, or `stale`.

Run the production build on a specific port with `PORT=7860 npm start`.

## Verify

```bash
npm run test
npm run build
```

Repository-level static and browser gates are run from the parent ZtotheZ Design Engineering repository.
