import { resolve } from "node:path";

import type {
  DesignDeliverable,
  DesignDeliverableReport,
  DesignIntelligenceFinding,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function hexToRgb(value: string): [number, number, number] | undefined {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return undefined;
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

function luminance(value: string): number | undefined {
  const rgb = hexToRgb(value);
  if (!rgb) return undefined;
  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: string, background: string): number | undefined {
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === undefined || second === undefined) return undefined;
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function requiredSection(
  deliverable: DesignDeliverable["scope"]["deliverables"][number],
  present: boolean,
  path: string,
  findings: DesignIntelligenceFinding[],
): void {
  if (present) return;
  findings.push({
    ruleId: "ZTDE-DI-001",
    severity: "error",
    path,
    message: `Declared deliverable ${deliverable} is missing its structured section.`,
    remediation: `Add the ${path} section or remove ${deliverable} from scope.deliverables.`,
  });
}

function resolveTokenColor(
  name: string,
  tokens: Map<string, DesignDeliverable["tokenSystem"]["tokens"][number]>,
  modeOverrides?: Map<string, DesignDeliverable["tokenSystem"]["modes"][number]["overrides"][number]>,
  visited = new Set<string>(),
): string | undefined {
  if (visited.has(name)) return undefined;
  visited.add(name);
  const override = modeOverrides?.get(name);
  if (typeof override?.value === "string") return override.value;
  if (override?.reference) {
    return resolveTokenColor(override.reference, tokens, modeOverrides, visited);
  }
  const token = tokens.get(name);
  if (!token || token.type !== "color") return undefined;
  if (typeof token.value === "string") return token.value;
  return token.reference ? resolveTokenColor(token.reference, tokens, modeOverrides, visited) : undefined;
}

function tokenChainTerminates(
  name: string,
  tokens: Map<string, DesignDeliverable["tokenSystem"]["tokens"][number]>,
  visited = new Set<string>(),
): boolean {
  if (visited.has(name)) return false;
  visited.add(name);
  const token = tokens.get(name);
  if (!token) return false;
  if (token.value !== undefined) return true;
  return token.reference ? tokenChainTerminates(token.reference, tokens, visited) : false;
}

function addDuplicates(
  values: string[],
  path: string,
  label: string,
  findings: DesignIntelligenceFinding[],
): void {
  for (const duplicate of duplicateValues(values)) {
    findings.push({
      ruleId: "ZTDE-DI-002",
      severity: "error",
      path,
      message: `Duplicate ${label}: ${duplicate}.`,
      remediation: `Give every ${label} a stable unique identifier.`,
    });
  }
}

export function validateDesignDeliverable(
  manifest: DesignDeliverable,
  sourcePath: string,
): DesignDeliverableReport {
  const findings: DesignIntelligenceFinding[] = [];
  const declared = new Set(manifest.scope.deliverables);

  if (declared.has("brand-system")) {
    requiredSection("brand-system", manifest.brand !== undefined, "brand", findings);
  }
  if (declared.has("figma-library")) {
    requiredSection("figma-library", manifest.figma !== undefined, "figma", findings);
  }
  if (declared.has("asset-set")) {
    requiredSection("asset-set", manifest.assets.length > 0, "assets", findings);
  }
  if (declared.has("icon-system")) {
    requiredSection("icon-system", manifest.iconSystem !== undefined, "iconSystem", findings);
  }
  if (declared.has("presentation")) {
    requiredSection("presentation", manifest.presentations.length > 0, "presentations", findings);
  }

  addDuplicates(manifest.scope.deliverables, "scope.deliverables", "deliverable", findings);
  addDuplicates(manifest.tokenSystem.tokens.map((token) => token.name), "tokenSystem.tokens", "token name", findings);
  addDuplicates(manifest.tokenSystem.modes.map((mode) => mode.name), "tokenSystem.modes", "mode name", findings);
  addDuplicates(manifest.assets.map((asset) => asset.id), "assets", "asset identifier", findings);
  addDuplicates(manifest.evidence.map((evidence) => evidence.id), "evidence", "evidence identifier", findings);

  const tokens = new Map(manifest.tokenSystem.tokens.map((token) => [token.name, token]));
  for (const [index, token] of manifest.tokenSystem.tokens.entries()) {
    if (!token.reference) continue;
    const referenced = tokens.get(token.reference);
    if (!referenced) {
      findings.push({
        ruleId: "ZTDE-DI-101",
        severity: "error",
        path: `tokenSystem.tokens[${index}].reference`,
        message: `Token ${token.name} references missing token ${token.reference}.`,
        remediation: "Add the referenced token or correct the reference.",
      });
    } else if (referenced.type !== token.type) {
      findings.push({
        ruleId: "ZTDE-DI-102",
        severity: "error",
        path: `tokenSystem.tokens[${index}].reference`,
        message: `Token ${token.name} and ${token.reference} have different types.`,
        remediation: "Reference a token of the same type.",
      });
    } else if (!tokenChainTerminates(token.name, tokens)) {
      findings.push({
        ruleId: "ZTDE-DI-103",
        severity: "error",
        path: `tokenSystem.tokens[${index}]`,
        message: `Token ${token.name} has a cyclic or unresolved reference chain.`,
        remediation: "Terminate every token chain at one compatible primitive token.",
      });
    }
  }

  for (const [modeIndex, mode] of manifest.tokenSystem.modes.entries()) {
    addDuplicates(mode.overrides.map((override) => override.token), `tokenSystem.modes[${modeIndex}].overrides`, "mode override", findings);
    for (const [overrideIndex, override] of mode.overrides.entries()) {
      const token = tokens.get(override.token);
      if (!token) {
        findings.push({
          ruleId: "ZTDE-DI-104",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].token`,
          message: `Mode ${mode.name} overrides missing token ${override.token}.`,
          remediation: "Correct the token name or add the token before declaring the override.",
        });
      }
      if (override.reference && !tokens.has(override.reference)) {
        findings.push({
          ruleId: "ZTDE-DI-104",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].reference`,
          message: `Mode ${mode.name} references missing token ${override.reference}.`,
          remediation: "Correct the mode reference or add the referenced token.",
        });
      }
      if (
        token &&
        override.reference &&
        tokens.get(override.reference)?.type !== token.type
      ) {
        findings.push({
          ruleId: "ZTDE-DI-105",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].reference`,
          message: `Mode ${mode.name} changes ${override.token} to an incompatible token type.`,
          remediation: "Reference a token with the same type as the overridden token.",
        });
      }
      if (token?.type === "color" && override.value !== undefined && (typeof override.value !== "string" || !hexToRgb(override.value))) {
        findings.push({
          ruleId: "ZTDE-DI-105",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].value`,
          message: `Color override for ${override.token} is not an opaque six-digit hexadecimal color.`,
          remediation: "Use an opaque #RRGGBB value or a compatible token reference.",
        });
      }
    }
  }

  const assets = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  if (manifest.brand) {
    addDuplicates(manifest.brand.marks.map((mark) => mark.id), "brand.marks", "brand mark", findings);
    for (const [index, mark] of manifest.brand.marks.entries()) {
      if (!assets.has(mark.asset)) {
        findings.push({
          ruleId: "ZTDE-DI-201",
          severity: "error",
          path: `brand.marks[${index}].asset`,
          message: `Brand mark ${mark.id} references missing asset ${mark.asset}.`,
          remediation: "Add the logo asset with approved provenance or correct the asset identifier.",
        });
      }
    }
  }

  if (manifest.figma) {
    addDuplicates(manifest.figma.pages.map((page) => page.name), "figma.pages", "Figma page name", findings);
    const pageRoles = new Set(manifest.figma.pages.map((page) => page.role));
    for (const requiredRole of ["foundations", "components"] as const) {
      if (!pageRoles.has(requiredRole)) {
        findings.push({
          ruleId: "ZTDE-DI-202",
          severity: "error",
          path: "figma.pages",
          message: `Figma library lacks a ${requiredRole} page.`,
          remediation: `Add a maintained ${requiredRole} page with a stated purpose.`,
        });
      }
    }
    addDuplicates(manifest.figma.collections.map((collection) => collection.name), "figma.collections", "Figma collection", findings);
    for (const [collectionIndex, collection] of manifest.figma.collections.entries()) {
      addDuplicates(collection.modes, `figma.collections[${collectionIndex}].modes`, "Figma mode", findings);
      for (const [tokenIndex, tokenName] of collection.tokens.entries()) {
        if (!tokens.has(tokenName)) {
          findings.push({
            ruleId: "ZTDE-DI-203",
            severity: "error",
            path: `figma.collections[${collectionIndex}].tokens[${tokenIndex}]`,
            message: `Figma collection ${collection.name} references missing token ${tokenName}.`,
            remediation: "Bind the collection only to canonical manifest tokens.",
          });
        }
      }
    }
    addDuplicates(manifest.figma.components.map((component) => component.name), "figma.components", "component name", findings);
    for (const [componentIndex, component] of manifest.figma.components.entries()) {
      addDuplicates(component.properties.map((property) => property.name), `figma.components[${componentIndex}].properties`, "component property", findings);
      const states = new Set(component.states);
      if (!states.has("default") || (component.interactive && !states.has("focus"))) {
        findings.push({
          ruleId: "ZTDE-DI-204",
          severity: "error",
          path: `figma.components[${componentIndex}].states`,
          message: `Component ${component.name} does not declare required default and interactive focus states.`,
          remediation: "Add default and, for interactive components, focus states to the component contract.",
        });
      }
      if (component.interactive && !states.has("disabled")) {
        findings.push({
          ruleId: "ZTDE-DI-205",
          severity: "warning",
          path: `figma.components[${componentIndex}].states`,
          message: `Interactive component ${component.name} has no disabled state.`,
          remediation: "Add a disabled state or document why disabling is invalid for this component.",
        });
      }
      if (!component.documented) {
        findings.push({
          ruleId: "ZTDE-DI-206",
          severity: "warning",
          path: `figma.components[${componentIndex}].documented`,
          message: `Component ${component.name} lacks usage documentation.`,
          remediation: "Document purpose, property semantics, state use, and accessibility constraints.",
        });
      }
    }
  }

  for (const [index, asset] of manifest.assets.entries()) {
    if (asset.rights.status !== "approved") {
      findings.push({
        ruleId: "ZTDE-DI-301",
        severity: "error",
        path: `assets[${index}].rights.status`,
        message: `Asset ${asset.id} has unresolved rights status ${asset.rights.status}.`,
        remediation: "Do not ship the asset until rights are reviewed and recorded as approved, or replace it.",
      });
    }
    if (asset.rights.status === "approved" && !asset.rights.evidence && !asset.source.sourceUrl) {
      findings.push({
        ruleId: "ZTDE-DI-302",
        severity: "error",
        path: `assets[${index}].rights`,
        message: `Asset ${asset.id} is marked approved without a source URL or evidence path.`,
        remediation: "Record verifiable rights evidence; an approval label alone is insufficient.",
      });
    }
    if (
      asset.rights.status === "approved" &&
      asset.source.origin !== "original" &&
      (!asset.rights.reviewedBy || !asset.rights.reviewedAt)
    ) {
      findings.push({
        ruleId: "ZTDE-DI-309",
        severity: "error",
        path: `assets[${index}].rights`,
        message: `Non-original asset ${asset.id} is approved without attributable review metadata.`,
        remediation: "Record the reviewer-provided name and review timestamp. An agent must not invent this approval.",
      });
    }
    if (asset.rights.basis === "spdx-license" && !asset.rights.spdxExpression) {
      findings.push({
        ruleId: "ZTDE-DI-303",
        severity: "error",
        path: `assets[${index}].rights.spdxExpression`,
        message: `Asset ${asset.id} uses an SPDX basis without an SPDX expression.`,
        remediation: "Record the applicable SPDX identifier or expression and retain source evidence.",
      });
    }
    if (asset.source.origin === "generated" && !asset.generation) {
      findings.push({
        ruleId: "ZTDE-DI-304",
        severity: "error",
        path: `assets[${index}].generation`,
        message: `Generated asset ${asset.id} lacks generation provenance.`,
        remediation: "Record provider, model, prompt record, human contributions, and reference-asset rights.",
      });
    }
    if (asset.source.origin !== "generated" && asset.generation) {
      findings.push({
        ruleId: "ZTDE-DI-305",
        severity: "warning",
        path: `assets[${index}].generation`,
        message: `Asset ${asset.id} has generation metadata but origin ${asset.source.origin}.`,
        remediation: "Correct the origin or remove unrelated generation metadata.",
      });
    }
    for (const [referenceIndex, reference] of asset.generation?.references.entries() ?? []) {
      if (reference.rightsStatus !== "approved") {
        findings.push({
          ruleId: "ZTDE-DI-306",
          severity: "error",
          path: `assets[${index}].generation.references[${referenceIndex}].rightsStatus`,
          message: `Generated asset ${asset.id} depends on a reference with unresolved rights.`,
          remediation: "Approve and document the reference rights or remove the reference from the generation workflow.",
        });
      }
    }
    if (asset.alternative.kind === "decorative" && asset.alternative.content) {
      findings.push({
        ruleId: "ZTDE-DI-307",
        severity: "warning",
        path: `assets[${index}].alternative`,
        message: `Decorative asset ${asset.id} contains alternative text.`,
        remediation: "Use an empty alternative in implementation, or reclassify the asset if it communicates information.",
      });
    }
    if (asset.alternative.kind !== "decorative" && !asset.alternative.content) {
      findings.push({
        ruleId: "ZTDE-DI-308",
        severity: "error",
        path: `assets[${index}].alternative.content`,
        message: `Informative asset ${asset.id} lacks alternative content.`,
        remediation: "Add concise text, a long description, data table, caption, or transcript appropriate to the asset.",
      });
    }
  }

  if (manifest.iconSystem) {
    addDuplicates(manifest.iconSystem.icons.map((icon) => icon.id), "iconSystem.icons", "icon identifier", findings);
    addDuplicates(manifest.iconSystem.icons.map((icon) => icon.name), "iconSystem.icons", "icon name", findings);
    for (const [index, icon] of manifest.iconSystem.icons.entries()) {
      const asset = assets.get(icon.asset);
      if (!asset || asset.kind !== "icon") {
        findings.push({
          ruleId: "ZTDE-DI-401",
          severity: "error",
          path: `iconSystem.icons[${index}].asset`,
          message: `Icon ${icon.id} does not reference an icon asset.`,
          remediation: "Add or reference an approved asset whose kind is icon.",
        });
      }
      if (!icon.decorative && !icon.accessibleName) {
        findings.push({
          ruleId: "ZTDE-DI-402",
          severity: "error",
          path: `iconSystem.icons[${index}].accessibleName`,
          message: `Semantic icon ${icon.id} lacks an accessible name.`,
          remediation: "Provide an outcome-oriented accessible name or pair the icon with equivalent visible text.",
        });
      }
      if (icon.decorative && icon.accessibleName) {
        findings.push({
          ruleId: "ZTDE-DI-403",
          severity: "warning",
          path: `iconSystem.icons[${index}].accessibleName`,
          message: `Decorative icon ${icon.id} declares an accessible name.`,
          remediation: "Hide decorative icons from assistive technology or mark the icon as semantic.",
        });
      }
    }
  }

  for (const [presentationIndex, presentation] of manifest.presentations.entries()) {
    addDuplicates(presentation.masterLayouts, `presentations[${presentationIndex}].masterLayouts`, "master layout", findings);
    addDuplicates(presentation.slides.map((slide) => slide.id), `presentations[${presentationIndex}].slides`, "slide identifier", findings);
    const layouts = new Set(presentation.masterLayouts);
    for (const [slideIndex, slide] of presentation.slides.entries()) {
      if (!layouts.has(slide.layout)) {
        findings.push({
          ruleId: "ZTDE-DI-501",
          severity: "error",
          path: `presentations[${presentationIndex}].slides[${slideIndex}].layout`,
          message: `Slide ${slide.id} references missing master layout ${slide.layout}.`,
          remediation: "Use a declared master layout or add the missing layout to the presentation system.",
        });
      }
      for (const [assetIndex, assetId] of slide.assets.entries()) {
        if (!assets.has(assetId)) {
          findings.push({
            ruleId: "ZTDE-DI-502",
            severity: "error",
            path: `presentations[${presentationIndex}].slides[${slideIndex}].assets[${assetIndex}]`,
            message: `Slide ${slide.id} references missing asset ${assetId}.`,
            remediation: "Add the approved asset record or remove the reference.",
          });
        }
      }
    }
  }

  const contrastResults: DesignDeliverableReport["contrastResults"] = [];
  const tokenModes = new Map(manifest.tokenSystem.modes.map((mode) => [mode.name, mode]));
  addDuplicates(manifest.accessibility.contrastPairs.map((pair) => pair.id), "accessibility.contrastPairs", "contrast pair", findings);
  for (const [index, pair] of manifest.accessibility.contrastPairs.entries()) {
    const mode = pair.mode ? tokenModes.get(pair.mode) : undefined;
    if (pair.mode && !mode) {
      findings.push({
        ruleId: "ZTDE-DI-601",
        severity: "error",
        path: `accessibility.contrastPairs[${index}].mode`,
        message: `Contrast pair ${pair.id} references missing token mode ${pair.mode}.`,
        remediation: "Declare the token mode or correct the contrast-pair mode.",
      });
      continue;
    }
    const modeOverrides = mode
      ? new Map(mode.overrides.map((override) => [override.token, override]))
      : undefined;
    const foreground = resolveTokenColor(pair.foreground, tokens, modeOverrides);
    const background = resolveTokenColor(pair.background, tokens, modeOverrides);
    if (!foreground || !background) {
      findings.push({
        ruleId: "ZTDE-DI-601",
        severity: "error",
        path: `accessibility.contrastPairs[${index}]`,
        message: `Contrast pair ${pair.id} cannot resolve both colors to primitive values.`,
        remediation: "Reference color tokens with valid, acyclic primitive color values.",
      });
      continue;
    }
    if (
      pair.usage === "large-text" &&
      (pair.fontSizePx === undefined ||
        pair.fontWeight === undefined ||
        (pair.fontSizePx < 24 && !(pair.fontSizePx >= 18.66 && pair.fontWeight >= 700)))
    ) {
      findings.push({
        ruleId: "ZTDE-DI-602",
        severity: "error",
        path: `accessibility.contrastPairs[${index}]`,
        message: `Contrast pair ${pair.id} is classified as large text without qualifying size and weight.`,
        remediation: "Record at least 24px regular text or 18.66px text at weight 700 or greater, otherwise classify it as normal text.",
      });
    }
    const ratio = contrastRatio(foreground, background)!;
    const required = pair.usage === "normal-text" ? 4.5 : 3;
    const passed = ratio + Number.EPSILON >= required;
    contrastResults.push({ id: pair.id, ratio: Number(ratio.toFixed(2)), required, passed });
    if (!passed) {
      findings.push({
        ruleId: "ZTDE-DI-603",
        severity: "error",
        path: `accessibility.contrastPairs[${index}]`,
        message: `Contrast pair ${pair.id} has ratio ${ratio.toFixed(2)}:1 and requires ${required}:1.`,
        remediation: "Change semantic token references or primitive values, then verify the rendered result.",
      });
    }
  }

  for (const [index, cue] of manifest.accessibility.nonColorCues.entries()) {
    const uniqueCues = new Set(cue.cues);
    if (uniqueCues.size !== cue.cues.length || [...uniqueCues].every((value) => value === "color")) {
      findings.push({
        ruleId: "ZTDE-DI-604",
        severity: "error",
        path: `accessibility.nonColorCues[${index}].cues`,
        message: `Meaning ${cue.meaning} does not declare distinct color-independent cues.`,
        remediation: "Combine color with text, icon, shape, pattern, position, value, or underline.",
      });
    }
  }

  const summary = {
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warning").length,
    info: findings.filter((finding) => finding.severity === "info").length,
  };

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourcePath: resolve(sourcePath),
    manifestId: manifest.id,
    product: manifest.product,
    deliverables: manifest.scope.deliverables,
    findings,
    contrastResults,
    coverage: {
      tokens: manifest.tokenSystem.tokens.length,
      assets: manifest.assets.length,
      icons: manifest.iconSystem?.icons.length ?? 0,
      presentations: manifest.presentations.length,
      slides: manifest.presentations.reduce((total, presentation) => total + presentation.slides.length, 0),
      contrastPairs: manifest.accessibility.contrastPairs.length,
    },
    summary,
    passed: summary.errors === 0,
    limitations: [
      "Manifest validation verifies declared structure, token math, references, and provenance records; it does not inspect Figma files or rendered pixels.",
      "Rights records support review but are not legal advice or a determination that an asset is cleared in every jurisdiction and channel.",
      "Run browser verification and human review against final exported or implemented artifacts.",
    ],
  };
}
