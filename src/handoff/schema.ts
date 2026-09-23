import { z } from "zod";

const relativePath = z.string().min(1).max(1_024).refine((value) => !value.startsWith("/") && !value.includes("..") && !value.includes("\\"));

export const handoffSchema = z.object({
  version: z.literal("1.0"),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,127}$/),
  product: z.string().min(1).max(256),
  status: z.enum(["blocked", "provisional", "ready"]),
  source: z.object({ briefId: z.string(), briefFile: relativePath, briefDigest: z.string().regex(/^[a-f0-9]{64}$/), planId: z.string() }).strict(),
  plan: z.object({ planningReady: z.boolean(), implementationReady: z.boolean(), blockers: z.array(z.string()), limitations: z.array(z.string()).min(1) }).strict(),
  rules: z.array(z.object({ id: z.string(), confidence: z.number().min(0).max(1), sourceRef: z.string(), obligations: z.array(z.string()).min(1), requiredStates: z.array(z.string()).min(1), floors: z.array(z.object({ label: z.string(), threshold: z.string() }).strict()).min(1), proofMethod: z.string() }).strict()),
  stages: z.array(z.object({ id: z.string(), status: z.enum(["pass", "provisional", "blocked"]), evidenceTier: z.enum(["declared", "measured", "human-review-required"]) }).strict()).length(7),
  nextActions: z.array(z.string()).min(1),
  integrity: z.object({ algorithm: z.literal("sha256"), payloadDigest: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
}).strict();

export type Handoff = z.infer<typeof handoffSchema>;
