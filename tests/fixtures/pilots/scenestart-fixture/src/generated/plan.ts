export const generatedPlan = {
  "product": "SceneStart Local-First Demoscene Learning Studio",
  "planId": "scenestart-brief-design-plan",
  "sourceDigest": "d4f22d943d3f8d6e75edeef1268674df776b908ff0a554c9ab55af9641dac932",
  "task": {
    "id": "export-offline-production",
    "label": "Enter a handle, title, concept, save project locally, and export offline HTML.",
    "route": "/tasks/export-offline-production"
  },
  "informationFlow": [
    {
      "id": "ia-export-offline-production-context",
      "order": 1,
      "label": "Context and provenance",
      "purpose": "Establish trigger, scope, data origin, and freshness before Compose, save and export a production."
    },
    {
      "id": "ia-export-offline-production-priority",
      "order": 2,
      "label": "Primary outcome and action",
      "purpose": "Enter a handle, title, concept, save project locally, and export offline HTML."
    },
    {
      "id": "ia-export-offline-production-impact",
      "order": 3,
      "label": "Impact and exceptions",
      "purpose": "User loses their work if not saved."
    },
    {
      "id": "ia-export-offline-production-evidence",
      "order": 4,
      "label": "Evidence and explanation",
      "purpose": "Expose the evidence needed to verify the decision without promoting supporting telemetry above the task."
    },
    {
      "id": "ia-export-offline-production-action",
      "order": 5,
      "label": "Bounded next action",
      "purpose": "User downloads scenestart-production.json and my-production.html."
    },
    {
      "id": "ia-export-offline-production-verification",
      "order": 6,
      "label": "Recovery and verification",
      "purpose": "Invalid projects explain the error and preserve the current project."
    },
    {
      "id": "ia-workshop-to-studio-context",
      "order": 1,
      "label": "Context and provenance",
      "purpose": "Establish trigger, scope, data origin, and freshness before Complete guided first production."
    },
    {
      "id": "ia-workshop-to-studio-priority",
      "order": 2,
      "label": "Primary outcome and action",
      "purpose": "Complete 6 steps and export the production, then continue to Demo Studio."
    },
    {
      "id": "ia-workshop-to-studio-impact",
      "order": 3,
      "label": "Impact and exceptions",
      "purpose": "User cannot progress if storage fails."
    },
    {
      "id": "ia-workshop-to-studio-evidence",
      "order": 4,
      "label": "Evidence and explanation",
      "purpose": "Expose the evidence needed to verify the decision without promoting supporting telemetry above the task."
    },
    {
      "id": "ia-workshop-to-studio-action",
      "order": 5,
      "label": "Bounded next action",
      "purpose": "User finishes workshop, exports HTML, and continues in studio."
    },
    {
      "id": "ia-workshop-to-studio-verification",
      "order": 6,
      "label": "Recovery and verification",
      "purpose": "If storage fails, disclose failure without claiming progress is saved, allowing retry."
    }
  ],
  "components": [
    {
      "id": "component-export-offline-production-shell",
      "boundary": "task-shell",
      "responsibility": "Own route context and compose the decision path without owning service behavior.",
      "ownsState": []
    },
    {
      "id": "component-export-offline-production-state",
      "boundary": "domain-state-controller",
      "responsibility": "Own task, data-origin, progress, failure, and recovery state independently from rendering.",
      "ownsState": [
        "empty",
        "success",
        "error"
      ]
    },
    {
      "id": "component-export-offline-production-decision",
      "boundary": "decision-summary",
      "responsibility": "Present scope, priority, impact, and the primary next action in decision order.",
      "ownsState": []
    },
    {
      "id": "component-export-offline-production-evidence",
      "boundary": "evidence-detail",
      "responsibility": "Present source, freshness, limitations, and supporting evidence without obscuring the primary task.",
      "ownsState": []
    },
    {
      "id": "component-export-offline-production-action",
      "boundary": "bounded-action-and-recovery",
      "responsibility": "Confirm consequential actions, preserve context on failure, and expose retry or return behavior.",
      "ownsState": []
    }
  ],
  "states": [
    {
      "state": "empty",
      "behavior": "Show empty studio ready for input.",
      "recovery": "User can start entering data.",
      "disclosure": "Explain what to do."
    },
    {
      "state": "success",
      "behavior": "Show successful export and save notifications.",
      "recovery": "User can continue editing.",
      "disclosure": "Show downloaded file names."
    },
    {
      "state": "error",
      "behavior": "Invalid project load shows error. Storage failure shows error.",
      "recovery": "Preserve state, allow retry.",
      "disclosure": "Show clear error messages (e.g. Invalid project, Storage unavailable)."
    }
  ],
  "verification": [
    {
      "id": "verify-acceptance-studio-export",
      "method": "browser-test",
      "blocking": true,
      "expectedEvidence": "Passing journey tests."
    },
    {
      "id": "verify-acceptance-accessibility",
      "method": "browser-test",
      "blocking": true,
      "expectedEvidence": "Browser report with applicable accessibility checks passing."
    }
  ]
} as const;
