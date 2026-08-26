# Brand Systems

Build a brand system as a set of product decisions and reusable constraints, not as an isolated logo exercise.

## Step 1: Define The Brand Contract

Record:

- Product promise and category.
- Primary audiences and the context in which they encounter the product.
- Two to eight attributes the identity must express.
- Traits, visual conventions, and tones the identity must avoid.
- Voice principles with one product-specific example for each.
- Channels where the identity must work, including small UI surfaces and monochrome output.

Do not select a style solely from a trend name. Connect visual decisions to the product task, audience expectations, differentiation, accessibility, production constraints, and likely lifespan.

## Step 2: Build The Mark Family

Create only the variants the product needs:

- Primary lockup.
- Compact lockup for narrow headers.
- Symbol for small square contexts.
- Wordmark when the name must remain prominent.
- Monochrome version for constrained reproduction.

For each mark, define clear space, minimum size, allowed backgrounds, color variants, and prohibited transformations. Test it at favicon or app-icon size, navigation size, document-header size, and large presentation size. Reject marks that depend on unreadable detail, uncontrolled gradients, or a single background.

Do not use a generated logo as a production mark until geometry, distinctiveness, small-size behavior, source references, and rights evidence have been reviewed. Rebuild final vectors cleanly when generated raster output was used for exploration.

## Step 3: Connect Identity To Tokens

Create color and typography primitives, then map them through semantic roles. Components must consume semantic or component tokens, not brand palette values directly.

Examples:

```text
color.primitive.blue-600
color.semantic.action-primary
color.component.button-primary-background
```

Define light, dark, high-contrast, print, or sub-brand modes only when a real channel or product context requires them. A mode must preserve semantic meaning and contrast, not merely swap hues.

Assign typography by role: display, heading, body, label, metadata, metric, and code. Verify available weights, language coverage, licensing, fallback metrics, and rendering before committing to a font family.

## Step 4: Define Application Rules

Specify:

- Hierarchy and spacing behavior.
- Photography or illustration principles.
- Icon-system relationship.
- Shape, border, radius, and motion characteristics.
- Data-visualization behavior.
- Voice examples for actions, errors, empty states, and confirmations.
- Co-branding and partner-mark treatment when applicable.

Use examples to demonstrate constraints, but keep the rules independent of one mockup. Brand expression must not override task clarity, platform conventions, accessibility, or product state semantics.

## Validation

- Every declared mark references an approved asset record.
- Attributes and avoid-list are both present, preventing one-directional style prompting.
- Semantic tokens isolate brand changes from component code.
- Mark variants work in monochrome and at their declared minimum sizes.
- Status colors remain distinct from brand accent colors and include non-color cues.
- Final output is compared against likely competitors and known product marks for confusing similarity.
