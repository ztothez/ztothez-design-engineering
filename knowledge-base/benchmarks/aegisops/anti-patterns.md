# AegisOPS Anti-Patterns

Use these as rejection examples when generating or reviewing an AegisOPS implementation.

| Anti-pattern | Why it fails | Required correction |
|---|---|---|
| Decorative SOC shell | Panels and terminal styling exist, but the operator cannot complete a scenario-to-detection workflow | Start from the selected mode, input contract, pipeline state, evidence, and exports; apply styling afterward |
| Untraceable coverage score | A percentage appears without covered and missing observables or a validator source | Bind the score to structured validation evidence and expose the supporting lists |
| Fake live infrastructure | Static model, GPU, endpoint, latency, or throughput values appear as current status | Measure current requests or label the values as bundled demo provenance |
| Hidden demo fallback | Precomputed output is presented without a persistent Demo mode label | Label fallback before submission, in progress, in results, and in exports |
| Fixed mockup layout | The 1600 by 1000 reference is scaled or clipped at smaller widths | Recompose dense rows, stack panels, and verify all required viewports |
| Clipped operational status | `overflow: hidden` conceals a status pill, gate value, label, or action | Allow the content to wrap or change layout; use `data-ztothez-design-allow-clipping` only for verified non-semantic decoration |
| Colliding gate labels | Readiness labels and values overlap in narrow cards | Increase track constraints, stack label and value, or reduce simultaneous columns |
| Color-only readiness | Green, amber, or red is the only indication of gate state | Add explicit READY, PENDING, PASS, WARNING, or ERROR text and assistive-technology output |
| Generic agent cards | Every agent shows interchangeable copy with no input/output contract | Expose each stage's role, progress, evidence contribution, and completion state |
| Cleared failure state | A request failure removes the scenario or partial evidence | Preserve input and prior evidence, explain the failure, and provide retry and fallback actions |
| Export theater | Download buttons generate placeholders or content unrelated to the visible run | Generate from the current structured result and verify filename, MIME type, content, and failure handling |
| Raw backend failure | Stack traces, proxy internals, or unexplained status codes are shown to the operator | Log diagnostics outside JSON-RPC or UI output and present actionable recovery copy |
| Unsupported claims | Historical hackathon cost, performance, or superiority language is reused as fact | Remove it or attach current, reviewable evidence and scope |
