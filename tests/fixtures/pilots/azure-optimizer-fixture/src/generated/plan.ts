export const generatedPlan = {
  "product": "Azure Optimizer Infrastructure Analysis Dashboard",
  "planId": "azure-optimizer-brief-design-plan",
  "sourceDigest": "8bb33769104b0f6dffcdc032e301125490030f43041ce2b94135db2bff1402e3",
  "task": {
    "id": "prioritize-cloud-savings",
    "label": "Verify the data boundary, run the ZtotheZ analysis, inspect the highest-priority finding, and identify the validation action.",
    "route": "/tasks/prioritize-cloud-savings"
  },
  "informationFlow": [
    {
      "id": "ia-prioritize-cloud-savings-context",
      "order": 1,
      "label": "Context and provenance",
      "purpose": "Establish trigger, scope, data origin, and freshness before Run analysis and prioritize a supported saving opportunity."
    },
    {
      "id": "ia-prioritize-cloud-savings-priority",
      "order": 2,
      "label": "Primary outcome and action",
      "purpose": "Verify the data boundary, run the ZtotheZ analysis, inspect the highest-priority finding, and identify the validation action."
    },
    {
      "id": "ia-prioritize-cloud-savings-impact",
      "order": 3,
      "label": "Impact and exceptions",
      "purpose": "The operator may mistake demonstration output for current Azure evidence or act without validating the recommendation."
    },
    {
      "id": "ia-prioritize-cloud-savings-evidence",
      "order": 4,
      "label": "Evidence and explanation",
      "purpose": "Expose the evidence needed to verify the decision without promoting supporting telemetry above the task."
    },
    {
      "id": "ia-prioritize-cloud-savings-action",
      "order": 5,
      "label": "Bounded next action",
      "purpose": "A prioritized finding exposes scope, estimated impact, evidence, limitation, remediation owner, and validation method."
    },
    {
      "id": "ia-prioritize-cloud-savings-verification",
      "order": 6,
      "label": "Recovery and verification",
      "purpose": "Preserve scope and selected finding, disclose unavailable processing, and offer retry or explicitly labeled local fallback."
    }
  ],
  "components": [
    {
      "id": "component-prioritize-cloud-savings-shell",
      "boundary": "task-shell",
      "responsibility": "Own route context and compose the decision path without owning service behavior.",
      "ownsState": []
    },
    {
      "id": "component-prioritize-cloud-savings-state",
      "boundary": "domain-state-controller",
      "responsibility": "Own task, data-origin, progress, failure, and recovery state independently from rendering.",
      "ownsState": [
        "loading",
        "empty",
        "success",
        "error",
        "partial",
        "stale",
        "disconnected"
      ]
    },
    {
      "id": "component-prioritize-cloud-savings-decision",
      "boundary": "decision-summary",
      "responsibility": "Present scope, priority, impact, and the primary next action in decision order.",
      "ownsState": []
    },
    {
      "id": "component-prioritize-cloud-savings-evidence",
      "boundary": "evidence-detail",
      "responsibility": "Present source, freshness, limitations, and supporting evidence without obscuring the primary task.",
      "ownsState": []
    },
    {
      "id": "component-prioritize-cloud-savings-action",
      "boundary": "bounded-action-and-recovery",
      "responsibility": "Confirm consequential actions, preserve context on failure, and expose retry or return behavior.",
      "ownsState": []
    }
  ],
  "states": [
    {
      "state": "loading",
      "behavior": "Preserve scope and disclose local processing while analysis is running.",
      "recovery": "Keep the current dataset available and allow a bounded retry after failure.",
      "disclosure": "Do not present findings as complete while processing is active."
    },
    {
      "state": "empty",
      "behavior": "State that the declared scope contains no supported findings without displaying zero as missing evidence.",
      "recovery": "Let the operator confirm scope or rerun the local analysis.",
      "disclosure": "Preserve environment, source mode, freshness, and dataset limitations."
    },
    {
      "state": "success",
      "behavior": "Show the prioritized finding, evidence, impact, and validation action together.",
      "recovery": "Allow another analysis without losing the current result context.",
      "disclosure": "Preserve local demonstration origin and limitations in the result."
    },
    {
      "state": "error",
      "behavior": "Explain the failed operation without discarding environment or scope.",
      "recovery": "Offer retry and a clearly labeled local fallback.",
      "disclosure": "Distinguish interface availability from processing failure."
    },
    {
      "state": "partial",
      "behavior": "Label unavailable evidence and prevent unsupported certainty.",
      "recovery": "Allow review of available evidence or retry the missing portion.",
      "disclosure": "State which metrics or findings are incomplete."
    },
    {
      "state": "stale",
      "behavior": "Retain the result with its timestamp and block assumptions of currency.",
      "recovery": "Refresh while preserving scope and selected finding.",
      "disclosure": "Show stale status, observed time, timezone, and origin."
    },
    {
      "state": "disconnected",
      "behavior": "Keep the overview readable while actions requiring a verified connector remain unavailable.",
      "recovery": "Retry connection or explicitly select the local demonstration fixture.",
      "disclosure": "Show disconnected state separately from local demonstration origin."
    }
  ],
  "verification": [
    {
      "id": "verify-acceptance-decision-path",
      "method": "browser-test",
      "blocking": true,
      "expectedEvidence": "Checksummed captures and journey assertions for overview-baseline and ztothez-analysis."
    },
    {
      "id": "verify-acceptance-truth",
      "method": "integration-test",
      "blocking": true,
      "expectedEvidence": "Runtime assertions with no unsupported live or connected claim."
    },
    {
      "id": "verify-acceptance-accessibility",
      "method": "browser-test",
      "blocking": true,
      "expectedEvidence": "Browser report with applicable accessibility checks passing."
    },
    {
      "id": "verify-acceptance-boundaries",
      "method": "static-analysis",
      "blocking": false,
      "expectedEvidence": "Architecture report bound to the fixture source digest."
    }
  ]
} as const;
