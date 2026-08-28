# Local Portfolio Benchmark Runner

The runner benchmarks authorized projects without executing inside their original roots. It creates
one disposable snapshot per project, runs only commands explicitly declared in the local registry,
checks the original source digest after execution, and retains a private structured report.

## Commands

```bash
zz-design portfolio baseline --project PROJECT_ID --run baseline-001
zz-design portfolio benchmark --cohort development --run development-001
zz-design portfolio benchmark --cohort holdout --run holdout-001
zz-design portfolio verify-unchanged --run development-001
zz-design portfolio report --run development-001
zz-design portfolio evaluate-rule --candidate rule.json --evidence rule-evidence.json --dev-run development-001 --holdout-run holdout-001
zz-design portfolio qualify-v3 --evidence qualification-evidence.json --dev-run development-001 --holdout-run holdout-001
```

Omit `--run` from `baseline` or `benchmark` to generate a timestamped run ID. Reports are written to
`.ztothez-design-benchmarks/runs/RUN_ID/report.json` with owner-only file permissions. Run IDs may
contain letters, numbers, periods, underscores, and hyphens.

## Execution Model

1. Validate the local registry and reject unapproved roots or commands.
2. Capture the project's source digest and Git revision when available.
3. Copy approved files into a disposable workspace.
4. Resolve the declared adapter and execute supported stages in fixed order.
5. Serve a declared static fixture on an approved loopback port when browser evidence is enabled.
6. Run the product contract, static audit, browser journeys, accessibility checks, acceptance
   evaluation, and optional structured heuristic review against the snapshot.
7. Stop the fixture server in all success and failure paths.
8. Continue to the next project after findings, limitations, or unsafe configuration.
9. Compare the original source against its pre-run digest before cleanup.
10. Checksum retained reports, screenshots, and exports, then remove the disposable snapshot.

The runner never discovers arbitrary package scripts. Network access, lifecycle scripts, allowed
environment variable names, timeouts, commands, arguments, and working directories come from the
validated local registry.

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | All applicable stages passed. |
| `1` | One or more stages produced product or source findings. |
| `2` | No findings occurred, but evidence is incomplete because a stage was unsupported or not applicable. |
| `3` | At least one project had unsafe or invalid execution configuration. |
| `4` | The original source changed or source-integrity verification failed. |

Higher-severity integrity and configuration conditions take precedence over findings and
limitations when a cohort contains mixed results.

## Browser Verification Declaration

Declare `verification` only when the snapshot contains a static fixture directory and a complete
product contract. The port must also appear in `execution.localPorts`, fixture mode must be
`local-fixture`, and both `local-fixture-server` and `browser-journeys` must be supported capabilities.
Dynamic services that cannot produce a disconnected static fixture remain an explicit verifier
limitation rather than receiving a false pass.

## Rule Promotion Evidence

Rule promotion is fail closed. It requires complete development and holdout cohort reports plus a
version 1.0 evidence document. The evidence document binds positive, negative, and abstention
fixtures; V1/V2, retrieval, corpus, MCP, package, and independence gates; project-specific holdout
evaluations; documentation; tests; and migration guidance to checksummed repository-relative files.
The CLI verifies every checksum and rejects missing files, path traversal, and symlink escape before
evaluating the candidate.

A missing holdout project or candidate-specific holdout report is `unverified`, never `unaffected`.
Recurrence-backed candidates require the candidate report code in every declared authoring
project's retained development report. Holdout IDs must match the locked cohort exactly. Regression
or unverified outcomes block promotion, and an all-abstention result cannot establish benefit or
non-regression.

Start from `rule-promotion-evidence.template.json` and use
`rule-holdout-evaluation.template.json` for each locked holdout. Leave gates failing until their
artifacts exist, and keep private run evidence under `.ztothez-design-benchmarks/`. The CLI parses
each referenced holdout report and verifies its candidate, report code, run, project, source digest,
applicability, execution, regression, and outcome fields; a matching checksum alone is insufficient.

## V3 Qualification Evidence

V3 qualification requires explicit checksummed CI and release evidence. No fixture or gate defaults
to passing. The evaluator enforces 12 eligible projects, five domains, three frontend stacks, four
archetypes, three locked holdouts, complete development and holdout reports, and executed
source-only, browser-only, and full-stack paths. Framework names and capability declarations alone
do not establish a benchmark path.

Start from `v3-qualification-evidence.template.json`. The qualification report emits only claims
whose specific criteria passed. Local qualification remains failed until the ignored registry and
retained runs satisfy every threshold; synthetic CI tests cannot substitute for the local corpus.

Generate a complete local evidence set with:

```bash
npm run v3:evidence -- \
  --dev-run DEVELOPMENT_RUN \
  --holdout-run HOLDOUT_RUN \
  --output .ztothez-design-benchmarks/evidence/v3-final
```

Every command report references checksummed stdout and stderr logs. The script executes maintained
rule fixtures, exact CI categories, package and offline-release checks, browser-only and full-stack
snapshot fixtures, candidate-specific holdout evaluation, and final qualification. Its output must
remain under `.ztothez-design-benchmarks/`.

`benefited` in a rule holdout report means the candidate rule detected its intended condition in a
locked product. It does not mean the source product was remediated. `unaffected` means the
applicable rule executed without that finding. Product source is never changed by this workflow.

GitHub Actions runs the public synthetic subset with `--ci-only`. That subset validates the runner's
execution paths and negative controls; it does not replace the private local corpus or support a
claim that a private product passed browser or full-stack verification.

## Read-Only MCP Access

Local portfolio MCP access is disabled by default. Enable it explicitly for a trusted local MCP
process:

```bash
export ZTOTHEZ_DESIGN_PORTFOLIO_MCP=enabled
export ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY="$PWD/.ztothez-design-local/portfolio-registry.yaml"
export ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT="$PWD/.ztothez-design-benchmarks/runs"
export ZTOTHEZ_DESIGN_PORTFOLIO_EVIDENCE_ROOT="$PWD/.ztothez-design-benchmarks/evidence"
```

`list_portfolio_projects` lists IDs and effective capabilities.
`get_portfolio_benchmark_report` reads a completed run or one project summary. Neither tool exposes
source roots or starts project commands.
