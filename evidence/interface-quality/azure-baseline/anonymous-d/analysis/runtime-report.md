# ZtotheZ Design Engineering Runtime Verification

- URL: `http://localhost:3104/`
- Browser: Chromium 151.0.7922.108
- Result: FAIL
- Findings: 1 errors, 0 warnings, 0 info
- Screenshots: 2
- Journeys: 0/1 passed
- Expected network policies: 0/0 satisfied
- Evidence directory: `/home/ztothez/Studio/experiments/UIX-Design-Skill/evidence/interface-quality/azure-baseline/anonymous-d/analysis`

## Findings

### ERROR ZTDE-RUNTIME-008 (journey:run-ztothez-analysis)

Journey failed at step 3 (expectText).

Selector: `body`

- locator.waitFor: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('body').filter({ hasText: 'Operating in verified local demonstration mode' }) to be visible[22m

