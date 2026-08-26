# Task Pattern: Media Processing

> Reusable pattern for URL/file-based media processing, metadata preview, progress tracking, and saved-output workflows.

## Section Order

1. Header with tool label, processing boundary, and settings.
2. Cross-workspace navigation if this tool belongs to a suite.
3. Input row: URL or file picker, fetch/read metadata, category, quality or output preset.
4. Preview card: title, source, duration/size, available output options.
5. Active jobs with progress bars and status text.
6. Recent jobs with history table and open/export action.
7. Categories or destinations.

## Status Treatment

- Processing: info.
- Complete: success.
- Failed: danger.
- Queued: warning.

## Rules

- Make network and third-party processing explicit.
- Do not send URLs or files to outside services without clear disclosure.
- Default quality/preset should be user-centered and adjustable.
