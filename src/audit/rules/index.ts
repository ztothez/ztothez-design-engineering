import type { AuditRule } from "../types.js";
import { accessibilityNameRule } from "./accessibility-name.js";
import { componentSizeRule } from "./component-size.js";
import { credentialPlaceholderRule } from "./credential-placeholder.js";
import { interactiveIntegrityRule } from "./interactive-integrity.js";
import { mixedResponsibilitiesRule } from "./mixed-responsibilities.js";
import { mockProductionPathRule } from "./mock-production-path.js";
import { networkStateRule } from "./network-state.js";
import { operationalClaimRule } from "./operational-claim.js";
import { placeholderInteractionRule } from "./placeholder-interaction.js";
import { rawDesignValuesRule } from "./raw-design-values.js";

export const sourceRules: readonly AuditRule[] = [
  componentSizeRule,
  mixedResponsibilitiesRule,
  credentialPlaceholderRule,
  mockProductionPathRule,
  placeholderInteractionRule,
  interactiveIntegrityRule,
  operationalClaimRule,
  rawDesignValuesRule,
  networkStateRule,
  accessibilityNameRule,
];
