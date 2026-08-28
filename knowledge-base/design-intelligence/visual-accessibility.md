# Visual Accessibility Verification

Use this module for normal-text contrast ratios, non-color status cues, semantic token pairs, focus
contrast, visual alternatives, and rendered accessibility verification. Validate visual
accessibility at token, design-source, exported-artifact, and rendered-implementation levels. A
passing token pair does not prove the pixels users receive.

## Step 1: Declare Semantic Pairs

Record foreground and background token pairs for normal text, qualifying large text, controls, focus indicators, graphical objects, status treatments, and data visualization. Test every supported mode and state.

The deterministic manifest validator applies these WCAG 2.2 thresholds:

- Normal text: at least 4.5:1.
- Large text: at least 3:1, with large text declared as at least 24 CSS pixels regular or 18.66 CSS pixels at weight 700 or greater.
- User-interface components and meaningful graphical objects: at least 3:1 where non-text contrast applies.

The validator supports opaque `#RRGGBB` primitives. Use a rendered check for alpha, images, video, gradients, blending, filters, and changing backgrounds.

## Step 2: Prevent Color-Only Meaning

For every status, validation result, selection, chart series, required field, and changed value, combine color with at least one independent cue such as text, icon, shape, pattern, position, value, or underline. Assistive-technology text alone does not replace the visual cue needed by sighted users who do not distinguish the colors.

## Step 3: Provide Visual Alternatives

Classify every asset:

- Decorative: empty alternative and hidden semantics.
- Short informative image: concise alternative text describing purpose in context.
- Complex image or diagram: short alternative plus adjacent long description.
- Chart: summary plus accessible data table when users need exact values.
- Audio or video: captions, transcript, and audio description as applicable.
- Screenshot: describe the relevant state or annotation, not every visible pixel.

Do not repeat nearby visible text. Do not embed essential copy only in images.

## Step 4: Check Scale And Perception

- Inspect at 200 percent text resizing and zoom.
- Verify focus remains visible and unobscured.
- Test high-contrast and forced-color behavior when the platform supports them.
- Respect reduced-motion preference and remove nonessential movement.
- Check target size and spacing for touch input.
- Verify charts, maps, and diagrams under color-vision simulations without treating simulation as user testing.
- Inspect light, dark, print, projected, and disabled states independently.

## Step 5: Verify Final Output

Run the manifest validator for declarations and token math. Run browser verification for implemented UI. Inspect image exports at native size. Inspect document and presentation reading order after export. Use human review for hierarchy, legibility, comprehension, and cultural interpretation.

Record limitations when a check cannot model the actual background or output format. Never suppress a failure merely because the intended aesthetic uses low contrast.

## Standards References

- [WCAG 2.2 use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)
- [WCAG 2.2 distinguishable guidance](https://www.w3.org/WAI/WCAG22/Understanding/distinguishable.html)
