import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const pathText = boundedText(1_024);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const evidenceSubjectSchema = z.union([idSchema, z.literal("comparison")]);

export const comparisonEvidenceLevelSchema = z.enum([
  "automated",
  "ai-assisted-expert",
  "human-expert",
  "representative-user",
]);

export const comparisonArtifactKindSchema = z.enum([
  "build-report",
  "typecheck-report",
  "test-report",
  "static-audit",
  "runtime-report",
  "journey-report",
  "screenshot",
  "export",
  "source-inspection",
  "human-review",
  "user-session",
]);

const preparedBySchema = z
  .object({
    type: z.enum(["agent", "human", "mixed"]),
    name: boundedText(256),
  })
  .strict();

const candidateSchema = z
  .object({
    id: idSchema,
    label: boundedText(128),
  })
  .strict();

const viewportSchema = z
  .object({
    id: idSchema,
    width: z.number().int().min(240).max(3_840),
    height: z.number().int().min(240).max(5_000),
  })
  .strict();

const comparisonTaskSchema = z
  .object({
    id: idSchema,
    prompt: boundedText(1_024),
    successCriteria: z.array(boundedText(512)).min(1).max(20),
    measurements: z
      .array(
        z.enum([
          "task-completion",
          "time-on-task",
          "navigation-errors",
          "comprehension-accuracy",
          "recovery-attempts",
          "confidence",
          "perceived-visual-quality",
        ]),
      )
      .min(1)
      .max(7),
  })
  .strict();

const rubricCriterionSchema = z
  .object({
    id: idSchema,
    prompt: boundedText(512),
    measurement: z.enum(["rating", "comprehension", "task-observation"]),
    evidenceLevel: z.enum(["human-expert", "representative-user"]),
    scoreMinimum: z.literal(0),
    scoreMaximum: z.literal(4),
  })
  .strict();

const rubricCategorySchema = z
  .object({
    id: idSchema,
    label: boundedText(128),
    weight: z.number().int().min(1).max(100),
    criteria: z.array(rubricCriterionSchema).min(1).max(30),
  })
  .strict();

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

export const comparisonMethodologySchema = z
  .object({
    version: z.enum(["1.0", "1.1"]),
    id: idSchema,
    title: boundedText(256),
    preparedAt: z.string().datetime({ offset: true }),
    preparedBy: preparedBySchema,
    candidates: z.array(candidateSchema).min(2).max(12),
    viewports: z.array(viewportSchema).min(1).max(12),
    states: z
      .array(
        z
          .object({
            id: idSchema,
            label: boundedText(128),
            required: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    stages: z
      .array(
        z
          .object({
            id: idSchema,
            label: boundedText(128),
            required: z.boolean(),
            scope: z.enum(["candidate", "comparison"]),
            evidenceKinds: z.array(comparisonArtifactKindSchema).min(1).max(11),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    tasks: z.array(comparisonTaskSchema).min(1).max(100),
    rubric: z
      .object({
        scale: z
          .object({
            minimum: z.literal(0),
            maximum: z.literal(4),
            anchors: z.record(z.enum(["0", "1", "2", "3", "4"]), boundedText(256)),
          })
          .strict(),
        categories: z.array(rubricCategorySchema).min(1).max(20),
      })
      .strict(),
    evidencePolicy: z
      .object({
        anonymizeCandidates: z.literal(true),
        counterbalanceOrder: z.literal(true),
        retainArtifacts: z.literal(true),
        separateEvidenceLevels: z.literal(true),
        requireHumanAttribution: z.literal(true),
        prohibitAgentHumanAttestation: z.literal(true),
      })
      .strict(),
    decision: z
      .object({
        minimumCategoryScore: z.number().min(0).max(4),
        requireAllStagesPass: z.boolean(),
        prohibitContradictedClaims: z.boolean(),
        requiredEvidenceLevels: z.array(comparisonEvidenceLevelSchema).min(1).max(4),
        requiredStageCandidates: z.array(idSchema).min(1).max(12).optional(),
        reviewRequirements: z
          .object({
            minimumHumanExpertSessions: z.number().int().min(1).max(100),
            minimumRepresentativeUserSessions: z.number().int().min(1).max(100),
            requireCompleteTaskMatrix: z.boolean(),
            requireCompleteRatingMatrix: z.boolean(),
            requireIdentityBlinding: z.boolean(),
            minimumCounterbalancedOrders: z.number().int().min(1).max(12),
          })
          .strict()
          .optional(),
        benchmark: z
          .object({
            targetCandidate: idSchema,
            comparatorCandidates: z.array(idSchema).min(1).max(11),
            requiredCategoryIds: z.array(idSchema).min(1).max(20),
            requireTaskMetricNonRegression: z.boolean(),
          })
          .strict()
          .optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((methodology, context) => {
    const groups: Array<[string, string[]]> = [
      ["candidates", methodology.candidates.map((entry) => entry.id)],
      ["viewports", methodology.viewports.map((entry) => entry.id)],
      ["states", methodology.states.map((entry) => entry.id)],
      ["stages", methodology.stages.map((entry) => entry.id)],
      ["tasks", methodology.tasks.map((entry) => entry.id)],
      ["rubric.categories", methodology.rubric.categories.map((entry) => entry.id)],
      [
        "rubric.criteria",
        methodology.rubric.categories.flatMap((category) =>
          category.criteria.map((criterion) => criterion.id),
        ),
      ],
    ];
    for (const [path, values] of groups) {
      for (const duplicate of duplicates(values)) {
        context.addIssue({
          code: "custom",
          path: [path],
          message: `Duplicate identifier: ${duplicate}.`,
        });
      }
    }
    const weight = methodology.rubric.categories.reduce(
      (total, category) => total + category.weight,
      0,
    );
    if (weight !== 100) {
      context.addIssue({
        code: "custom",
        path: ["rubric", "categories"],
        message: `Rubric category weights must total 100; received ${weight}.`,
      });
    }
    const candidateIds = new Set(methodology.candidates.map((entry) => entry.id));
    const categoryIds = new Set(methodology.rubric.categories.map((entry) => entry.id));
    if (methodology.version === "1.1") {
      if (!methodology.decision.reviewRequirements) {
        context.addIssue({
          code: "custom",
          path: ["decision", "reviewRequirements"],
          message: "Methodology 1.1 requires explicit human-review completeness thresholds.",
        });
      }
      if (!methodology.decision.benchmark) {
        context.addIssue({
          code: "custom",
          path: ["decision", "benchmark"],
          message: "Methodology 1.1 requires an anonymous target and comparator decision contract.",
        });
      }
    }
    for (const candidate of methodology.decision.requiredStageCandidates ?? []) {
      if (!candidateIds.has(candidate)) {
        context.addIssue({
          code: "custom",
          path: ["decision", "requiredStageCandidates"],
          message: `Unknown required-stage candidate: ${candidate}.`,
        });
      }
    }
    const benchmark = methodology.decision.benchmark;
    if (benchmark) {
      if (!candidateIds.has(benchmark.targetCandidate)) {
        context.addIssue({
          code: "custom",
          path: ["decision", "benchmark", "targetCandidate"],
          message: `Unknown benchmark target: ${benchmark.targetCandidate}.`,
        });
      }
      for (const comparator of benchmark.comparatorCandidates) {
        if (!candidateIds.has(comparator) || comparator === benchmark.targetCandidate) {
          context.addIssue({
            code: "custom",
            path: ["decision", "benchmark", "comparatorCandidates"],
            message: `Invalid benchmark comparator: ${comparator}.`,
          });
        }
      }
      for (const category of benchmark.requiredCategoryIds) {
        if (!categoryIds.has(category)) {
          context.addIssue({
            code: "custom",
            path: ["decision", "benchmark", "requiredCategoryIds"],
            message: `Unknown benchmark category: ${category}.`,
          });
        }
      }
    }
  });

const artifactSchema = z
  .object({
    id: idSchema,
    candidate: evidenceSubjectSchema,
    stage: idSchema,
    kind: comparisonArtifactKindSchema,
    path: pathText,
    producer: z.enum(["automation", "agent", "human"]),
    retained: z.boolean(),
    scope: boundedText(1_024),
    recordedAt: z.string().datetime({ offset: true }),
    sourceRevision: boundedText(128),
    sha256: sha256Schema,
    capture: z
      .object({
        viewport: idSchema,
        state: idSchema,
        width: z.number().int().min(240).max(3_840),
        height: z.number().int().min(240).max(5_000),
      })
      .strict()
      .optional(),
    accessibility: z
      .object({
        standard: z.literal("WCAG"),
        version: z.enum(["2.1", "2.2"]),
        level: z.enum(["A", "AA", "AAA"]),
        coverage: z.enum(["sampled-states", "declared-routes", "full-product"]),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((artifact, context) => {
    if (artifact.kind === "screenshot" && !artifact.capture) {
      context.addIssue({
        code: "custom",
        path: ["capture"],
        message: "Screenshot artifacts require viewport, state, width, and height metadata.",
      });
    }
    if (artifact.kind !== "screenshot" && artifact.capture) {
      context.addIssue({
        code: "custom",
        path: ["capture"],
        message: "Only screenshot artifacts may declare capture metadata.",
      });
    }
  });

const taskResultSchema = z
  .object({
    task: idSchema,
    candidate: idSchema,
    outcome: z.enum(["completed", "partial", "failed", "not-run"]),
    durationSeconds: z.number().nonnegative().max(86_400).optional(),
    navigationErrors: z.number().int().nonnegative().max(10_000),
    recoveryAttempts: z.number().int().nonnegative().max(10_000),
    comprehensionCorrect: z.boolean().optional(),
    confidence: z.number().int().min(1).max(5).optional(),
    notes: boundedText(2_048).optional(),
  })
  .strict();

const ratingSchema = z
  .object({
    candidate: idSchema,
    criterion: idSchema,
    score: z.number().int().min(0).max(4),
    rationale: boundedText(2_048),
  })
  .strict();

export const comparisonReviewSessionSchema = z
  .object({
    id: idSchema,
    level: z.enum(["ai-assisted-expert", "human-expert", "representative-user"]),
    origin: z.enum(["agent-generated", "reviewer-supplied"]),
    contributor: boundedText(256).optional(),
    recordedAt: z.string().datetime({ offset: true }).optional(),
    participantId: idSchema.optional(),
    blinding: z
      .object({
        candidateIdentitiesWithheld: z.boolean(),
        priorCandidateExposure: z.boolean(),
        conflicts: z.array(boundedText(512)).max(20),
      })
      .strict()
      .optional(),
    candidateOrder: z.array(idSchema).min(2).max(12),
    taskResults: z.array(taskResultSchema).max(2_000).default([]),
    ratings: z.array(ratingSchema).max(2_000).default([]),
  })
  .strict();

const claimSchema = z
  .object({
    id: idSchema,
    candidate: evidenceSubjectSchema,
    kind: z.enum([
      "overall-result",
      "stage-result",
      "accessibility-conformance",
      "design-quality",
      "implementation-fact",
    ]),
    statement: boundedText(2_048),
    evidenceType: comparisonEvidenceLevelSchema,
    evidenceRefs: z.array(idSchema).max(100).default([]),
    sessionRefs: z.array(idSchema).max(100).default([]),
    scope: boundedText(1_024),
    status: z.enum(["verified", "partial", "unverified", "contradicted"]),
    outcome: z.enum(["pass", "fail", "partial", "not-evaluated"]).optional(),
    limitations: z.array(boundedText(1_024)).max(50).default([]),
    accessibility: z
      .object({
        standard: z.literal("WCAG"),
        version: z.enum(["2.1", "2.2"]),
        level: z.enum(["A", "AA", "AAA"]),
        coverage: z.enum(["sampled-states", "declared-routes", "full-product"]),
      })
      .strict()
      .optional(),
  })
  .strict();

export const comparisonReviewSchema = z
  .object({
    version: z.literal("1.0"),
    id: idSchema,
    methodologyId: idSchema,
    preparedAt: z.string().datetime({ offset: true }),
    preparedBy: preparedBySchema,
    candidates: z.array(idSchema).min(2).max(12),
    artifacts: z.array(artifactSchema).max(10_000),
    stages: z
      .array(
        z
          .object({
            id: idSchema,
            candidate: evidenceSubjectSchema,
            status: z.enum(["pass", "fail", "partial", "not-run"]),
            evidenceRefs: z.array(idSchema).max(100).default([]),
          })
          .strict(),
      )
      .max(100),
    sessions: z.array(comparisonReviewSessionSchema).max(2_000),
    claims: z.array(claimSchema).min(1).max(10_000),
  })
  .strict();

export const comparisonFindingSchema = z
  .object({
    ruleId: z.string(),
    severity: z.enum(["error", "warning", "info"]),
    path: z.string(),
    message: z.string(),
    remediation: z.string(),
  })
  .strict();

export const comparisonReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    methodologyPath: z.string(),
    reviewPath: z.string(),
    methodologyId: z.string(),
    reviewId: z.string(),
    passed: z.boolean(),
    releaseReady: z.boolean(),
    findings: z.array(comparisonFindingSchema),
    summary: z
      .object({
        errors: z.number().int().nonnegative(),
        warnings: z.number().int().nonnegative(),
        info: z.number().int().nonnegative(),
        requiredStages: z.number().int().nonnegative(),
        passedRequiredStages: z.number().int().nonnegative(),
        claims: z.number().int().nonnegative(),
        verifiedClaims: z.number().int().nonnegative(),
        sessions: z.number().int().nonnegative(),
      })
      .strict(),
    stageResults: z.array(
      z
        .object({
          id: z.string(),
          candidate: z.string(),
          required: z.boolean(),
          status: z.string(),
        })
        .strict(),
    ),
    evidenceLevels: z
      .object({
        automated: z.number().int().nonnegative(),
        aiAssistedExpert: z.number().int().nonnegative(),
        humanExpert: z.number().int().nonnegative(),
        representativeUser: z.number().int().nonnegative(),
      })
      .strict(),
    humanReview: z
      .object({
        requirementsConfigured: z.boolean(),
        humanExpertSessions: z.number().int().nonnegative(),
        representativeUserSessions: z.number().int().nonnegative(),
        completeHumanExpertSessions: z.number().int().nonnegative(),
        completeRepresentativeUserSessions: z.number().int().nonnegative(),
        distinctCandidateOrders: z.number().int().nonnegative(),
        blindedReviewerSessions: z.number().int().nonnegative(),
        minimumHumanExpertSessions: z.number().int().nonnegative(),
        minimumRepresentativeUserSessions: z.number().int().nonnegative(),
        minimumCounterbalancedOrders: z.number().int().nonnegative(),
        requirementsMet: z.boolean(),
      })
      .strict(),
    candidateResults: z.array(
      z
        .object({
          candidate: idSchema,
          categories: z.array(
            z
              .object({
                category: idSchema,
                score: z.number().min(0).max(4).nullable(),
                samples: z.number().int().nonnegative(),
              })
              .strict(),
          ),
          tasks: z
            .object({
              samples: z.number().int().nonnegative(),
              completionRate: z.number().min(0).max(1).nullable(),
              comprehensionAccuracy: z.number().min(0).max(1).nullable(),
              meanDurationSeconds: z.number().nonnegative().nullable(),
              meanConfidence: z.number().min(1).max(5).nullable(),
            })
            .strict(),
        })
        .strict(),
    ),
    benchmarkDecision: z
      .object({
        configured: z.boolean(),
        targetCandidate: idSchema.nullable(),
        comparatorCandidates: z.array(idSchema),
        passed: z.boolean(),
        issues: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export type ComparisonMethodology = z.infer<typeof comparisonMethodologySchema>;
export type ComparisonReview = z.infer<typeof comparisonReviewSchema>;
export type ComparisonFinding = z.infer<typeof comparisonFindingSchema>;
export type ComparisonReport = z.infer<typeof comparisonReportSchema>;
export type ComparisonEvidenceLevel = z.infer<typeof comparisonEvidenceLevelSchema>;
export type ComparisonReviewSession = z.infer<typeof comparisonReviewSessionSchema>;
