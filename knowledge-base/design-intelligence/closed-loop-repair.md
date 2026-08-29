# Closed-Loop Verification And Repair

Use bounded repair only for a `react-typescript-vite` fixture created by the maintained generation
adapter. This workflow does not merge into an existing repository, operate against a protected
portfolio project, or authorize release.

## Required Inputs

1. Start from a fresh architecture or runtime finding produced by the complete quality gate.
2. Bind the finding to one acceptance criterion in the selected product-contract profile.
3. Declare the complete expected evidence set: contract validation, static audit, browser runtime,
   and responsive screenshots.
4. Describe each change as an exact text replacement in a generation-manifest-owned file. Include
   the complete pre-repair file SHA-256 digest and exact occurrence count.
5. Declare one to three attempts in advance. Do not add an attempt after seeing a failed result.

Validate requests with `repair-request.schema.yaml`. A valid request is permission to attempt only
the declared replacements; it is not permission to redesign the fixture or alter another file.

## Execution Workflow

### Step 1: Authorize The Target

- Require an existing real generation root, a child target, the target's
  `ztothez-design-generation.json`, and a passing local portfolio registry.
- Reject target or manifest symlinks, path traversal, files absent from the generation manifest,
  and any overlap with a read-only portfolio root.
- Keep the evidence output outside the target. Use a loopback verification URL only.
- Require the running target to return `X-ZtotheZ-Design-Plan` with the same plan ID as the
  generation manifest. Reject missing, redirected, unavailable, or mismatched runtime targets.

### Step 2: Capture Before Evidence

- Run product-contract validation, repository audit, the selected browser profile, acceptance
  evaluation, and responsive screenshot capture before writing.
- Resolve every declared finding uniquely from this fresh evidence. Stop when a finding is absent
  or ambiguous; never repair a stale description by guesswork.
- Retain route, profile, journey names, viewport geometry, browser and verifier versions, report
  digests, target plan ID, finding fingerprints, and screenshot checksums.

### Step 3: Apply One Bounded Attempt

- Verify every target file digest and exact occurrence count before the first write.
- Reject the entire attempt when any precondition fails.
- Change only the declared text in the declared files. Snapshot every other regular project file
  and reject symlinked source content.
- Never edit product contracts, generated evidence, human reviews, the generation manifest, or
  files outside the generated target.

### Step 4: Reverify Equivalent Evidence

- Revalidate the runtime plan identity, then rerun the same contract, profile, route, journeys,
  viewports, browser, tool versions, and failure threshold.
- Require matching evidence identity and preserve both before and after checksums. Screenshot
  pixels may change, but screenshot names and viewport geometry must remain comparable.
- Mark the repair successful only when all referenced findings are absent and the complete quality
  gate passes.

### Step 5: Stop Or Restore

- Stop immediately when the targeted fingerprint repeats. Do not generate another rewrite.
- Stop on changed evidence identity, a failed exact precondition, an exhausted declared attempt
  list, or a verification failure.
- Restore every operation file to its original bytes on every unresolved outcome. Verify the full
  original snapshot after restoration and retain an unresolved report.
- Preserve unrelated findings and verifier limitations. A repair cannot turn unsupported checks
  into passes.

## Command

```bash
zz-design repair-react \
  --request path/to/repair-request.yaml \
  --generation-root .ztothez-design-generated \
  --target .ztothez-design-generated/example-app \
  --portfolio-registry .ztothez-design-local/portfolio-registry.yaml \
  --contract knowledge-base/benchmarks/aegisops/product-contract.yaml \
  --project-root . \
  --url http://127.0.0.1:4173 \
  --profile responsive-overview \
  --output .ztothez-design-repair/example \
  --fail-on warning \
  --json
```

The target application must already be running at the loopback URL. The output directory must not
exist and its parent must exist.

## Evidence Boundary

- Exact replacement proves only that declared source bytes changed under verified preconditions.
- Static and browser reruns prove only their measured files, routes, states, and viewports.
- Automated evidence never creates, updates, copies, or substitutes human attestations.
- Successful repair does not update the original generation manifest and does not prove broader
  usability, domain fit, integration correctness, or release readiness.
