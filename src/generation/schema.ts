import { z } from "zod";

const relativePathSchema = z
  .string()
  .min(1)
  .max(1_024)
  .refine(
    (value) =>
      !value.includes("\0") &&
      !value.startsWith("/") &&
      !/^[A-Za-z]:[\\/]/.test(value) &&
      !value.split(/[\\/]/).includes(".."),
    "Generated paths must remain relative and cannot contain parent traversal.",
  );

export const generatedFileSchema = z
  .object({
    path: relativePathSchema,
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    bytes: z.number().int().nonnegative(),
  })
  .strict();

export const generationManifestSchema = z
  .object({
    version: z.literal("1.0"),
    adapter: z.literal("react-typescript-vite"),
    adapterVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    plan: z
      .object({
        id: z.string().min(1).max(256),
        sourceDigest: z.string().regex(/^[a-f0-9]{64}$/),
        compilerVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
      })
      .strict(),
    outputMode: z.literal("new-independent-fixture"),
    files: z.array(generatedFileSchema).min(1),
    guarantees: z.array(z.string().min(1).max(1_024)).min(1),
    limitations: z.array(z.string().min(1).max(1_024)).min(1),
  })
  .strict();

export const generationReportSchema = z
  .object({
    version: z.literal("1.0"),
    adapter: z.literal("react-typescript-vite"),
    adapterVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    status: z.literal("generated"),
    product: z.string().min(1).max(2_048),
    planId: z.string().min(1).max(256),
    target: relativePathSchema,
    manifest: relativePathSchema,
    files: z.array(generatedFileSchema).min(1),
    capabilities: z.array(z.string().min(1).max(1_024)).min(1),
    limitations: z.array(z.string().min(1).max(1_024)).min(1),
  })
  .strict();

export type GeneratedFile = z.infer<typeof generatedFileSchema>;
export type GenerationManifest = z.infer<typeof generationManifestSchema>;
export type GenerationReport = z.infer<typeof generationReportSchema>;
