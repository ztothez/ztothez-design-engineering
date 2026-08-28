# ZtotheZ Design Engineering System

[![Quality](https://github.com/ztothez/ztothez-design-engineering/actions/workflows/quality.yml/badge.svg)](https://github.com/ztothez/ztothez-design-engineering/actions/workflows/quality.yml)

ZtotheZ Design Engineering is a local-first Agent Skill, MCP server, and deterministic quality gate for building production UI and UX systems. It combines product semantics, software architecture, usability evaluation, browser verification, and evidence-backed acceptance criteria.

This project focuses on design engineering instead of style recommendation. It checks whether an interface supports real tasks, exposes coherent states, uses maintainable component boundaries, remains accessible, and produces verifiable evidence.

## Current Capabilities

- Production-ready Agent Skill in [`SKILL.md`](SKILL.md).
- Scoped MCP access to architecture, Figma, design-system, UX-pattern, and usability guidance.
- Independently authored brand, Figma production, asset-generation, iconography, presentation, licensing, and visual-accessibility modules.
- Versioned product design briefs that block generation when users, tasks, data behavior, recovery, assumptions, or acceptance evidence are materially undefined.
- Versioned design-deliverable manifests with deterministic visual direction, semantic token, typography, composition, density, state, motion, chart, rendered-evidence, contrast, provenance, icon, and presentation validation.
- Versioned interface-trust contracts for data mode, connection, result origin, freshness, fallback disclosure, and provenance-preserving records.
- Versioned operational information-design contracts for decision metrics, evidence-backed findings, chart purpose, hierarchy, exceptional states, and scalable collections.
- A bounded nine-stage interface workflow linking product task, truthful state, information hierarchy, interaction states, visual direction, semantic tokens, implementation, automated evidence, and attributable human review.
- Repository architecture audits for coupling, component size, raw design values, mock production paths, network states, accessible names, and placeholder interactions.
- Structured heuristic reviews with evidence provenance and severity-based acceptance candidates.
- Browser verification for responsive layout, clipping, overlap, focus, contrast, target sizing, keyboard behavior, text resizing, reflow, reduced motion, media, console errors, and network failures.
- Opt-in V2 browser contracts for persistent data-mode disclosure, trust-stage and fixture-state coverage, chart names and alternatives, masked dynamic regions, and checksum-based screenshot regression detection.
- Product contracts with declarative task journeys and acceptance criteria.
- Consolidated quality gates and multi-profile release decisions.
- Executable AegisOPS and SceneStart benchmark contracts.
- Versioned positive and negative corpus benchmarks with provenance, per-dimension scoring, recommendation MRR, and explicit abstention checks.
- Exact provenance and dependency inventories with active-reference isolation checks.
- A self-contained offline runtime with approved knowledge, a serialized retrieval index, production dependencies, and SHA-256 integrity evidence.
- GitHub Actions verification with retained fixture evidence.
- A local-only portfolio registry and disposable snapshot boundary for non-destructive cross-product benchmarking.

Ranked BM25 knowledge retrieval and exact filename reads are available now. The versioned retrieval scope contains only explicitly approved distributable files and excludes local raw research and legacy archives.

## Requirements

- Node.js 22 or newer
- npm
- Chromium for browser verification
- Linux, macOS, or Windows with a Chromium executable supported by Playwright

## Quick Start

```bash
git clone https://github.com/ztothez/ztothez-design-engineering.git
cd ztothez-design-engineering
npm ci
npx --no-install playwright-core install chromium
npm run build
npm test
```

Build, install, and verify the distributable package:

```bash
npm run package:smoke
npm run release:pack
npm run release:check
npm install -g ./.ztothez-design-release/ztothez-design-engineering-2.0.0.tgz
zz-design --version
```

See [`docs/installation.md`](docs/installation.md) for source and package installation plus exact setup for Codex, Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Qoder, and Lovable.

Start the stdio MCP server:

```bash
npm start
```

The server writes diagnostics to standard error. Standard output remains reserved for MCP JSON-RPC messages.

## MCP Configuration

Build the project first, then register the compiled entrypoint as a stdio MCP server. Use absolute paths in agent configuration files.

```json
{
  "mcpServers": {
    "ztothez-design-engineering": {
      "command": "node",
      "args": [
        "/absolute/path/to/ztothez-design-engineering/dist/cli/index.js"
      ],
      "env": {
        "ZTOTHEZ_DESIGN_ENGINEERING_ROOT": "/absolute/path/to/ztothez-design-engineering"
      }
    }
  }
}
```

Use the equivalent stdio MCP fields in Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex, Qoder, or another MCP-capable environment. Lovable Desktop can register the same executable as a custom local MCP server.

The package declares two equivalent MCP executable names:

- `ztothez-design`
- `zz-design`

The release archive is checked against an explicit distribution allowlist and installed into an empty temporary project during `npm run package:smoke`. Raw research and historical sources are not included. `npm run release:check` verifies the offline runtime, checksums, approved retrieval index, and launch path without using the repository's installed packages.

## MCP Tools

| Tool | Purpose |
|---|---|
| `search_design_knowledge` | Search approved knowledge with deterministic BM25 ranking, source paths, excerpts, confidence, and explicit no-match output. |
| `evaluate_corpus_benchmark` | Score maintained positive and negative cases for retrieval, abstention, architecture, task completeness, and anti-slop behavior. |
| `get_architecture_spec` | List or read approved architecture guidance. |
| `get_figma_system_rules` | List or read Figma and design-system guidance. |
| `get_design_intelligence` | List or read maintained brand, asset, icon, presentation, licensing, and visual-accessibility modules. |
| `validate_product_design_brief` | Validate evidence-backed product intent, primary audiences, outcomes, tasks, data, states, assumptions, requirements, and generation readiness. |
| `compile_design_plan` | Deterministically compile a valid brief into traceable architecture, contract, token, responsive, asset, stage, and verification decisions. |
| `validate_design_deliverable` | Validate visual polish, semantic tokens, responsive composition, states, motion, charts, evidence readiness, contrast, provenance, icons, and presentations. |
| `validate_interface_trust` | Validate operational claims, source traceability, fallback and stale states, disconnected recovery, and history or export provenance. |
| `validate_information_design` | Validate metrics, findings, chart decisions, value states, large collections, operational hierarchy, and answer-flow tasks. |
| `evaluate_interface_comparison` | Validate anonymous comparison methods, required stages, retained claim evidence, and attributable human or representative-user records. |
| `get_dashboard_pattern` | List or read approved dashboard and UX patterns. |
| `get_usability_evaluation` | List or read usability-evaluation guidance and schemas. |
| `validate_product_contract` | Validate a product archetype, primary tasks, recovery states, narrow paths, sources, journeys, and cross-references. |
| `evaluate_heuristic_review` | Validate a structured review and derive candidates from unresolved severity 3 and 4 findings. |
| `audit_repository_architecture` | Scan a repository against deterministic architecture and anti-slop rules. |
| `verify_ui_runtime` | Run browser checks and capture runtime evidence. |
| `run_design_quality_gate` | Combine contract, audit, runtime, acceptance, and human evidence into one decision. |
| `aggregate_design_quality_gates` | Combine required journey-profile reports into a release decision. |
| `list_portfolio_projects` | List explicitly enabled local benchmark IDs and effective capabilities without source roots. |
| `get_portfolio_benchmark_report` | Read a completed local benchmark summary without starting commands. |

Knowledge tools enforce category boundaries, Markdown-only reads, file-size limits, and path-traversal protection. `SKILL.md` remains authoritative when supporting documents conflict.

Search before opening deep reference files:

```text
Call search_design_knowledge with:
query: "semantic design tokens for operational status states"
categories: ["skill", "design-intelligence", "architecture"]
limit: 5
```

The search index is defined by `knowledge-base/retrieval-scope.yaml`. A no-match response is a valid result. Do not replace it with content from ignored research or legacy archives.

## Command Line Workflows

Validate and inventory the ignored local portfolio registry:

```bash
zz-design portfolio validate-registry
zz-design portfolio inventory
```

Create, verify, and delete a disposable snapshot without running a command in the original project:

```bash
zz-design portfolio snapshot --project scenestart
```

Use `--keep` only when an isolated adapter needs the snapshot for a later local stage. The local
registry lives at `.ztothez-design-local/portfolio-registry.yaml`; snapshots live under
`.ztothez-design-benchmarks/`. Both are excluded from Git and package output. Linux executable
stages use Bubblewrap and fail closed when process isolation is unavailable.

Run a complete isolated baseline or cohort and verify source integrity:

```bash
zz-design portfolio baseline --project scenestart --run scenestart-baseline
zz-design portfolio benchmark --cohort development --run development-001
zz-design portfolio verify-unchanged --run development-001
zz-design portfolio report --run development-001
```

Projects with a declared static fixture and product contract also run browser journeys, the
consolidated quality gate, optional heuristic review, and checksummed artifact capture.

Audit a repository:

```bash
npm run audit -- --repo PATH_TO_APPLICATION --fail-on error
```

Validate a product contract:

```bash
npm run validate-contract -- \
  --contract knowledge-base/benchmarks/aegisops/product-contract.yaml \
  --project-root .
```

Evaluate a heuristic review:

```bash
npm run review-heuristics -- \
  --review knowledge-base/usability-evaluation/heuristic-review.template.yaml
```

Validate a product design brief before planning generation:

```bash
npm run validate-brief -- \
  --brief knowledge-base/design-intelligence/product-design-brief.template.yaml
```

The installed CLI provides the same report with `zz-design validate-brief --brief PATH`.

Compile the validated brief into a deterministic, traceable design plan:

```bash
npm run compile-plan -- \
  --brief knowledge-base/design-intelligence/product-design-brief.template.yaml \
  --project-root . \
  --json
```

The installed CLI equivalent is `zz-design compile-plan`. Planned downstream contracts remain
provisional rather than being reported as implementation-ready.

Generate a new independent React and TypeScript fixture from a ready plan:

```bash
mkdir -p .ztothez-design-generated
zz-design generate-react \
  --plan path/to/ready-design-plan.json \
  --generation-root .ztothez-design-generated \
  --output .ztothez-design-generated/example-app \
  --portfolio-registry .ztothez-design-local/portfolio-registry.yaml \
  --json
```

The output directory must not exist. Generation fails when the plan is not implementation-ready,
the registry is invalid, a path is symlinked or escaping, or the target overlaps a read-only
portfolio root. Version 1.0 creates a new independent fixture only; it does not patch an existing
repository. See `knowledge-base/design-intelligence/generation-adapter.md`.

Validate a design-intelligence deliverable:

```bash
npm run validate-design -- \
  --manifest knowledge-base/design-intelligence/design-deliverable.template.yaml
```

Validate interface trust and data provenance:

```bash
npm run validate-trust -- \
  --contract knowledge-base/design-intelligence/interface-trust.template.yaml
```

Validate operational information design:

```bash
npm run validate-information -- \
  --contract knowledge-base/design-intelligence/information-design.template.yaml
```

Validate an interface comparison and require complete release evidence:

```bash
npm run validate-comparison -- \
  --methodology knowledge-base/benchmarks/interface-quality/comparison-methodology.template.yaml \
  --review knowledge-base/benchmarks/interface-quality/review.template.yaml \
  --require-release-ready
```

Omit `--require-release-ready` while preparing an honest incomplete review. Structural validation can pass while the release decision remains blocked by missing stages or evidence classes.

Compile only reviewer-supplied sessions marked `complete`:

```bash
npm run compile-comparison -- \
  --methodology knowledge-base/benchmarks/azure-optimizer/v2-human-review-methodology.yaml \
  --base-review evidence/interface-quality/azure-v2-review/review.yaml \
  --sessions evidence/interface-quality/azure-v2-review/reviewer-packet/completed-sessions \
  --output evidence/interface-quality/azure-v2-review/review.completed.yaml \
  --require-release-ready
```

The compiler hashes each source session and reports matrix completeness, counterbalancing, category scores, task metrics, and the anonymous target-versus-comparator decision. It rejects draft templates and never creates human observations.

Assess a disclosed maintainer review without claiming independent validation:

```bash
npm run assess-maintainer -- \
  --methodology knowledge-base/benchmarks/azure-optimizer/v2-human-review-methodology.yaml \
  --review evidence/interface-quality/azure-v2-review/review.completed.yaml \
  --output evidence/interface-quality/azure-v2-review/maintainer-assessment.json \
  --require-engineering-ready
```

The solo-maintainer track may authorize continued engineering when the target stages and maintainer-scored categories pass. It never changes the anonymous comparison thresholds or converts maintainer evidence into representative-user or external release evidence.

Evaluate the maintained system corpus:

```bash
npm run evaluate-corpus
```

Verify a running interface:

```bash
npm run verify-ui -- \
  --url http://127.0.0.1:3000 \
  --journeys knowledge-base/benchmarks/aegisops/journeys.json \
  --profile responsive-overview \
  --output .ztothez-design-runtime/responsive-overview
```

Create and then compare a screenshot baseline while masking only declared dynamic regions:

```bash
npm run verify-ui -- \
  --url http://127.0.0.1:3000 \
  --dynamic-selector "[data-runtime-clock]" \
  --screenshot-baseline evidence/runtime/screenshots.json \
  --update-screenshot-baseline

npm run verify-ui -- \
  --url http://127.0.0.1:3000 \
  --dynamic-selector "[data-runtime-clock]" \
  --screenshot-baseline evidence/runtime/screenshots.json
```

Screenshot matching establishes only that the captured pixels and masking policy are unchanged in the current environment. It does not establish visual quality, task success, or approval of an intentional change.

When Playwright cannot launch Chromium directly in a managed environment, start Chromium with a
loopback CDP endpoint and set `ZTOTHEZ_DESIGN_CHROMIUM_CDP_URL` to its HTTP origin. Only loopback
origins are accepted:

```bash
chromium --headless --no-sandbox --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 --user-data-dir=/tmp/ztothez-design-cdp about:blank

ZTOTHEZ_DESIGN_CHROMIUM_CDP_URL=http://127.0.0.1:9222 npm run verify-ui -- \
  --url http://127.0.0.1:3000
```

Run a complete profile quality gate:

```bash
npm run quality-gate -- \
  --contract knowledge-base/benchmarks/aegisops/product-contract.yaml \
  --repo PATH_TO_APPLICATION \
  --project-root . \
  --url http://127.0.0.1:3000 \
  --profile responsive-overview \
  --output .ztothez-design-quality-gate/responsive-overview \
  --fail-on error
```

Run `npm run COMMAND -- --help` for the complete options supported by each CLI workflow.

## Evidence Model

The system keeps evidence types distinct:

1. Automated evidence records deterministic source, contract, browser, network, and state checks.
2. AI-assisted expert evidence identifies likely usability risks but does not represent user behavior.
3. Human-expert evidence requires an attributable reviewer.
4. Representative-user evidence records observed task performance with appropriate study context.

AI agents must never create human attestations or present generated observations as representative-user evidence. Open severity 3 and 4 heuristic findings become acceptance-criterion candidates that require review before contract integration.

## Knowledge Precedence

Use sources in this order:

1. Current product requirements and repository behavior.
2. Root [`SKILL.md`](SKILL.md).
3. The selected benchmark contract and manifest.
4. Maintained files in [`knowledge-base/`](knowledge-base/INDEX.md).
5. Public standards or official platform documentation when the maintained corpus has a declared gap.

Historical research is outside the supported workflow. It is not a runtime dependency, retrieval fallback, implementation authority, or source to copy into production code. The authoritative workflow in [`SKILL.md`](SKILL.md) and the independence rules in [`ROADMAP.md`](ROADMAP.md) govern all new capabilities.

## Repository Layout

| Path | Purpose |
|---|---|
| `SKILL.md` | Authoritative Agent Skill instructions. |
| `src/server.ts` | MCP server and tool registration. |
| `src/audit/` | Static repository audit engine. |
| `src/runtime/` | Browser verification and evidence capture. |
| `src/contracts/` | Product-contract and journey validation. |
| `src/heuristics/` | Structured heuristic-review evaluation. |
| `src/design-intelligence/` | Design-deliverable schema, provenance, token, contrast, icon, and presentation validation. |
| `src/interface-trust/` | Interface-state truth, claim-source traceability, and history or export provenance validation. |
| `src/information-design/` | Operational metric, finding, chart, hierarchy, collection, and answer-flow validation. |
| `src/product-brief/` | Evidence-backed product intake and generation-readiness validation. |
| `src/comparison/` | Anonymous comparison, claim-ledger, evidence-integrity, and release-readiness validation. |
| `src/corpus/` | Versioned corpus loading, deterministic case evaluation, scoring, and reporting. |
| `src/retrieval/` | Approved-scope Markdown indexing and deterministic BM25 search. |
| `src/quality-gate/` | Consolidated profile quality gate. |
| `src/aggregate/` | Multi-profile release aggregation. |
| `cli/` | Stdio server and command-line entrypoints. |
| `knowledge-base/` | Approved maintained guidance, schemas, benchmarks, provenance, and dependency records. |
| `tests/` | Contract, MCP, audit, runtime, and quality-gate regression tests. |
| `ci/` | Deterministic fixture and product-workflow example. |
| `.github/workflows/quality.yml` | Active repository quality workflow. |

## Development

```bash
npm run build
npm run typecheck
npm test
npm run independence:check
npm run release:check
```

The active GitHub workflow also validates clean-room isolation, both benchmark contracts, the maintained corpus, packed installation, offline release, an archive-free workspace mirror, and the deterministic browser fixture gate. It uploads the resulting evidence. See [`ci/README.md`](ci/README.md) before adapting the multi-profile workflow to a product repository.

## Project Status

All nine V1, V2, and V3 roadmap items are implemented. See [`ROADMAP.md`](ROADMAP.md), [`V2-ROADMAP.md`](V2-ROADMAP.md), and [`V3-ROADMAP.md`](V3-ROADMAP.md) for evidence-backed status and completion criteria. V2 includes an external anonymous human visual comparison of five candidates; it validates the static visual questions asked and does not claim interactive representative-user testing. V4 Items 1 and 2 implement evidence-gated product briefs and deterministic design-plan compilation. The remaining generation-quality program is defined in [`V4-ROADMAP.md`](V4-ROADMAP.md).
