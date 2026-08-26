# Task Pattern: Document Conversion

> Reusable pattern for local or cloud document conversion, preview, categorization, and saved-output workflows.

## Section Order

1. Header with tool label, processing boundary, and theme/settings control if needed.
2. Cross-workspace navigation if this tool belongs to a suite.
3. Drop zone with file picker and drag/drop support.
4. Category or destination selector plus conversion action.
5. Preview with copy, download/open, and saved-path or destination details.
6. Recent conversions.
7. Categories or destinations.

## Rules

- Make the processing boundary explicit: local, private cloud, or third-party service.
- Do not imply local-only handling if files leave the device.
- Show destination, overwrite behavior, and retention before final conversion.
