# Interaction And Recovery Verification

Use this protocol when a browser product contract needs executable evidence for task progress,
failure recovery, keyboard operation, exports, or offline behavior. It extends rendered runtime
verification; it does not establish usability, comprehension, backend availability, or a human
review outcome.

## Compatibility Boundary

Existing journey suites remain version `1.0`. A version `1.1` suite requires an `interaction`
declaration for every journey. Product contracts that rely on those declarations use version `1.2`.
Do not upgrade an older benchmark merely to make it appear interaction-qualified. Add a new versioned
contract only when the product owner supplies the applicable task, state, and recovery evidence.

## Journey Declaration

Each version `1.1` journey declares an `interaction` object:

```json
{
  "task": "record-decision",
  "phases": ["primary", "recovery"],
  "applicableStates": ["disconnected", "error"],
  "keyboard": true,
  "export": true,
  "offline": true
}
```

`phases: ["primary"]` requires `start` and `success` checkpoints. `phases: ["recovery"]`
requires `failure` and `preserved-state` checkpoints. Each declared applicable state requires a
checkpoint of the same name. Keyboard, export, and offline declarations additionally require
their matching checkpoint.

A checkpoint immediately follows the assertion that establishes it:

```json
{ "action": "expectValue", "selector": "#draft", "value": "priority-record-01" },
{ "action": "checkpoint", "checkpoint": "preserved-state" }
```

The verifier retains the checkpoint number, the preceding assertion number, and the observation in
the runtime report. Checkpoints are not free-form prose and cannot be used to declare evidence that
the preceding browser assertion did not observe.

## Executable Actions

Use `press` before a `keyboard` checkpoint. Use `expectDownload` before an `export` checkpoint.
Use `setNetwork` with `state: "offline"` before an `offline` checkpoint, then assert the visible
disconnected recovery state. A disconnected state that is only declared by a product scenario does
not prove the browser was offline; keep those facts separate.

Verify only states that the current product contract and data model make applicable: `loading`,
`empty`, `partial`, `stale`, `disconnected`, `unauthorized`, and `error`. Do not add synthetic
states to satisfy coverage. If the browser cannot automate a declared behavior, retain it as a
verifier limitation and keep the product result `unverified`; it is neither a pass nor a product
failure.

## Contract Binding

A version `1.2` product contract requires a version `1.1` journey suite. Every browser task
journey must declare the same task identifier. Primary tasks require a primary phase; tasks whose
recovery is required also require a recovery phase. The contract validator rejects missing or
mismatched coverage before a quality gate can treat browser output as task evidence.

## Evidence Boundary

Runtime evidence proves that a declared browser sequence completed in the configured environment.
It does not prove representative users can recover, that all real network conditions behave the
same way, that an export is semantically correct beyond the retained artifact, or that an identity
or authorization system is secure. Never generate a human or representative-user attestation from
these results.
