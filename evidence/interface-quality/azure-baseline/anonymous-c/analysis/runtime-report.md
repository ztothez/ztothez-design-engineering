# ZtotheZ Design Engineering Runtime Verification

- URL: `http://localhost:3103/`
- Browser: Chromium 151.0.7922.108
- Result: FAIL
- Findings: 16 errors, 14 warnings, 0 info
- Screenshots: 2
- Journeys: 0/1 passed
- Expected network policies: 0/0 satisfied
- Evidence directory: `/home/ztothez/Studio/experiments/UIX-Design-Skill/evidence/interface-quality/azure-baseline/anonymous-c/analysis`

## Findings

### ERROR ZTDE-RUNTIME-002 (custom-1440x1000)

Browser console error: Failed to load resource: the server responded with a status of 404 (Not Found)

- Source: http://localhost:3103/favicon.ico:0.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-012 (custom-1440x1000)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 162px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-013 (custom-1440x1000)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `select`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-1440x1000)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000)

Content is clipped when text is resized to 200%.

Selector: `div.font-mono`

- Rendered box 153px by 32px; content requires 187px by 32px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000)

Content is clipped when text is resized to 200%.

Selector: `div.text-slate-400`

- Rendered box 153px by 33px; content requires 245px by 33px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-1440x1000)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-1440x1000)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-008 (journey:run-uiux-analysis)

Journey failed at step 1 (click).

Selector: `button:has-text("Analysis")`

- locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button:has-text("Analysis")')[22m


### WARNING ZTDE-RUNTIME-012 (custom-1440x1000, journey:run-uiux-analysis)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000, journey:run-uiux-analysis)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-012 (custom-1440x1000, journey:run-uiux-analysis)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 162px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-013 (custom-1440x1000, journey:run-uiux-analysis)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `select`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-1440x1000, journey:run-uiux-analysis)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000, journey:run-uiux-analysis)

Content is clipped when text is resized to 200%.

Selector: `div.font-mono`

- Rendered box 153px by 32px; content requires 187px by 32px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000, journey:run-uiux-analysis)

Content is clipped when text is resized to 200%.

Selector: `div.text-slate-400`

- Rendered box 153px by 33px; content requires 245px by 33px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-uiux-analysis)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-uiux-analysis)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-uiux-analysis)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-uiux-analysis)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-uiux-analysis)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-uiux-analysis)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:run-uiux-analysis)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.
