# V6 Item 9: Offline-First Distribution And Security Review

Date: 2026-09-01
Status: complete

## Distribution

- Core brief validation, plan compilation, rule retrieval, handoff export, authority compilation, and quality checks use local files only.
- Offline release verification checks checksums, runtime integrity, the exact approved knowledge boundary, and CLI version launch.
- Package smoke testing installs the generated archive and runs the installed CLI, authority, knowledge, source-removal, generation, and MCP checks.

## Security Decisions

- Package metadata excludes private registries, benchmark evidence, legacy sources, and unapproved knowledge directories.
- Private research, `.env` files, service-role configuration, user-owned source, and generated evidence stay outside Git, packages, retrieval, and runtime fallbacks.
- Portfolio execution requires explicit opt-in and configured roots. MCP portfolio access is read-only and execution uses disposable snapshots.
- Loaders protect relative roots, realpaths, regular files, and symlink boundaries.
- Runtime verification defaults to loopback URLs; repair verification is loopback-only.
- MCP diagnostics use stderr, leaving stdout reserved for JSON-RPC.
- Remote AI generation, authentication, Supabase, and hosted persistence are optional and are not imported from the Blueprint prototype.

## Decision

Item 9 is complete for the current V6 workbench boundary. New dependencies, roots, browser permissions, network origins, or package files require a fresh security review and roadmap change.
