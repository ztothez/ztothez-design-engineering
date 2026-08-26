# Corpus Provenance

## Project-Owned Sources

The AegisOPS and SceneStart benchmark contracts are derived from repositories and product evidence owned by ZtotheZ. Their source snapshots, authority boundaries, and transformation notes are recorded in their respective `SOURCE-EVIDENCE.md` and `MANIFEST.md` files.

The compact architecture and anti-slop repositories under `cases/` were authored specifically for this project. They are synthetic behavioral fixtures, not extracted third-party application code. They are distributed under the repository license.

## Licensed Standard Reference

The visual-accessibility retrieval case refers to WCAG 2.2 concepts through independently authored query text and the independently authored ZtotheZ visual-accessibility module. It does not redistribute the WCAG specification.

- Authoritative source: https://www.w3.org/TR/WCAG22/
- License information: https://www.w3.org/copyright/document-license-2015/
- Owner: World Wide Web Consortium
- License record: W3C Document License 2015
- Transformation: concepts are expressed as an original search query and expected local source path; no normative passage is copied into the case.

## Inclusion Rules

Every corpus case must reference one source declared in `corpus.yaml`. User-owned sources require local evidence. Licensed standards require an authoritative URL, license record, attribution, and a derivation statement. Reference archives and third-party design products are prohibited as corpus authorities.
