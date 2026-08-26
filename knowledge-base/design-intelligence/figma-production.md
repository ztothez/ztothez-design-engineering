# Figma Production Workflow

Use Figma as a structured implementation contract. A visually complete canvas with detached layers, raw values, and undocumented states is not a design system.

## Step 1: Establish File Architecture

Give each page one role and stated purpose. A maintained library requires at least foundations and components. Add patterns, templates, sandbox, archive, or cover pages only when they have an owner and lifecycle.

Keep exploration separate from published assets. Move obsolete work to archive rather than leaving near-duplicate components in active pages.

## Step 2: Map Tokens To Variables

Create primitive values first, semantic aliases second, and component aliases only where local state or variation warrants them. Group variables by responsibility rather than by arbitrary color name.

Use modes for genuine contexts such as light and dark themes, density, device class, language, or brand. Avoid duplicating frames merely to express a mode. Verify every mode independently, including contrast and missing aliases.

Figma supports variables, aliases, collections, modes, and design-token import using the Design Tokens Community Group format. Keep one canonical token source and define the direction of synchronization between code and Figma. Do not allow independent edits on both sides without conflict policy.

## Step 3: Engineer Components

For every component:

1. State its purpose and ownership.
2. Use auto layout for content-driven dimensions and stable spacing.
3. Expose only useful text, boolean, instance-swap, variant, or slot properties.
4. Use variants for meaningful states or configurations, not every stylistic permutation.
5. Declare default and focus states for interactive components. Add hover, active, disabled, loading, selected, error, success, or empty states where behavior requires them.
6. Define resizing, truncation, wrapping, minimum size, and maximum-content behavior.
7. Add usage, content, accessibility, and prohibited-use documentation.

Prefer composition and slots over deeply nested overrides. Name properties by user-visible meaning, not internal layer names.

## Step 4: Build Patterns And Templates

Patterns combine components around a task, state model, and responsive behavior. Templates provide a starting structure without hiding required product decisions.

For every pattern or template, include:

- Primary task and success condition.
- Data and state assumptions.
- Empty, loading, partial, error, and permission states.
- Mobile and long-content examples.
- Keyboard and focus expectations.
- Implementation notes that identify semantic tokens and component contracts.

## Step 5: Handoff With Evidence

Before publishing:

- Inspect detached instances and raw values.
- Verify component property names and defaults.
- Exercise all modes and representative variants.
- Check long strings, localization, and text resizing.
- Compare Figma token names with the canonical token source.
- Export a small implementation sample and confirm assets, dimensions, and states survive handoff.
- Record library version, owner, breaking changes, and migration notes.

The manifest validator checks declared structure and references. It does not connect to Figma or verify the actual file. Inspect the source file or use an approved Figma integration for final evidence.

## Official Platform References

- [Figma variables, collections, aliases, and modes](https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes)
- [Figma component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)
