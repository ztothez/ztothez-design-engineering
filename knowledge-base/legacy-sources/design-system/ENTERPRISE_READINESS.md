# Enterprise Readiness Notes

These notes define runtime and UX expectations for tools that may move from local or internal use toward production use.

---

## Runtime Posture

- Environment-driven configuration with production validation.
- Authentication for every non-health endpoint when deployed beyond local development.
- Host allowlist enforcement.
- Request IDs on every response for support and debugging.
- Security headers and no-store caching where sensitive data appears.
- Unauthenticated liveness checks for health monitoring.
- Metrics endpoints for operational visibility when appropriate.
- Request body size limits before expensive API or AI work starts.
- Local state, seed data, certificates, caches, generated histories, and exports ignored by default unless intentionally versioned.

---

## Production Environment

In production, startup should fail unless:

- Authentication credentials or identity-provider configuration are present.
- Secrets meet minimum length and storage requirements.
- Allowed hosts are explicit and do not include wildcard access.
- Data retention and export locations are documented.

---

## UX Requirements

- Show auth state and current workspace/organization context.
- Show health, rate-limit, and request-ID details where users need support.
- Explain local, private-cloud, or third-party processing boundaries.
- Preserve user input after validation, service, and rate-limit failures.
- Provide import, export, backup, reset/delete, and migration copy where the product owns user data.
- Keep destructive actions separated from primary positive actions.

---

## Data Policy

Do not keep personal exports, seed data, generated histories, or TLS keys in source folders by default. Use explicit backup/export flows and keep user-owned backups outside the source tree unless the repository is intentionally designed to store them.
