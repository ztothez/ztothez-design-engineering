# SceneStart Source Evidence

## Snapshot

- Source workspace: `/home/ztothez/Studio/portfolio/scenestart`
- Observed: 2026-08-26
- Ownership context: user-owned portfolio project
- Runtime dependency: none; these paths are provenance references only
- Current stack: TanStack Start, React, TypeScript, Tailwind CSS, Canvas 2D, browser localStorage

## Observed Product Contracts

- `/studio` composes one to eight timed scenes, persists a version 2 project locally, previews the complete timeline, saves an editable JSON recipe, and exports a self-contained HTML production once at least three scenes exist.
- Studio scene duration is clamped between 2 and 60 seconds. Total duration is derived from scene state rather than entered as an unrelated display metric.
- Studio imports accept version 2 JSON under 64 KB, coerce known fields, clamp parameter values, reject malformed input, and do not upload the file.
- Exported productions embed sanitized project data and deterministic effect renderers. They start through keyboard or pointer input, support Escape, contain inline CSS and JavaScript, and do not call remote resources.
- `/workshop` provides six persisted steps that produce a three-scene project. Completion can export the artifact or save the same project into Studio.
- `/learn` exposes hands-on labs, guided tool paths, and hardware or submission companions without pretending every discipline is a browser editor.
- Learning and workshop progress use versioned localStorage records. Restored values are coerced against current registries and impossible values are discarded or clamped.
- `/learn/release` stores a local provenance ledger, distinguishes unresolved rights, generates plain-text `readme.txt`, and states that SceneStart does not certify rights or competition eligibility.
- `/privacy` states that creative state is local, identifies the hosting boundary, distinguishes optional external links, and explains deletion through browser site data.

## Integrity Boundaries

- Public application pages can link to independent learning tools and support services, but those links are not required for authoring or exported playback.
- The hosted application itself uses same-origin assets and hosting infrastructure. Only the downloaded production is required to run without network access.
- Canvas screenshots prove that pixels render, not that the artistic result is correct or pedagogically effective.
- Completion counters are derived from owned state; they are not community statistics, certification, or evidence of representative-user success.

## Snapshot Hashes

| Source | SHA-256 |
|---|---|
| `README.md` | `f9b08941a1ae4993021060a261b4ce4a9ed9af07da784dfff9a2cacb5fd5f59c` |
| `package.json` | `987424a9ad604b9c8ef254f60656560b64f4da18ef8b9c72cc62418ed0bf10b4` |
| `src/lib/demo/studio-project.ts` | `ab92e84cf1c3243b374903b1c08d3e01b8a6048a99157dd2f2f32b99e7c61bf7` |
| `src/lib/demo/studio-export.ts` | `250467ac0fb602609d9d9acb41afe6ca92ed60cd31dc00ebf197b953956967c6` |
| `src/components/demo/GuidedWorkshop.tsx` | `b49aa880e8cf22cf729e450468b4b4e878fc84aa8284cdf4c932fbe2124383fc` |
| `src/lib/demo/foundation-progress.ts` | `961acfebfe90c9bb2fc1bfbacb83d6be3eaac8745c3d9466e08054b855a2ed0c` |
| `src/lib/demo/release.ts` | `6abd81738ad566ba6aaaf10b869e4fe306614b8903c06f5c1a16491cdd659195` |
| `src/routes/privacy.tsx` | `f9d3efe82efd9b175a6ccc0647fc8047b3719e99a6a3dea00e86ce1f470e868e` |

If a source hash changes, inspect the current implementation and update this evidence record before changing the contract. A hash mismatch is a review trigger, not proof of regression.
