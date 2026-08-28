# ZtotheZ Design Engineering Runtime Verification

- URL: `http://localhost:3103/`
- Browser: Chromium 151.0.7922.108
- Result: FAIL
- Findings: 57 errors, 56 warnings, 0 info
- Screenshots: 8
- Journeys: 0/1 passed
- Expected network policies: 0/0 satisfied
- Evidence directory: `/home/ztothez/Studio/experiments/UIX-Design-Skill/evidence/interface-quality/azure-baseline/anonymous-c/overview`

## Findings

### ERROR ZTDE-RUNTIME-002 (custom-375x812)

Browser console error: Failed to load resource: the server responded with a status of 404 (Not Found)

- Source: http://localhost:3103/favicon.ico:0.

### ERROR ZTDE-RUNTIME-004 (custom-375x812)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.flex > span`

- div.grid > div.panel-glass > div.flex > span: left 309px, right 374px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 288px to 343px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### ERROR ZTDE-RUNTIME-004 (custom-375x812)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.mt-4 > span.text-4xl`

- div.grid > div.panel-glass > div.mt-4 > span.text-4xl: left 309px, right 371px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 288px to 343px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### WARNING ZTDE-RUNTIME-012 (custom-375x812)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-375x812)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-013 (custom-375x812)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-375x812)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `div`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-016 (custom-375x812)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-375x812)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### WARNING ZTDE-RUNTIME-012 (custom-768x1024)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-768x1024)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-012 (custom-768x1024)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 75.6px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-013 (custom-768x1024)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-768x1024)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `div`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024)

Content is clipped when text is resized to 200%.

Selector: `div.font-mono`

- Rendered box 88px by 32px; content requires 187px by 32px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024)

Content is clipped when text is resized to 200%.

Selector: `div.text-slate-400`

- Rendered box 88px by 33px; content requires 245px by 33px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-768x1024)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-768x1024)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-004 (custom-1024x768)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.mt-4 > span.text-xs`

- div.grid > div.panel-glass > div.mt-4 > span.text-xs: left 614px, right 657px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 469px to 630px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### ERROR ZTDE-RUNTIME-004 (custom-1024x768)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.mt-4 > span.inline-flex`

- div.grid > div.panel-glass > div.mt-4 > span.inline-flex: left 932px, right 1026px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 831px to 992px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### WARNING ZTDE-RUNTIME-012 (custom-1024x768)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-1024x768)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-013 (custom-1024x768)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768)

Content is clipped when text is resized to 200%.

Selector: `div.font-mono`

- Rendered box 72px by 32px; content requires 187px by 32px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768)

Content is clipped when text is resized to 200%.

Selector: `div.text-slate-400`

- Rendered box 72px by 33px; content requires 245px by 33px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-1024x768)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-1024x768)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

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

### ERROR ZTDE-RUNTIME-008 (journey:overview-integrity)

Journey failed at step 2 (expectText).

Selector: `body`

- locator.waitFor: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('body').filter({ hasText: 'Potential Savings' }) to be visible[22m


### ERROR ZTDE-RUNTIME-004 (custom-375x812, journey:overview-integrity)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.flex > span`

- div.grid > div.panel-glass > div.flex > span: left 309px, right 374px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 288px to 343px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### ERROR ZTDE-RUNTIME-004 (custom-375x812, journey:overview-integrity)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.mt-4 > span.text-4xl`

- div.grid > div.panel-glass > div.mt-4 > span.text-4xl: left 309px, right 371px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 288px to 343px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### WARNING ZTDE-RUNTIME-012 (custom-375x812, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-375x812, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-013 (custom-375x812, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-375x812, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `div`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### WARNING ZTDE-RUNTIME-012 (custom-768x1024, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-768x1024, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-012 (custom-768x1024, journey:overview-integrity)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 75.6px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-013 (custom-768x1024, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `select`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-768x1024, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `div.font-mono`

- Rendered box 88px by 32px; content requires 187px by 32px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-015 (custom-768x1024, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `div.text-slate-400`

- Rendered box 88px by 33px; content requires 245px by 33px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-768x1024, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### ERROR ZTDE-RUNTIME-004 (custom-1024x768, journey:overview-integrity)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.mt-4 > span.text-xs`

- div.grid > div.panel-glass > div.mt-4 > span.text-xs: left 614px, right 657px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 469px to 630px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### ERROR ZTDE-RUNTIME-004 (custom-1024x768, journey:overview-integrity)

Visible semantic content is clipped by an overflow-hidden ancestor.

Selector: `div.grid > div.panel-glass > div.mt-4 > span.inline-flex`

- div.grid > div.panel-glass > div.mt-4 > span.inline-flex: left 932px, right 1026px.
- div.p-8 > div.space-y-8 > div.grid > div.panel-glass: clipping bounds 831px to 992px.
- Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.

### WARNING ZTDE-RUNTIME-012 (custom-1024x768, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-1024x768, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-013 (custom-1024x768, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `select`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-1024x768, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `div.font-mono`

- Rendered box 72px by 32px; content requires 187px by 32px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-015 (custom-1024x768, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `div.text-slate-400`

- Rendered box 72px by 33px; content requires 245px by 33px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1024x768, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `select`

- Effective target size is 215px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 223px by 42px.

### ERROR ZTDE-RUNTIME-012 (custom-1440x1000, journey:overview-integrity)

Interactive target is smaller than 24 by 24 CSS pixels.

Selector: `button`

- Effective target size is 162px by 16px, including an associated label when present.
- Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.

### ERROR ZTDE-RUNTIME-013 (custom-1440x1000, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `select`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-013 (custom-1440x1000, journey:overview-integrity)

Keyboard focus is hidden or centered beneath fixed or sticky content.

Selector: `button`

- Focused control center is outside the visible viewport.
- Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `div.font-mono`

- Rendered box 153px by 32px; content requires 187px by 32px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-015 (custom-1440x1000, journey:overview-integrity)

Content is clipped when text is resized to 200%.

Selector: `div.text-slate-400`

- Rendered box 153px by 33px; content requires 245px by 33px.
- Allow the container to grow or wrap without losing text or controls.

### ERROR ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `span.h-2`

- Animation duration is 2000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.space-y-8`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.panel-glass`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `div.relative`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### ERROR ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `div.absolute`

- Animation duration is 1000ms and properties include offset, transform.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

A long motion-capable transition remains configured with reduced motion enabled.

Selector: `circle.transition-all`

- Computed transition property all exceeds 200ms.
- Use a reduced-motion media query to remove transform and positional transitions.

### WARNING ZTDE-RUNTIME-016 (custom-1440x1000, journey:overview-integrity)

Smooth scrolling remains enabled with reduced motion enabled.

Selector: `html.dark`

- Set scroll-behavior to auto in prefers-reduced-motion contexts.
