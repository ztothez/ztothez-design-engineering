# ZtotheZ Design Engineering Runtime Verification

- URL: `http://localhost:3101/`
- Browser: Chromium 151.0.7922.108
- Result: FAIL
- Findings: 62 errors, 32 warnings, 0 info
- Screenshots: 8
- Journeys: 1/1 passed
- Expected network policies: 0/0 satisfied
- Evidence directory: `/home/ztothez/Studio/experiments/UIX-Design-Skill/evidence/interface-quality/azure-baseline/anonymous-a/overview`

## Findings

### ERROR ZTDE-RUNTIME-002 (custom-375x812)

Browser console error: Failed to load resource: the server responded with a status of 404 (Not Found)

- Source: http://localhost:3101/favicon.ico:0.

### ERROR ZTDE-RUNTIME-004 (custom-375x812)

Page overflows horizontally by 196px at 375px.

Selector: `div.flex > main.flex-1`

- Document width: 571px; viewport width: 375px.
- div.flex > main.flex-1: left 256px, right 420px, width 164px.
- div.flex > main.flex-1 > header.mb-8: left 288px, right 388px, width 100px.
- div.flex > main.flex-1 > header.mb-8 > h1.text-2xl: left 288px, right 388px, width 100px.
- div.flex > main.flex-1 > div.space-y-6: left 288px, right 388px, width 100px.
- div.flex > main.flex-1 > div.space-y-6 > div.grid: left 288px, right 388px, width 100px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- div.grid > div.rounded-xl > div.text-3xl > span.text-base: left 406px, right 436px, width 30px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- div.grid > div.rounded-xl > div.flex > div.text-3xl: left 309px, right 381px, width 72px.
- div.rounded-xl > div.flex > div.text-3xl > span.text-base: left 347px, right 381px, width 34px.

### ERROR ZTDE-RUNTIME-011 (custom-375x812)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-375x812)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-375x812)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-375x812)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-375x812)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-013 (custom-375x812)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-375x812)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `span`

- Document exceeds the viewport by 323px after text resizing.
- First non-scroll-contained offender: span.
- Root 698px/375px; body 698px/375px.
- Furthest rendered edge: span.text-xs at 543px.

### ERROR ZTDE-RUNTIME-015 (custom-375x812)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-768x1024)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-012 (custom-768x1024)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 59.3px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024)

Page requires horizontal scrolling at 200% zoom.

Selector: `main.flex-1`

- At an effective 384px layout width, the document overflows by 187px.
- Reflow content into one dimension or keep only intentionally scrollable data regions horizontal.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `div.text-sm`

- Document exceeds the viewport by 23px after text resizing.
- First non-scroll-contained offender: div.text-sm.
- Root 791px/768px; body 791px/768px.
- Furthest rendered edge: span.text-base at 791px.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-1024x768)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-012 (custom-1024x768)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 59.3px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768)

Page requires horizontal scrolling at 200% zoom.

Selector: `div.space-y-3`

- At an effective 512px layout width, the document overflows by 59px.
- Reflow content into one dimension or keep only intentionally scrollable data regions horizontal.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `span`

- Document exceeds the viewport by 75px after text resizing.
- First non-scroll-contained offender: span.
- Root 1099px/1024px; body 1099px/1024px.
- Furthest rendered edge: main.flex-1 at 1099px.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

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

### ERROR ZTDE-RUNTIME-004 (custom-375x812, journey:overview-integrity)

Page overflows horizontally by 196px at 375px.

Selector: `div.flex > main.flex-1`

- Document width: 571px; viewport width: 375px.
- div.flex > main.flex-1: left 256px, right 420px, width 164px.
- div.flex > main.flex-1 > header.mb-8: left 288px, right 388px, width 100px.
- div.flex > main.flex-1 > header.mb-8 > h1.text-2xl: left 288px, right 388px, width 100px.
- div.flex > main.flex-1 > div.space-y-6: left 288px, right 388px, width 100px.
- div.flex > main.flex-1 > div.space-y-6 > div.grid: left 288px, right 388px, width 100px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- div.grid > div.rounded-xl > div.text-3xl > span.text-base: left 406px, right 436px, width 30px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- main.flex-1 > div.space-y-6 > div.grid > div.rounded-xl: left 288px, right 388px, width 100px.
- div.grid > div.rounded-xl > div.flex > div.text-3xl: left 309px, right 381px, width 72px.
- div.rounded-xl > div.flex > div.text-3xl > span.text-base: left 347px, right 381px, width 34px.

### ERROR ZTDE-RUNTIME-011 (custom-375x812, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-375x812, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-375x812, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-375x812, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-375x812, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-013 (custom-375x812, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-375x812, journey:overview-integrity)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `span`

- Document exceeds the viewport by 323px after text resizing.
- First non-scroll-contained offender: span.
- Root 698px/375px; body 698px/375px.
- Furthest rendered edge: span.text-xs at 694px.

### ERROR ZTDE-RUNTIME-015 (custom-375x812, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-768x1024, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-768x1024, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-012 (custom-768x1024, journey:overview-integrity)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 59.3px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-013 (custom-768x1024, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024, journey:overview-integrity)

Page requires horizontal scrolling at 200% zoom.

Selector: `main.flex-1`

- At an effective 384px layout width, the document overflows by 187px.
- Reflow content into one dimension or keep only intentionally scrollable data regions horizontal.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024, journey:overview-integrity)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `div.text-sm`

- Document exceeds the viewport by 23px after text resizing.
- First non-scroll-contained offender: div.text-sm.
- Root 791px/768px; body 791px/768px.
- Furthest rendered edge: span.text-base at 791px.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1024x768, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-1024x768, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-012 (custom-1024x768, journey:overview-integrity)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 59.3px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768, journey:overview-integrity)

Page requires horizontal scrolling at 200% zoom.

Selector: `div.space-y-3`

- At an effective 512px layout width, the document overflows by 59px.
- Reflow content into one dimension or keep only intentionally scrollable data regions horizontal.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768, journey:overview-integrity)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `span`

- Document exceeds the viewport by 75px after text resizing.
- First non-scroll-contained offender: span.
- Root 1099px/1024px; body 1099px/1024px.
- Furthest rendered edge: main.flex-1 at 1099px.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-base`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `div.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span.text-xs`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### ERROR ZTDE-RUNTIME-011 (custom-1440x1000, journey:overview-integrity)

Rendered text does not meet the minimum contrast ratio.

Selector: `span`

- Measured 3.75:1; required 4.5:1 for normal text.
- Computed foreground lab(48.0876 -2.03595 -16.5814); effective background rgb(15, 23, 42).
- Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 40px.

### ERROR ZTDE-RUNTIME-012 (custom-1440x1000, journey:overview-integrity)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 59.3px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `button.flex`

- Rendered box 223px by 60px; content requires 264px by 60px.
- Allow the container to grow or wrap without losing text or controls.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-6`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.drop-shadow-md`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.
