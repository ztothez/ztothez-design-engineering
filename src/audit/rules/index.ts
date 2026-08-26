import type { AuditRule } from "../types.js";
import { accessibilityNameRule } from "./accessibility-name.js";
import { componentSizeRule } from "./component-size.js";
import { mixedResponsibilitiesRule } from "./mixed-responsibilities.js";
import { mockProductionPathRule } from "./mock-production-path.js";
import { networkStateRule } from "./network-state.js";
import { placeholderInteractionRule } from "./placeholder-interaction.js";
import { rawDesignValuesRule } from "./raw-design-values.js";

export const sourceRules: readonly AuditRule[] = [
  componentSizeRule,
  mixedResponsibilitiesRule,
  mockProductionPathRule,
  placeholderInteractionRule,
  rawDesignValuesRule,
  networkStateRule,
  accessibilityNameRule,
];
