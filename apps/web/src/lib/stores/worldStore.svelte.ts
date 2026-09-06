/**
 * @file worldStore.svelte.ts
 * @description Svelte 5 Runes reactive store for World Studio Blueprints, Dynamic Fields, Formulas, and Entities.
 * Block Standard: BLOCK_WORLD_STORE_RUNE_002
 */

import {
  evaluateFormula,
  extractFormulaVariables,
} from "../engine/formulaEngine";

export type BlueprintClass = "FIRST_CLASS" | "SECOND_CLASS";

export type BlueprintFieldType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "ENUM"
  | "VALUE_TYPE"
  | "BLUEPRINT_REF"
  | "FORMULA";

export interface ValueTypeOptionItem {
  label: string; // Display Name (e.g. "Qi Refining")
  value: string; // Storage key / code (e.g. "qi_refining")
  numericValue?: number; // Numeric Power / Score (e.g. 100)
  power?: number; // Alias for numeric power
  description?: string;
}

export type EnumOptionItem = ValueTypeOptionItem;

export interface DynamicFieldDef {
  id: string;
  name: string; // Machine key e.g. "gender", "romantic_feelings", "total_combat_power"
  label: string; // Human readable label
  fieldType: BlueprintFieldType;
  description?: string;
  required?: boolean;
  defaultValue?: any;

  // For ENUM (supporting both simple strings and dual-valued {name, power} items):
  options?: (string | EnumOptionItem)[];

  // For BLUEPRINT_REF:
  targetBlueprintId?: string; // ID of referenced blueprint (1st or 2nd class)
  targetBlueprintName?: string;
  referenceCardinality?: "ONE" | "MANY";

  // For NUMBER:
  min?: number;
  max?: number;
  step?: number;
  unit?: string; // e.g. "Pts", "Rank", "Atk"

  // For FORMULA:
  formulaExpression?: string; // e.g. "(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery"
  formulaDependencies?: string[];
}

export interface BlueprintDef {
  id: string;
  name: string;
  blueprintClass: BlueprintClass; // FIRST_CLASS (Entities) | SECOND_CLASS (Sub-Schemas/Value Objects)
  category: string; // Freeform category tag e.g. "Characters", "Relics", "Systems & Affection", "Factions & Sects"
  description: string;
  fields: DynamicFieldDef[];
  isSystemDefault?: boolean;
}

export interface EntityItem {
  id: string;
  name: string;
  blueprintId: string;
  blueprintName: string;
  category: string;
  description: string;
  properties: Record<string, any>;
  computedFormulas?: Record<string, number>;
  lastMutatedSeqNumber: number;
}

// =====================================
// Timeline & Event Sourcing Types
// =====================================

export type EffectOperation =
  | "SET"
  | "INCREMENT"
  | "DECREMENT"
  | "APPEND"
  | "REMOVE"
  | "TRANSFER";

export interface TimelineEffectItem {
  id?: string;
  targetEntityId: string;
  entityName?: string;
  propertyKey: string; // Direct or dot notation e.g. "attack" or "cultivation.major_realm"
  operation: EffectOperation;
  value: any;
}

export interface TimelineEventItem {
  id: string;
  narrativeSequenceNumber: number;
  chronologicalOrder: number;
  title: string;
  description: string;
  anchorChapterTitle?: string;
  anchorSceneTitle?: string;
  anchorSceneId?: string;
  effects: TimelineEffectItem[];
  createdAt?: string;
}

// =====================================
// Invariant Rules Types
// =====================================

export type RuleSeverity = "BLOCKING_ERROR" | "WARNING" | "ADVISORY_NOTE";

export type RuleType =
  | "STATE_GUARD"
  | "NUMERIC_BOUNDS"
  | "PREREQUISITE"
  | "RELATIONAL_GUARD"
  | "FORMULA_BOUNDARY";

export interface InvariantRuleItem {
  id: string;
  name: string;
  severity: RuleSeverity;
  type: RuleType;
  targetBlueprintId?: string;
  targetBlueprintName?: string;
  targetCategory?: string;
  predicateExpression: string;
  predicateSummary: string;
  description: string;
  enabled: boolean;
  suggestedResolution?: string;
}

// =====================================
// Continuity Audit & RFC 7807 Types
// =====================================

export interface ContinuityViolationItem {
  id: string;
  code: string; // e.g. "INVARIANT_STATE_ILLEGAL_ACTION"
  ruleId?: string;
  ruleName: string;
  severity: RuleSeverity;
  sceneId: string;
  sceneTitle: string;
  sequenceNumber: number;
  entityId: string;
  entityName: string;
  property: string;
  expectedValue: string;
  calculatedValue: string;
  historicalCausalEventId?: string;
  historicalCausalEventTitle?: string;
  historicalCausalSequence?: number;
  message: string;
  rfc7807Uri: string;
  suggestedResolution: string;
  overridden?: boolean;
  overrideJustification?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}

export class WorldStateStore {
  blueprints = $state<BlueprintDef[]>([]);
  entities = $state<EntityItem[]>([]);
  timelineEvents = $state<TimelineEventItem[]>([]);
  rules = $state<InvariantRuleItem[]>([]);
  violations = $state<ContinuityViolationItem[]>([]);

  constructor() {
    this.recomputeAllEntityFormulas();
  }

  // =====================================
  // Blueprint CRUD Methods
  // =====================================

  getBlueprints(blueprintClass?: BlueprintClass): BlueprintDef[] {
    if (!blueprintClass) return this.blueprints;
    return this.blueprints.filter((b) => b.blueprintClass === blueprintClass);
  }

  getFirstClassBlueprints(): BlueprintDef[] {
    return this.getBlueprints("FIRST_CLASS");
  }

  getSecondClassBlueprints(): BlueprintDef[] {
    return this.getBlueprints("SECOND_CLASS");
  }

  getBlueprint(id?: string): BlueprintDef | undefined {
    if (!id) return undefined;
    return this.blueprints.find((b) => b.id === id);
  }

  addBlueprint(data: Omit<BlueprintDef, "id">): BlueprintDef {
    const newBlueprint: BlueprintDef = {
      ...data,
      id: `bp-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      fields: data.fields || [],
    };
    this.blueprints.push(newBlueprint);
    return newBlueprint;
  }

  updateBlueprint(
    id: string | undefined,
    updates: Partial<Omit<BlueprintDef, "id">>,
  ): BlueprintDef | undefined {
    if (!id) return undefined;
    const idx = this.blueprints.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;

    this.blueprints[idx] = {
      ...this.blueprints[idx],
      ...updates,
      fields: updates.fields || this.blueprints[idx].fields,
    };

    this.recomputeAllEntityFormulas();
    return this.blueprints[idx];
  }

  deleteBlueprint(id?: string): boolean {
    if (!id) return false;
    const idx = this.blueprints.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.blueprints.splice(idx, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  // =====================================
  // Dynamic Field CRUD Methods
  // =====================================

  addFieldToBlueprint(
    blueprintId: string,
    field: Omit<DynamicFieldDef, "id">,
  ): DynamicFieldDef | undefined {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return undefined;

    const newField: DynamicFieldDef = {
      ...field,
      id: `f-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
    };

    bp.fields.push(newField);
    this.recomputeAllEntityFormulas();
    return newField;
  }

  updateFieldInBlueprint(
    blueprintId: string,
    fieldId: string,
    updates: Partial<DynamicFieldDef>,
  ): DynamicFieldDef | undefined {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return undefined;

    const fIdx = bp.fields.findIndex((f) => f.id === fieldId);
    if (fIdx === -1) return undefined;

    bp.fields[fIdx] = {
      ...bp.fields[fIdx],
      ...updates,
    };

    this.recomputeAllEntityFormulas();
    return bp.fields[fIdx];
  }

  removeFieldFromBlueprint(blueprintId: string, fieldId: string): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;

    const fIdx = bp.fields.findIndex((f) => f.id === fieldId);
    if (fIdx === -1) return false;

    bp.fields.splice(fIdx, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  deleteBlueprintField(blueprintId: string, fieldId: string): boolean {
    return this.removeFieldFromBlueprint(blueprintId, fieldId);
  }

  // =====================================
  // Dynamic Option CRUD Methods
  // =====================================

  addOptionToField(
    blueprintId: string,
    fieldId: string,
    option: EnumOptionItem | string,
  ): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;
    const field = bp.fields.find((f) => f.id === fieldId || f.name === fieldId);
    if (!field || (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE")) return false;
    if (!field.options) field.options = [];
    field.options.push(option);
    this.recomputeAllEntityFormulas();
    return true;
  }

  updateOptionInField(
    blueprintId: string,
    fieldId: string,
    optionIndex: number,
    updatedOption: EnumOptionItem | string,
  ): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;
    const field = bp.fields.find((f) => f.id === fieldId || f.name === fieldId);
    if (!field || (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE") || !field.options || optionIndex < 0 || optionIndex >= field.options.length) return false;
    field.options[optionIndex] = updatedOption;
    this.recomputeAllEntityFormulas();
    return true;
  }

  removeOptionFromField(
    blueprintId: string,
    fieldId: string,
    optionIndex: number,
  ): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;
    const field = bp.fields.find((f) => f.id === fieldId || f.name === fieldId);
    if (!field || (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE") || !field.options || optionIndex < 0 || optionIndex >= field.options.length) return false;
    field.options.splice(optionIndex, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  // =====================================
  // Entity CRUD & Reactive Formula Evaluation
  // =====================================

  getEntity(id?: string): EntityItem | undefined {
    if (!id) return undefined;
    return this.entities.find((e) => e.id === id);
  }

  addEntity(
    data: Omit<EntityItem, "id" | "lastMutatedSeqNumber" | "computedFormulas">,
  ): EntityItem {
    const bp = this.getBlueprint(data.blueprintId);
    const newEntity: EntityItem = {
      ...data,
      id: `ent-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`,
      blueprintName: bp ? bp.name : data.blueprintName,
      category: bp ? bp.category : data.category,
      lastMutatedSeqNumber: 0,
    };

    newEntity.computedFormulas = this.evaluateEntityFormulas(newEntity, bp);
    this.entities.push(newEntity);
    return newEntity;
  }

  updateEntity(
    id: string | undefined,
    updates: Partial<Omit<EntityItem, "id">>,
  ): EntityItem | undefined {
    if (!id) return undefined;
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;

    this.entities[idx] = {
      ...this.entities[idx],
      ...updates,
      properties: {
        ...this.entities[idx].properties,
        ...(updates.properties || {}),
      },
    };

    this.entities[idx].computedFormulas = this.evaluateEntityFormulas(
      this.entities[idx],
    );
    return this.entities[idx];
  }

  deleteEntity(id?: string): boolean {
    if (!id) return false;
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.entities.splice(idx, 1);
    return true;
  }

  // =====================================
  // Dynamic Formula & Reference Resolution
  // =====================================

  evaluateEntityFormulas(
    entity: { properties: Record<string, any>; blueprintId: string },
    bp?: BlueprintDef,
  ): Record<string, number> {
    const blueprint = bp || this.getBlueprint(entity.blueprintId);
    if (!blueprint) return {};

    const computed: Record<string, number> = {};
    const context: Record<string, any> = { ...entity.properties };

    // Enrich context with dual-valued value_type/enum options and resolved references
    for (const field of blueprint.fields) {
      if ((field.fieldType === "ENUM" || field.fieldType === "VALUE_TYPE") && field.options) {
        const rawVal = entity.properties[field.name];
        if (rawVal !== undefined && rawVal !== null) {
          const matchingOpt = field.options.find((opt) => {
            if (typeof opt === "string") return opt === rawVal;
            return opt.value === rawVal || opt.label === rawVal;
          });

          if (matchingOpt && typeof matchingOpt === "object") {
            const numVal = matchingOpt.numericValue ?? matchingOpt.power ?? 0;
            context[field.name] = {
              label: matchingOpt.label,
              value: matchingOpt.value,
              name: matchingOpt.label,
              numericValue: numVal,
              power: numVal,
            };
          }
        }
      } else if (field.fieldType === "BLUEPRINT_REF" && field.targetBlueprintId) {
        const targetBp = this.getBlueprint(field.targetBlueprintId);
        if (targetBp && targetBp.blueprintClass === "SECOND_CLASS") {
          const subProps = entity.properties[field.name];
          if (subProps && typeof subProps === "object") {
            const enrichedSub: Record<string, any> = { ...subProps };
            for (const subF of targetBp.fields) {
              if ((subF.fieldType === "ENUM" || subF.fieldType === "VALUE_TYPE") && subF.options) {
                const subRawVal = subProps[subF.name];
                if (subRawVal !== undefined && subRawVal !== null) {
                  const subMatchingOpt = subF.options.find((opt) => {
                    if (typeof opt === "string") return opt === subRawVal;
                    return opt.value === subRawVal || opt.label === subRawVal;
                  });
                  if (subMatchingOpt && typeof subMatchingOpt === "object") {
                    const numVal = subMatchingOpt.numericValue ?? subMatchingOpt.power ?? 0;
                    enrichedSub[subF.name] = {
                      label: subMatchingOpt.label,
                      value: subMatchingOpt.value,
                      name: subMatchingOpt.label,
                      numericValue: numVal,
                      power: numVal,
                    };
                  }
                }
              }
            }
            context[field.name] = enrichedSub;
          }
        } else if (targetBp && targetBp.blueprintClass === "FIRST_CLASS") {
          const targetEntityId = entity.properties[field.name];
          if (targetEntityId && typeof targetEntityId === "string") {
            const linkedEntity = this.entities.find((e) => e.id === targetEntityId);
            if (linkedEntity) {
              context[field.name] = {
                ...linkedEntity.properties,
                id: linkedEntity.id,
                name: linkedEntity.name,
                category: linkedEntity.category,
                ...(linkedEntity.computedFormulas || {}),
              };
            }
          }
        }
      }
    }

    // Find all formula fields in the blueprint
    for (const field of blueprint.fields) {
      if (field.fieldType === "FORMULA" && field.formulaExpression) {
        const evalRes = evaluateFormula(field.formulaExpression, context);
        if (evalRes.success && evalRes.value !== undefined) {
          computed[field.name] = evalRes.value;
          context[field.name] = evalRes.value; // Allow subsequent formulas to reference computed fields
        }
      }
    }

    return computed;
  }

  // =====================================
  // Timeline CRUD & Point-in-Time State Folding
  // =====================================

  getTimelineEvents(
    sortMode: "narrative" | "chronological" = "narrative",
  ): TimelineEventItem[] {
    return [...this.timelineEvents].sort((a, b) => {
      if (sortMode === "narrative") {
        return a.narrativeSequenceNumber - b.narrativeSequenceNumber;
      }
      return a.chronologicalOrder - b.chronologicalOrder;
    });
  }

  getTimelineEvent(id?: string): TimelineEventItem | undefined {
    if (!id) return undefined;
    return this.timelineEvents.find((e) => e.id === id);
  }

  addTimelineEvent(eventData: Omit<TimelineEventItem, "id">): TimelineEventItem {
    const newEvent: TimelineEventItem = {
      ...eventData,
      id: `ev-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      createdAt: eventData.createdAt || new Date().toISOString(),
    };
    this.timelineEvents.push(newEvent);
    this.recomputeAllEntityFormulas();
    return newEvent;
  }

  updateTimelineEvent(
    id: string,
    updates: Partial<Omit<TimelineEventItem, "id">>,
  ): TimelineEventItem | undefined {
    const idx = this.timelineEvents.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    this.timelineEvents[idx] = {
      ...this.timelineEvents[idx],
      ...updates,
    };
    this.recomputeAllEntityFormulas();
    return this.timelineEvents[idx];
  }

  deleteTimelineEvent(id: string): boolean {
    const idx = this.timelineEvents.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.timelineEvents.splice(idx, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  foldStateAtSequence(
    targetSeq: number,
    mode: "narrative" | "chronological" = "narrative",
  ): EntityItem[] {
    const baseEntities: EntityItem[] = JSON.parse(JSON.stringify(this.entities));
    const activeEvents = [...this.timelineEvents]
      .filter((ev) =>
        mode === "narrative"
          ? ev.narrativeSequenceNumber <= targetSeq
          : ev.chronologicalOrder <= targetSeq,
      )
      .sort((a, b) =>
        mode === "narrative"
          ? a.narrativeSequenceNumber - b.narrativeSequenceNumber
          : a.chronologicalOrder - b.chronologicalOrder,
      );

    for (const ev of activeEvents) {
      for (const eff of ev.effects) {
        const targetEntity = baseEntities.find(
          (e) =>
            e.id === eff.targetEntityId ||
            e.name === eff.entityName ||
            e.name === eff.targetEntityId,
        );
        if (!targetEntity) continue;

        targetEntity.lastMutatedSeqNumber = ev.narrativeSequenceNumber;

        const keys = eff.propertyKey.split(".");
        let curr: any = targetEntity.properties;

        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          if (!curr[k] || typeof curr[k] !== "object") {
            curr[k] = {};
          }
          curr = curr[k];
        }

        const finalKey = keys[keys.length - 1];

        switch (eff.operation) {
          case "SET":
          case "TRANSFER":
            curr[finalKey] = eff.value;
            break;
          case "INCREMENT":
            curr[finalKey] =
              (Number(curr[finalKey]) || 0) + (Number(eff.value) || 0);
            break;
          case "DECREMENT":
            curr[finalKey] =
              (Number(curr[finalKey]) || 0) - (Number(eff.value) || 0);
            break;
          case "APPEND":
            if (Array.isArray(curr[finalKey])) {
              curr[finalKey].push(eff.value);
            } else {
              curr[finalKey] = [eff.value];
            }
            break;
          case "REMOVE":
            if (Array.isArray(curr[finalKey])) {
              curr[finalKey] = curr[finalKey].filter((x: any) => x !== eff.value);
            }
            break;
        }
      }
    }

    for (const ent of baseEntities) {
      ent.computedFormulas = this.evaluateEntityFormulas(ent);
    }

    return baseEntities;
  }

  // =====================================
  // Invariant Rules CRUD
  // =====================================

  getRules(): InvariantRuleItem[] {
    return this.rules;
  }

  getRule(id?: string): InvariantRuleItem | undefined {
    if (!id) return undefined;
    return this.rules.find((r) => r.id === id);
  }

  addRule(ruleData: Omit<InvariantRuleItem, "id">): InvariantRuleItem {
    const newRule: InvariantRuleItem = {
      ...ruleData,
      id: `rule-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
    };
    this.rules.push(newRule);
    return newRule;
  }

  updateRule(
    id: string,
    updates: Partial<Omit<InvariantRuleItem, "id">>,
  ): InvariantRuleItem | undefined {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.rules[idx] = {
      ...this.rules[idx],
      ...updates,
    };
    return this.rules[idx];
  }

  toggleRule(id: string): boolean {
    const r = this.getRule(id);
    if (!r) return false;
    r.enabled = !r.enabled;
    return true;
  }

  deleteRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  // =====================================
  // Continuity Audit & RFC 7807 Violations
  // =====================================

  getViolations(): ContinuityViolationItem[] {
    return this.violations;
  }

  runContinuityAudit(): ContinuityViolationItem[] {
    return this.violations;
  }

  overrideViolation(
    id: string,
    justification: string,
    authorName: string = "Lead Author",
  ): boolean {
    const viol = this.violations.find((v) => v.id === id);
    if (!viol) return false;
    viol.overridden = true;
    viol.overrideJustification = justification.trim();
    viol.overriddenBy = authorName;
    viol.overriddenAt = new Date().toISOString();
    return true;
  }

  reconcileViolation(id: string, actionType: string): boolean {
    const idx = this.violations.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    const viol = this.violations[idx];

    if (actionType === "AUTO_LOG_BREAKTHROUGH") {
      this.addTimelineEvent({
        narrativeSequenceNumber: Math.max(1, viol.sequenceNumber - 2),
        chronologicalOrder: 106,
        title: `Breakthrough: Advanced Cultivation Realm for ${viol.entityName}`,
        description: `Auto-reconciled breakthrough event advancing ${viol.entityName} to Core Formation stage before ${viol.sceneTitle}.`,
        anchorSceneTitle: viol.sceneTitle,
        anchorSceneId: viol.sceneId,
        effects: [
          {
            targetEntityId: viol.entityId,
            entityName: viol.entityName,
            propertyKey: "cultivation.major_realm",
            operation: "SET",
            value: 3,
          },
          {
            targetEntityId: viol.entityId,
            entityName: viol.entityName,
            propertyKey: "cultivation.realm_name",
            operation: "SET",
            value: "Core Formation",
          },
        ],
      });
      this.violations.splice(idx, 1);
      return true;
    }

    if (actionType === "AUTO_LINK_RELATIONAL_WEAPON") {
      const weaponEnt = this.entities.find(
        (e: EntityItem) => e.category === "Relics & Armaments",
      );
      const charEnt = this.entities.find((e: EntityItem) => e.category === "Characters");
      if (weaponEnt && charEnt) {
        charEnt.properties.bound_weapon = weaponEnt.id;
        weaponEnt.properties.current_wielder = charEnt.id;
      }
      this.violations.splice(idx, 1);
      return true;
    }

    // Default dismiss
    this.violations.splice(idx, 1);
    return true;
  }

  dismissViolation(id: string): boolean {
    const idx = this.violations.findIndex((v: ContinuityViolationItem) => v.id === id);
    if (idx === -1) return false;
    this.violations.splice(idx, 1);
    return true;
  }

  recomputeAllEntityFormulas(): void {
    for (const entity of this.entities) {
      entity.computedFormulas = this.evaluateEntityFormulas(entity);
    }
  }
}

export const worldStore = new WorldStateStore();
