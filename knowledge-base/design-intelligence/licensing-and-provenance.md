# Licensing And Provenance

Maintain a per-asset evidence trail so design output can be reviewed, replaced, and distributed deliberately. This workflow organizes evidence; it is not legal advice.

## Required Asset Record

For every logo, icon, image, illustration, texture, chart, screenshot, font, audio file, or video, record:

- Stable asset identifier and local path.
- Origin and creator.
- Source URL when applicable.
- Rights status: `approved`, `pending`, `rejected`, or `unknown`.
- Rights basis: ownership, contract, provider terms, SPDX license, public domain, or permission.
- Evidence path or source URL.
- Attribution and restrictions.
- Reviewer and review date when approval requires human authority.
- Alternative-content classification.

Only `approved` assets may ship. Pending, rejected, or unknown assets are blockers, not warnings.

## Source-Specific Evidence

### Original And Commissioned

Record creator, agreement or employment basis, assignment terms when relevant, delivery date, and source files. Do not assume payment alone transfers every right.

### Open Source And Open Content

Use an SPDX identifier or expression when the applicable license is represented by SPDX. Preserve copyright notices, attribution, modification notices, source links, and license text as required. Record channel restrictions that cannot be expressed by the identifier alone.

### Licensed Libraries And Stock

Record the exact asset, account or purchase evidence, license version, download date, allowed channels, seat or audience limits, modification terms, and attribution requirements. A generic link to the provider home page is insufficient.

### Public Domain

Record the source and the basis for the public-domain claim. Review trademarks, privacy, publicity, cultural-property, and jurisdiction-specific constraints separately.

### User-Provided Assets

Record the user's representation or permission and any distribution boundary. Do not interpret possession as permission to publish.

### Generated Assets

Record provider, model, provider-terms evidence, prompt artifact, reference assets, human contributions, and post-processing. Review confusing similarity, embedded marks, recognizable people, sensitive contexts, and jurisdiction or channel requirements. Do not promise copyright protection or non-infringement based only on generation metadata.

## Operational Rules

1. Keep evidence outside generated public assets when it contains private account or contractual data.
2. Make asset replacement possible through stable IDs and semantic references.
3. Re-review assets when channels, territory, audience size, monetization, or provider terms change.
4. Keep rejected assets for audit only when policy permits; never leave them in production asset directories.
5. Treat missing evidence as unresolved even when an asset looks generic.

## Machine-Readable Identifiers

SPDX identifiers make standard licenses easier to record consistently, but they do not replace required notices or a review of whether the license fits the intended use. See [SPDX guidance for license information](https://spdx.dev/learn/handling-license-info/) and the [SPDX License List](https://spdx.org/licenses/).

For current United States guidance on copyrightability and generative AI, consult the [U.S. Copyright Office AI initiative](https://www.copyright.gov/ai/). Obtain qualified advice for consequential releases or jurisdiction-specific questions.
