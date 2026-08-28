import type { z } from "zod";

import type {
  ProductContract,
  ProductTaskProfile,
  productArchetypeSchema,
  productQualityDimensionSchema,
} from "./schema.js";

export type ProductArchetype = z.infer<typeof productArchetypeSchema>;
export type ProductQualityDimension = z.infer<typeof productQualityDimensionSchema>;

export type ProductArchetypeDefinition = {
  id: ProductArchetype;
  supportedInterfaces: ReadonlySet<"browser" | "desktop" | "source-only">;
  requiredDimensions: ReadonlySet<ProductQualityDimension>;
};

const allDimensions = new Set<ProductQualityDimension>([
  "truthful-disclosure",
  "information-design",
  "visual-system",
  "accessibility",
  "responsive-structure",
  "state-integrity",
  "maintainability",
]);

export const PRODUCT_ARCHETYPES: Record<ProductArchetype, ProductArchetypeDefinition> = {
  "operational-dashboard": {
    id: "operational-dashboard",
    supportedInterfaces: new Set(["browser", "desktop"]),
    requiredDimensions: allDimensions,
  },
  "ai-workspace": {
    id: "ai-workspace",
    supportedInterfaces: new Set(["browser", "desktop"]),
    requiredDimensions: allDimensions,
  },
  "content-site": {
    id: "content-site",
    supportedInterfaces: new Set(["browser"]),
    requiredDimensions: new Set([
      "information-design",
      "visual-system",
      "accessibility",
      "responsive-structure",
      "maintainability",
    ]),
  },
  utility: {
    id: "utility",
    supportedInterfaces: new Set(["browser", "desktop", "source-only"]),
    requiredDimensions: new Set([
      "truthful-disclosure",
      "information-design",
      "accessibility",
      "state-integrity",
      "maintainability",
    ]),
  },
  "full-stack-workflow": {
    id: "full-stack-workflow",
    supportedInterfaces: new Set(["browser", "desktop"]),
    requiredDimensions: allDimensions,
  },
};

export type ArchetypeActivationIssue = {
  code: "CONTRACT-ARCHETYPE-INTERFACE" | "CONTRACT-ARCHETYPE-DIMENSION" | "CONTRACT-BROWSER-RESPONSIVE";
  path: string;
  message: string;
};

export function validateArchetypeActivation(
  profile: ProductTaskProfile,
): ArchetypeActivationIssue[] {
  const issues: ArchetypeActivationIssue[] = [];
  const definition = PRODUCT_ARCHETYPES[profile.archetype];
  if (!definition.supportedInterfaces.has(profile.interface)) {
    issues.push({
      code: "CONTRACT-ARCHETYPE-INTERFACE",
      path: "benchmark.interface",
      message: `Archetype ${profile.archetype} does not support interface ${profile.interface}.`,
    });
  }
  const dimensions = new Map(profile.qualityDimensions.map((dimension) => [dimension.id, dimension]));
  for (const required of definition.requiredDimensions) {
    if (dimensions.get(required)?.status !== "required") {
      issues.push({
        code: "CONTRACT-ARCHETYPE-DIMENSION",
        path: `benchmark.qualityDimensions.${required}`,
        message: `Archetype ${profile.archetype} requires dimension ${required}.`,
      });
    }
  }
  if (
    profile.interface === "browser" &&
    dimensions.get("responsive-structure")?.status !== "required"
  ) {
    issues.push({
      code: "CONTRACT-BROWSER-RESPONSIVE",
      path: "benchmark.qualityDimensions.responsive-structure",
      message: "Browser products must activate responsive structure.",
    });
  }
  return issues;
}

export type TaskComparability = {
  comparable: boolean;
  reasons: string[];
};

export function assessTaskContractComparability(
  left: ProductContract,
  right: ProductContract,
): TaskComparability {
  if (left.version !== "1.1" || right.version !== "1.1") {
    return {
      comparable: false,
      reasons: ["Both products require version 1.1 task contracts before comparison."],
    };
  }
  const reasons: string[] = [];
  if (left.benchmark.comparison.taskContractId !== right.benchmark.comparison.taskContractId) {
    reasons.push("Products use different task-contract identifiers.");
  }
  if (left.benchmark.archetype !== right.benchmark.archetype) {
    reasons.push("Products use different interface archetypes.");
  }
  const signature = (contract: typeof left) =>
    contract.benchmark.tasks
      .filter((task) => task.primary)
      .map((task) => `${task.id}|${task.actor}|${task.mode}|${task.intent}|${task.success.observable}`)
      .sort();
  if (JSON.stringify(signature(left)) !== JSON.stringify(signature(right))) {
    reasons.push("Primary task intent or observable success differs.");
  }
  return { comparable: reasons.length === 0, reasons };
}
