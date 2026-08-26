# Iconography

An icon system is a semantic vocabulary with controlled geometry. It is not a folder of unrelated glyphs.

## Step 1: Inventory Meanings

List the actions, objects, statuses, navigation destinations, and domain concepts that need icons. Remove duplicate meanings and distinguish actions from states. Prefer familiar platform or product conventions when they are clear in context.

Use text instead of inventing a glyph for an abstract concept users will not recognize. Pair unfamiliar icons with visible labels. Do not use Unicode symbols as inconsistent icon fallbacks.

## Step 2: Choose The Source Strategy

Reuse the product's approved icon library when one exists. Add custom icons only for domain meanings the library cannot express. Keep all source assets and licenses in the manifest.

Do not combine outline, filled, duotone, and hand-drawn systems without an explicit semantic reason. If filled icons indicate selected state, document and test that rule consistently.

## Step 3: Define Geometry

Declare:

- Base grid and key sizes.
- Stroke style, weight, caps, and joins.
- Corner behavior and optical overshoot.
- Bounding box, padding, baseline, and alignment.
- Filled-area and detail limits at the smallest size.
- Mirroring and localization rules.

Review icons at native size. Mathematically aligned shapes can still need optical correction.

## Step 4: Define Semantics And Accessibility

Every icon needs one documented meaning. A semantic icon requires an accessible name unless equivalent visible text labels the same control. Decorative icons must be hidden from assistive technology and must not receive redundant names.

Never rely on icon color alone for status. Combine it with text, shape, placement, value, or another cue. Ensure active, disabled, destructive, and focus treatments use semantic tokens and pass non-text contrast where required.

## Step 5: Package And Verify

- Use stable lowercase identifiers.
- Optimize SVG paths without flattening meaningful structure needed by the implementation.
- Remove editor metadata and unexpected embedded raster content.
- Preserve `viewBox` and test scaling.
- Expose icons through the existing icon component or library adapter.
- Add automated snapshots or rendering checks for the supported sizes.
- Test bidirectional layouts and high-contrast modes where applicable.

The design manifest checks identifier uniqueness, asset references, and semantic naming. It does not inspect SVG geometry or the accessible implementation.
