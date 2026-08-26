import { z } from "zod";

export const retrievalCategories = [
  "skill",
  "architecture",
  "design-intelligence",
  "ux-patterns",
  "usability-evaluation",
] as const;

export const retrievalCategorySchema = z.enum(retrievalCategories);
export type RetrievalCategory = z.infer<typeof retrievalCategorySchema>;

const scopeCategorySchema = z
  .object({
    label: z.string().trim().min(1).max(160),
    files: z.array(z.string().trim().min(1).max(1_024)).min(1).max(200),
  })
  .strict();

export const retrievalScopeSchema = z
  .object({
    version: z.literal("1.0"),
    authority: z.literal("SKILL.md"),
    categories: z
      .object({
        skill: scopeCategorySchema,
        architecture: scopeCategorySchema,
        "design-intelligence": scopeCategorySchema,
        "ux-patterns": scopeCategorySchema,
        "usability-evaluation": scopeCategorySchema,
      })
      .strict(),
  })
  .strict();

export const knowledgeSearchInputSchema = z
  .object({
    query: z.string().trim().min(2).max(256),
    categories: z
      .array(retrievalCategorySchema)
      .min(1)
      .max(6)
      .refine((categories) => new Set(categories).size === categories.length, {
        message: "Retrieval categories must be unique",
      })
      .optional(),
    limit: z.number().int().min(1).max(10).optional(),
  })
  .strict();

export const knowledgeSearchResultSchema = z
  .object({
    rank: z.number().int().positive(),
    path: z.string(),
    category: retrievalCategorySchema,
    authority: z.enum(["authoritative", "approved"]),
    title: z.string(),
    section: z.string(),
    excerpt: z.string(),
    score: z.number().nonnegative(),
    confidence: z.enum(["high", "medium", "low"]),
    matchedTerms: z.array(z.string()),
  })
  .strict();

export const knowledgeSearchReportSchema = z
  .object({
    version: z.literal("1.0"),
    query: z.string(),
    categories: z.array(retrievalCategorySchema),
    authorityPath: z.literal("SKILL.md"),
    status: z.enum(["matches", "no-match"]),
    message: z.string(),
    results: z.array(knowledgeSearchResultSchema),
    stats: z
      .object({
        documentsSearched: z.number().int().nonnegative(),
        chunksSearched: z.number().int().nonnegative(),
        searchableTerms: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export type RetrievalScope = z.infer<typeof retrievalScopeSchema>;
export type KnowledgeSearchInput = z.infer<typeof knowledgeSearchInputSchema>;
export type KnowledgeSearchReport = z.infer<typeof knowledgeSearchReportSchema>;
export type KnowledgeSearchResult = z.infer<typeof knowledgeSearchResultSchema>;
