# AI Workspace UX Foundations

> Synthesized from usability, search, interface design, UX documentation, and ethical design references.

---

## Product-Neutral Definition

**What this pattern supports:** an AI-assisted workspace where users provide context, configure analysis or generation, wait through model work, inspect results, verify evidence, and take action.

**What this pattern is not:** a generic chatbot-only interface, a decorative landing page, or an opaque automation surface.

**Primary user goal:** understand AI output quickly, trust what can be trusted, identify uncertainty, and act with control.

---

## User Archetypes

### Practitioner
- **Goal:** complete a domain task faster without losing control.
- **Behavior:** provides source material, scans summary first, then reviews details.
- **Must do:** see result, evidence, confidence, and next action.
- **Must never:** lose work because an AI request failed.

### Reviewer
- **Goal:** evaluate quality, risk, policy fit, or readiness.
- **Behavior:** compares settings, checks evidence, exports or shares results.
- **Must do:** distinguish user input errors, AI failures, and real findings.
- **Must never:** approve consequential output without traceable rationale.

### Learner
- **Goal:** understand why the AI recommended something.
- **Behavior:** expands explanations, examples, and sources.
- **Must do:** get plain-language explanations and recovery paths.
- **Must never:** face jargon-only errors or unsupported claims.

---

## Core UX Framework

| Side | Principle | Application |
|---|---|---|
| Ease of use | Functional, responsive, ergonomic, convenient, foolproof | Working submit flow, visible loading, 44px targets, preserved input, helpful errors |
| Clarity | Visible, understandable, logical, consistent, predictable | Summary first, shared vocabulary, linear flow, one primary action |

---

## Design Principles

1. Put the primary task surface first; do not bury the tool behind marketing content.
2. Show feedback within 100ms and staged progress for long AI work.
3. Preserve user input through failures, rate limits, and navigation.
4. Give every error a cause and recovery action.
5. Use one primary action per mode.
6. Make empty states useful with examples and clear next steps.
7. Use filters, breadcrumbs, and drill-down for long result sets.
8. Pair severity, confidence, and status with text, not color alone.
9. Organize results as summary -> findings -> recommendation -> evidence -> action.
10. Support progressive disclosure: leaders and reviewers need summaries; practitioners need detail.

---

## Information Architecture

```text
/                     Trust-oriented entry or workspace redirect
/analyze              Structured input and results workspace
/agent                Conversational mode with context and tool visibility
/history              Past runs, versions, exports, and approvals
/settings             Model, data, privacy, permission, and retention controls
```

---

## Analyze Flow

| Step | User action | System response | Pain point mitigated |
|---|---|---|---|
| 1 | Opens workspace | Input focused or example available | Blank-page anxiety |
| 2 | Adds context and settings | Inline validation and scope summary | Invalid submit |
| 3 | Starts AI task | Button loading and result skeleton | Uncertainty |
| 4 | Waits | Staged status messages | Frozen UI |
| 5 | Reviews summary | Numeric/text values visible | Color-only meaning |
| 6 | Opens finding | Detail, evidence, and suggested action | Wall of text |
| 7 | Reviews source | Source, excerpt, or context badge | Unsupported AI claim |
| 8 | Acts | Toast, saved state, export, or approval trail | No confirmation |

---

## Accessibility And Trust Requirements

- All score or confidence values must be visible as text.
- Severity and status require label plus visual treatment.
- Use `aria-live="polite"` for async result-region updates.
- Move focus to the result summary after completion when it helps keyboard users.
- Show privacy and data-processing boundaries near the input surface.
- Show rate limits proactively when they affect use.

---

## Implementation Notes

- A split workspace works well for expert desktop use.
- Mobile should use tabs or drawers to avoid competing scroll regions.
- Chat should augment structured work, not replace it when forms, tables, or evidence panels are clearer.
- Tool calls and retrieved context should be collapsible unless they are the main content.
