# Asset Generation

Treat asset creation as a controlled production pipeline. Generate or source real assets only after their role, constraints, evidence, and fallback behavior are known.

## Step 1: Write The Asset Brief

For each asset, define:

- A stable identifier, one concrete purpose, and the decision or task it supports.
- Product task and location.
- Information the asset must communicate.
- Audience, channel, dimensions, crop behavior, and density.
- Brand attributes and prohibited traits.
- Required subject accuracy and details that must remain visible.
- Background, transparency, safe area, and text-overlay constraints.
- Alternative-content requirement.
- Failure behavior: hide decorative media, preserve a text alternative, show a factual placeholder,
  offer retry, or block only when the task cannot remain truthful without the asset.
- Rights and provenance requirements.

Do not use an atmospheric placeholder where users need to inspect a product, person, state, place, or result.

## Step 2: Choose A Production Method

Use existing approved assets when they satisfy the brief. Use licensed libraries for commodity imagery or media when terms fit the channels. Commission or create original work when distinctiveness, factual control, or long-term ownership matters. Use generative tools when iteration speed is valuable and the output can be reviewed, corrected, and documented.

Keep generation provider-neutral. Record provider, model, prompt artifact, human selection and editing, and every reference asset. Do not use references with pending, rejected, or unknown rights. Do not request imitation of a living artist, competitor identity, protected character, or identifiable private person without an appropriate basis and review.

## Step 3: Generate And Select

Generate purposeful variants that test composition, hierarchy, crop, lighting, and brand fit. Do not treat minor seed changes as meaningful exploration.

Reject output with:

- Incorrect product geometry or UI.
- Invented text, metrics, controls, logos, or certification marks.
- Inconsistent hands, faces, perspective, shadows, or reflections.
- Visual ambiguity at intended size.
- Inaccessible text baked into imagery.
- Unclear resemblance or source provenance.
- A composition that cannot survive responsive cropping.

Selection must be based on the brief and not only visual novelty.

## Step 4: Finish The Asset

- Retouch factual and visual errors.
- Rebuild logos, diagrams, charts, and icons as controlled vector or code-native artifacts when appropriate.
- Remove metadata that should not ship while preserving internal provenance records.
- Export intended formats and densities.
- Compress without damaging text, line art, or required detail.
- Define focal point, crop rules, alt text or equivalent, and fallback behavior.
- Test on actual backgrounds and viewport ranges.

## Step 5: Record Provenance

Every version 2.1 asset record must include purpose, origin, creator, local path, rights status,
rights basis, evidence, restrictions, attribution when required, alternative-content classification,
and explicit failure behavior. Generated assets also require model and prompt records, human
contributions, and reference-rights status.

An `approved` label without a source URL or evidence path is invalid. Generated output is not automatically owned, copyrightable, non-infringing, or suitable for every use.

## Validation

Run the design-deliverable validator, then inspect the actual asset at 100 percent, intended display size, smallest responsive crop, and highest-risk background. Use human review for product accuracy, resemblance, taste, cultural context, and brand distinctiveness.
