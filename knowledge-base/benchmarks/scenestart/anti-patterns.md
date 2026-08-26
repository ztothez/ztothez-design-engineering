# SceneStart Anti-Patterns

Use these as rejection examples when generating or reviewing SceneStart behavior.

| Anti-pattern | Why it fails | Required correction |
|---|---|---|
| Neon shell without a production model | The page resembles demoscene art but scenes cannot be ordered, timed, previewed, saved, or exported coherently | Start from the versioned project, timeline, playback states, and artifact contracts; style afterward |
| Generic SaaS dashboard | Marketing metrics, subscriptions, team cards, or analytics replace direct creation and learning | Put the authoring canvas, current task, local progress, and outputs first |
| Cloud-first project wrapper | Accounts, uploads, or remote persistence are added to a local-first workflow without a required product decision | Preserve local storage and explicit downloads; propose cloud features only as a separately reviewed mode |
| Export theater | A button downloads placeholder HTML or values unrelated to the current project | Generate from the current sanitized project and verify filename, embedded state, controls, and offline playback |
| Network-dependent offline export | Exported HTML loads fonts, scripts, images, audio, analytics, or APIs from remote origins | Inline required runtime resources and reject playback-time remote references |
| Destructive project import | Invalid or unsupported JSON clears the current production | Validate size and version first, preserve current state, and show an actionable rejection |
| Preset ownership confusion | Default scenes or tutorial values are presented as original user work | Label starter content and require the maker to own authorship and rights decisions |
| Canvas-only workflow | Critical controls, state, progress, or explanations exist only inside pixels | Keep semantic HTML controls, labels, status, and text alternatives outside the canvas |
| Automatic artistic playback | Motion starts without user intent or ignores reduced-motion needs in the authoring interface | Require explicit playback and reduce nonessential authoring animation |
| Fake progress | Completion percentages or checkmarks are hard-coded, duplicated, or unrelated to current state | Derive progress from the versioned registry and stored completion evidence |
| Countdown workshop | The fifteen-minute estimate becomes a timer, expiry, or pressure mechanic | Present it as guidance only and preserve progress without punishment |
| Quiz-first teaching | Terminology questions replace changing parameters and observing cause and effect | Use make, change, observe, complete, explain, and keep as the learning sequence |
| One universal editor | Specialist music, graphics, hardware, and release disciplines are represented by shallow fake controls | Use honest interactive labs, guided external-tool paths, or hardware/submission companions |
| Certification theater | Checklist completion is labeled Assembly-ready, rights-cleared, original, or competition-compliant | Preserve the non-certification disclaimer and direct users to current independent review |
| Fabricated community proof | User counts, success rates, streaks, testimonials, or completion times appear without evidence | Remove the claim or attach consented, current, inspectable research evidence |
| Hidden unresolved rights | Incomplete asset records disappear from the readme or are visually minimized | Keep unresolved entries visible in UI and generated output until explicitly resolved |
| External-link ambiguity | Optional learning or support links appear to be required product services | Label departures and keep creation, progress, and export independent of them |
| Fixed desktop composition | Timeline, canvas, controls, or provenance forms clip at narrow widths | Recompose at product viewports and verify 200 percent reflow and text resizing |
| Decorative status color | Completion, unresolved rights, or export readiness is conveyed only through cyan, amber, or magenta | Add explicit status text and assistive-technology announcements |
| Pixel screenshot as correctness proof | A nonblank canvas is treated as proof of scene quality or renderer parity | Pair pixel checks with deterministic tests and human visual review appropriate to the claim |
