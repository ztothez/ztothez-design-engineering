# ZtotheZ Design Engineering System

[![Quality](https://github.com/ztothez/ztothez-design-engineering/actions/workflows/quality.yml/badge.svg)](https://github.com/ztothez/ztothez-design-engineering/actions/workflows/quality.yml)

ZtotheZ Design Engineering is a local-first Agent Skill, MCP server, and deterministic quality gate for building production UI and UX systems. It combines product semantics, software architecture, usability evaluation, browser verification, and evidence-backed acceptance criteria.

This project focuses on design engineering instead of style recommendation. It checks whether an interface supports real tasks, exposes coherent states, uses maintainable component boundaries, remains accessible, and produces verifiable evidence.

## Current Capabilities

- Production-ready Agent Skill in [`SKILL.md`](SKILL.md).
- Scoped MCP access to architecture, Figma, design-system, UX-pattern, and usability guidance.
- Independently authored brand, Figma production, asset-generation, iconography, presentation, licensing, and visual-accessibility modules.
- Versioned design-deliverable manifests with deterministic token, contrast, provenance, icon, and presentation validation.
- Repository architecture audits for coupling, component size, raw design values, mock production paths, network states, accessible names, and placeholder interactions.
- Structured heuristic reviews with evidence provenance and severity-based acceptance candidates.
- Browser verification for responsive layout, clipping, overlap, focus, contrast, target sizing, keyboard behavior, text resizing, reflow, reduced motion, media, console errors, and network failures.
- Product contracts with declarative task journeys and acceptance criteria.
- Consolidated quality gates and multi-profile release decisions.
- Executable AegisOPS and SceneStart benchmark contracts.
- GitHub Actions verification with retained fixture evidence.

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

The release archive is checked against an explicit distribution allowlist and installed into an empty temporary project during `npm run package:smoke`. Raw research and legacy sources are not included.

## MCP Tools

| Tool | Purpose |
|---|---|
| `search_design_knowledge` | Search approved knowledge with deterministic BM25 ranking, source paths, excerpts, confidence, and explicit no-match output. |
| `get_architecture_spec` | List or read approved architecture guidance. |
| `get_figma_system_rules` | List or read Figma and design-system guidance. |
| `get_design_intelligence` | List or read maintained brand, asset, icon, presentation, licensing, and visual-accessibility modules. |
| `validate_design_deliverable` | Validate a versioned design manifest, token chains, contrast pairs, asset provenance, icon semantics, and presentation masters. |
| `get_dashboard_pattern` | List or read approved dashboard and UX patterns. |
| `get_usability_evaluation` | List or read usability-evaluation guidance and schemas. |
| `validate_product_contract` | Validate a product contract, source references, journeys, and cross-references. |
| `evaluate_heuristic_review` | Validate a structured review and derive candidates from unresolved severity 3 and 4 findings. |
| `audit_repository_architecture` | Scan a repository against deterministic architecture and anti-slop rules. |
| `verify_ui_runtime` | Run browser checks and capture runtime evidence. |
| `run_design_quality_gate` | Combine contract, audit, runtime, acceptance, and human evidence into one decision. |
| `aggregate_design_quality_gates` | Combine required journey-profile reports into a release decision. |

Knowledge tools enforce category boundaries, Markdown-only reads, file-size limits, and path-traversal protection. `SKILL.md` remains authoritative when supporting documents conflict.

Search before opening deep reference files:

```text
Call search_design_knowledge with:
query: "semantic design tokens for operational status states"
categories: ["skill", "figma-and-systems", "architecture"]
limit: 5
```

The search index is defined by `knowledge-base/retrieval-scope.yaml`. A no-match response is a valid result. Do not replace it with content from ignored research or legacy archives.

## Command Line Workflows

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

Validate a design-intelligence deliverable:

```bash
npm run validate-design -- \
  --manifest knowledge-base/design-intelligence/design-deliverable.template.yaml
```

Verify a running interface:

```bash
npm run verify-ui -- \
  --url http://127.0.0.1:3000 \
  --journeys knowledge-base/benchmarks/aegisops/journeys.json \
  --profile responsive-overview \
  --output .ztothez-design-runtime/responsive-overview
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
5. Archived sources only when deeper rationale is required.

Third-party archives are comparative and historical references. They are not runtime dependencies, implementation authorities, or sources to copy into production code. The authoritative workflow in [`SKILL.md`](SKILL.md) and the independence rules in [`ROADMAP.md`](ROADMAP.md) govern all new capabilities.

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
| `src/retrieval/` | Approved-scope Markdown indexing and deterministic BM25 search. |
| `src/quality-gate/` | Consolidated profile quality gate. |
| `src/aggregate/` | Multi-profile release aggregation. |
| `cli/` | Stdio server and command-line entrypoints. |
| `knowledge-base/` | Approved guidance, schemas, benchmarks, and archives. |
| `tests/` | Contract, MCP, audit, runtime, and quality-gate regression tests. |
| `ci/` | Deterministic fixture and product-workflow example. |
| `.github/workflows/quality.yml` | Active repository quality workflow. |

## Development

```bash
npm run build
npm run typecheck
npm test
```

The active GitHub workflow also validates both benchmark contracts, starts the deterministic browser fixture, runs a complete quality gate, and uploads the resulting evidence directory. See [`ci/README.md`](ci/README.md) before adapting the multi-profile workflow to a product repository.

## Project Status

The current foundation, CI activation, AegisOPS workflow, AegisOPS remediation, SceneStart benchmark, scoped knowledge retrieval, installation packaging, and design intelligence expansion are complete. The next implementation target is corpus benchmarking.

See [`ROADMAP.md`](ROADMAP.md) for evidence-backed status and completion criteria. Clean-room independence remains the final certification phase after retrieval, packaging, design-intelligence expansion, and corpus benchmarking.
