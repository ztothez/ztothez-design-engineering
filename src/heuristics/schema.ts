import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);

export const heuristicEvidenceLevelSchema = z.enum([
  "automated",
  "ai-assisted-expert",
  "human-expert",
  "representative-user",
]);

const heuristicEvidenceSchema = z
  .object({
    level: heuristicEvidenceLevelSchema,
    source: boundedText(1_024),
    detail: boundedText(2_048),
    contributor: boundedText(256).optional(),
    recordedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .superRefine((evidence, context) => {
    if (
      (evidence.level === "human-expert" || evidence.level === "representative-user") &&
      (!evidence.contributor || !evidence.recordedAt)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Human-expert and representative-user evidence require contributor and recordedAt fields.",
      });
    }
  });

const heuristicTaskSchema = z
  .object({
    id: idSchema,
    actor: boundedText(256),
    scenario: boundedText(1_024),
    successCriteria: z.array(boundedText(512)).min(1).max(20),
    modes: z.array(idSchema).min(1).max(20),
  })
  .strict();

const heuristicResolutionSchema = z
  .object({
    rationale: boundedText(2_048),
    decidedBy: boundedText(256),
    decidedAt: z.string().datetime({ offset: true }),
  })
  .strict();

const heuristicFindingSchema = z
  .object({
    id: idSchema,
    title: boundedText(160),
    task: idSchema,
    heuristic: z
      .object({
        id: idSchema,
        name: boundedText(256),
      })
      .strict(),
    location: boundedText(1_024),
    trigger: boundedText(1_024),
    observation: boundedText(2_048),
    impact: boundedText(2_048),
    evidence: z.array(heuristicEvidenceSchema).min(1).max(50),
    severity: z.number().int().min(0).max(4),
    confidence: z.enum(["high", "medium", "low"]),
    status: z.enum(["open", "resolved", "accepted-risk"]),
    remediation: boundedText(2_048),
    validation: z
      .object({
        method: z.enum([
          "runtime",
          "accessibility",
          "screenshot-review",
          "expert-review",
          "representative-user-test",
          "analytics",
        ]),
        procedure: boundedText(2_048),
      })
      .strict(),
    resolution: heuristicResolutionSchema.optional(),
  })
  .strict()
  .superRefine((finding, context) => {
    if (finding.status === "open" && finding.resolution) {
      context.addIssue({
        code: "custom",
        path: ["resolution"],
        message: "Open findings must not contain a resolution decision.",
      });
    }
    if (finding.status !== "open" && !finding.resolution) {
      context.addIssue({
        code: "custom",
        path: ["resolution"],
        message: "Resolved and accepted-risk findings require a recorded resolution decision.",
      });
    }
  });

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export const heuristicReviewSchema = z
  .object({
    version: z.literal("1.0"),
    id: idSchema,
    product: boundedText(256),
    target: boundedText(1_024),
    preparedAt: z.string().datetime({ offset: true }),
    preparedBy: z
      .object({
        type: z.enum(["agent", "human", "mixed"]),
        name: boundedText(256),
      })
      .strict(),
    tasks: z.array(heuristicTaskSchema).min(1).max(100),
    findings: z.array(heuristicFindingSchema).max(1_000),
  })
  .strict()
  .superRefine((review, context) => {
    for (const duplicate of duplicateValues(review.tasks.map((task) => task.id))) {
      context.addIssue({
        code: "custom",
        path: ["tasks"],
        message: `Duplicate task identifier: ${duplicate}`,
      });
    }
    for (const duplicate of duplicateValues(review.findings.map((finding) => finding.id))) {
      context.addIssue({
        code: "custom",
        path: ["findings"],
        message: `Duplicate finding identifier: ${duplicate}`,
      });
    }
    const taskIds = new Set(review.tasks.map((task) => task.id));
    for (const [index, finding] of review.findings.entries()) {
      if (!taskIds.has(finding.task)) {
        context.addIssue({
          code: "custom",
          path: ["findings", index, "task"],
          message: `Unknown task identifier: ${finding.task}`,
        });
      }
    }
  });

const acceptanceCandidateSchema = z
  .object({
    sourceFinding: idSchema,
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
    title: boundedText(160),
    severity: z.literal("blocker"),
    requirement: boundedText(2_048),
    evidence: z
      .array(
        z.enum([
          "contract",
          "runtime",
          "screenshot",
          "network",
          "accessibility",
          "export",
          "manual-review",
        ]),
      )
      .min(1),
    appliesToModes: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/)).min(1),
  })
  .strict();

export const heuristicReviewReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    sourcePath: z.string(),
    reviewId: z.string(),
    product: z.string(),
    findings: z.array(heuristicFindingSchema),
    acceptanceCandidates: z.array(acceptanceCandidateSchema),
    evidenceLevels: z.object({
      automated: z.number().int().nonnegative(),
      aiAssistedExpert: z.number().int().nonnegative(),
      humanExpert: z.number().int().nonnegative(),
      representativeUser: z.number().int().nonnegative(),
    }),
    summary: z.object({
      total: z.number().int().nonnegative(),
      open: z.number().int().nonnegative(),
      resolved: z.number().int().nonnegative(),
      acceptedRisk: z.number().int().nonnegative(),
      severity3: z.number().int().nonnegative(),
      severity4: z.number().int().nonnegative(),
      acceptanceCandidates: z.number().int().nonnegative(),
    }),
    requiresAcceptanceWork: z.boolean(),
  })
  .strict();

export type HeuristicReview = z.infer<typeof heuristicReviewSchema>;
export type HeuristicFinding = HeuristicReview["findings"][number];
export type HeuristicEvidenceLevel = z.infer<typeof heuristicEvidenceLevelSchema>;
export type HeuristicAcceptanceCandidate = z.infer<typeof acceptanceCandidateSchema>;
export type HeuristicReviewReport = z.infer<typeof heuristicReviewReportSchema>;
