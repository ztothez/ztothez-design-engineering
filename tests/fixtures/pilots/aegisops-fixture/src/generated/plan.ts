export const generatedPlan = {
  "product": "AegisOPS SOC Readiness Command Center",
  "planId": "aegisops-operations-brief-design-plan",
  "sourceDigest": "3a884f27847a329778dbdd3ec8c2eb541b4518a489a29b3b0f407ea6828ce593",
  "task": {
    "id": "review-and-start-remediation",
    "label": "Confirm scope and evidence, then start the bounded remediation for the highest-impact finding.",
    "route": "/tasks/review-and-start-remediation"
  },
  "informationFlow": [
    {
      "id": "ia-review-and-start-remediation-context",
      "order": 1,
      "label": "Context and provenance",
      "purpose": "Establish trigger, scope, data origin, and freshness before Review the highest-impact finding and start remediation."
    },
    {
      "id": "ia-review-and-start-remediation-priority",
      "order": 2,
      "label": "Primary outcome and action",
      "purpose": "Confirm scope and evidence, then start the bounded remediation for the highest-impact finding."
    },
    {
      "id": "ia-review-and-start-remediation-impact",
      "order": 3,
      "label": "Impact and exceptions",
      "purpose": "The operator may act on the wrong environment or mistake demonstration evidence for live service output."
    },
    {
      "id": "ia-review-and-start-remediation-evidence",
      "order": 4,
      "label": "Evidence and explanation",
      "purpose": "Expose the evidence needed to verify the decision without promoting supporting telemetry above the task."
    },
    {
      "id": "ia-review-and-start-remediation-action",
      "order": 5,
      "label": "Bounded next action",
      "purpose": "The selected finding enters a started state with scope, origin, evidence, and verification instructions preserved."
    },
    {
      "id": "ia-review-and-start-remediation-verification",
      "order": 6,
      "label": "Recovery and verification",
      "purpose": "Preserve the selected scope and finding, explain the failure, and offer a bounded retry or return to review."
    }
  ],
  "components": [
    {
      "id": "component-review-and-start-remediation-shell",
      "boundary": "task-shell",
      "responsibility": "Own route context and compose the decision path without owning service behavior.",
      "ownsState": []
    },
    {
      "id": "component-review-and-start-remediation-state",
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
      "id": "component-review-and-start-remediation-decision",
      "boundary": "decision-summary",
      "responsibility": "Present scope, priority, impact, and the primary next action in decision order.",
      "ownsState": []
    },
    {
      "id": "component-review-and-start-remediation-evidence",
      "boundary": "evidence-detail",
      "responsibility": "Present source, freshness, limitations, and supporting evidence without obscuring the primary task.",
      "ownsState": []
    },
    {
      "id": "component-review-and-start-remediation-action",
      "boundary": "bounded-action-and-recovery",
      "responsibility": "Confirm consequential actions, preserve context on failure, and expose retry or return behavior.",
      "ownsState": []
    }
  ],
  "states": [
    {
      "state": "loading",
      "behavior": "Preserve layout and selected scope while announcing bounded progress.",
      "recovery": "Allow cancellation and retain the current finding selection.",
      "disclosure": "Connection and result origin remain checking until runtime evidence resolves them."
    },
    {
      "state": "empty",
      "behavior": "State that no findings exist for the selected scope and period.",
      "recovery": "Let the operator change scope or rerun analysis.",
      "disclosure": "Preserve data mode, scope, freshness, and limitations."
    },
    {
      "state": "success",
      "behavior": "Show the started remediation, affected scope, evidence, and verification step.",
      "recovery": "Provide a return path to the finding and history.",
      "disclosure": "Preserve result origin and service state in the resulting record."
    },
    {
      "state": "error",
      "behavior": "Explain the failed operation without discarding the selected finding.",
      "recovery": "Offer a bounded retry and a safe return to review.",
      "disclosure": "Distinguish interface availability from service failure."
    },
    {
      "state": "partial",
      "behavior": "Label unavailable evidence and prevent unsupported certainty.",
      "recovery": "Allow review of available evidence or retry missing portions.",
      "disclosure": "State which findings or evidence are incomplete."
    },
    {
      "state": "stale",
      "behavior": "Keep stale findings visible with timestamp and block unsafe assumptions of currency.",
      "recovery": "Refresh while preserving scope and selection.",
      "disclosure": "Show stale status, observed time, timezone, and source."
    },
    {
      "state": "disconnected",
      "behavior": "Keep the interface usable and disable actions that require a verified connection.",
      "recovery": "Retry connection or enter explicitly disclosed demonstration mode.",
      "disclosure": "Show disconnected state separately from demonstration result origin."
    }
  ],
  "verification": [
    {
      "id": "verify-acceptance-decision-path",
      "method": "browser-test",
      "blocking": true,
      "expectedEvidence": "Checksummed captures and journey assertions for all four viewports."
    },
    {
      "id": "verify-acceptance-trust-states",
      "method": "integration-test",
      "blocking": true,
      "expectedEvidence": "State-specific contract and runtime assertions with no unsupported live claim."
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
      "expectedEvidence": "Architecture audit report bound to the source revision."
    }
  ]
} as const;
