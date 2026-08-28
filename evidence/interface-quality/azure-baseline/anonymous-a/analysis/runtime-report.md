# ZtotheZ Design Engineering Runtime Verification

- URL: `http://localhost:3101/`
- Browser: Chromium 151.0.7922.108
- Result: FAIL
- Findings: 12 errors, 7 warnings, 0 info
- Screenshots: 2
- Journeys: 1/1 passed
- Expected network policies: 0/0 satisfied
- Evidence directory: `/home/ztothez/Studio/experiments/UIX-Design-Skill/evidence/interface-quality/azure-baseline/anonymous-a/analysis`

## Findings

### ERROR ZTDE-RUNTIME-002 (custom-1440x1000)

Browser console error: Failed to load resource: the server responded with a status of 404 (Not Found)

- Source: http://localhost:3101/favicon.ico:0.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-012 (custom-1440x1000)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 59.3px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000, journey:run-original-analysis)

Rendered text does not meet the minimum contrast ratio.

Selector: `button.mt-4`

- Measured 3.76:1; required 4.5:1 for normal text.
- Computed foreground rgb(255, 255, 255); effective background rgb(43, 127, 255).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000, journey:run-original-analysis)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.mt-1`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000, journey:run-original-analysis)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.95:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(11, 17, 32).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000, journey:run-original-analysis)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000, journey:run-original-analysis)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-original-analysis)

Transform or positional animation remains active with reduced motion enabled.

Selector: `button.flex`

- Animation duration is 150ms and properties include offset.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-original-analysis)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-original-analysis)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.
