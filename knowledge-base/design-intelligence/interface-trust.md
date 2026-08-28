# Interface Trust And Data Provenance

Use this module for interfaces that display operational state, external data, generated analysis, cached or imported results, health claims, environment labels, or exports. Create an `interface-trust.yaml` from `interface-trust.template.yaml` before implementing consequential actions or operational status UI.

## Trust Boundary

Treat four facts as separate state dimensions:

```text
dataMode: demo | live | hybrid | imported | cached
connection: unknown | checking | connected | degraded | disconnected
resultOrigin: live | simulated | imported | cached
freshness: status plus offset timestamp plus IANA timezone
```

A working interface does not prove a working backend. A successful local simulation does not prove external connectivity. A connected health endpoint does not prove that the displayed result came from that endpoint. Bind each claim to the source that establishes that exact fact.

## Step 1: Inventory Sources

Give every source a stable identifier, kind, authority, description, and evidence location when available.

- Use `runtime-probe`, `authenticated-api`, or `runtime-processing` only for facts observed at runtime. Record `checkedAt` with an offset.
- Use `demo-fixture` or `local-simulation` for demonstration content. Never relabel it as live output.
- Use `import-record` for imported data and `cache-record` for cached data. Preserve their original timestamps and scope.
- Use `configuration` for deployment or environment declarations. Configuration may identify an intended environment but cannot prove service availability.
- Use `user-input` only for values explicitly supplied by the user. Do not convert user intent into a verified external fact.

Do not place credentials, realistic secret placeholders, tokens, passwords, or API keys in the contract, UI, examples, source, or screenshots. Declare only an approved credential source such as environment configuration, a secret manager, OAuth, or runtime user entry.

## Step 2: Define Product States

Model at least one concrete state for each required scenario:

1. `demo`: demo data with simulated result origin.
2. `live`: runtime-derived live mode, connected state, and live result origin.
3. `fallback`: a failed or degraded primary path producing an explicitly non-live result with limitations.
4. `stale`: cached or imported content whose age is explicit.
5. `disconnected`: runtime-derived disconnection with preserved context and a recovery action.

For each state, declare data mode, connection, result availability and origin, freshness, environment, scope, limitations, sources, and recovery action where applicable. Use `unknown` rather than guessing. Use `checking` while evidence is pending. Keep partial and stale content usable, but never visually merge it with current live output.

## Step 3: Bind Every Claim

Record each visible operational claim with its state, kind, text, classification, sources, locations, and visibility.

- `verified` means the cited source establishes the claim.
- `demonstration` means the cited fixture or local simulation establishes only demonstration behavior.
- `unknown` means the interface explicitly declines to assert a value. Unknown claims do not require a source.

Labels such as `operational`, `online`, `connected`, `production`, and `live` require verified evidence. A green dot, shield, pulse, or success color does not establish status. Pair state color with explicit text and evidence-derived semantics.

Keep data mode in the application shell. Before a consequential action, show data mode and processing boundary next to the action. Do not hide trust information in help text, a settings page, an obstructive watermark, or an export-only disclaimer.

## Step 4: Preserve Disclosure Through Processing

For live work, distinguish connection checking, request acceptance, processing, result delivery, and result provenance. Do not collapse them into one `online` state.

For fallback work, preserve data mode, result origin, and limitations in all of these locations:

```text
shell -> loading -> result -> history -> export
```

For stale content, preserve the observed timestamp, timezone, scope, and stale label in the result, history, and export. For disconnection, preserve the last usable context, prohibit unsupported current-state claims, and provide a concrete retry, reconnect, import, or offline action.

## Step 5: Preserve History And Export Provenance

History and exports must retain the same provenance visible in the interface:

- Data mode.
- Connection state at capture time.
- Result origin.
- Freshness timestamp and timezone.
- Environment.
- Scope.
- Limitations, including an explicitly empty limitation set when none are known.

An export is incomplete when it strips demo, fallback, cached, imported, stale, or disconnected context. A history row is misleading when it shows success without the processing path and result origin.

## Step 6: Validate And Verify

Validate the declaration:

```bash
npm run validate-trust -- --contract PATH
```

Or use the MCP tool `validate_interface_trust`.

Resolve every error before implementation is treated as trust-complete. Then verify the rendered interface and runtime behavior separately. The contract validator cannot prove that the UI displays a claim, that a source is reachable, that timestamps update, or that users understand the disclosure. Item 6 browser checks and Item 8 attributable review close those evidence gaps.

## Rejection Patterns

Reject or remediate these patterns:

- `System operational` derived from the frontend mounting successfully.
- `Connected` derived from a configured URL without a runtime request.
- `Production` shown because an environment variable has a production-like name.
- A simulated result displayed after a network failure without persistent fallback disclosure.
- A cached metric shown without its observed time, timezone, and scope.
- A history row or export that removes demo, fallback, imported, cached, stale, or disconnected provenance.
- A realistic credential string or placeholder committed for visual completeness.
- A watermark that obstructs the task while the shell and result omit readable trust labels.
