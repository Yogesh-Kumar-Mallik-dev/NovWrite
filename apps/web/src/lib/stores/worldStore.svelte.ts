/**
 * @file worldStore.svelte.ts
 * @description Svelte 5 Runes reactive store for World Studio Blueprints, Dynamic Fields, Formulas, and Entities with optimistic backend synchronization.
 * Block Standard: BLOCK_WORLD_STORE_RUNE_002
 */

import {
  evaluateFormula,
  extractFormulaVariables,
} from "../engine/formulaEngine";
import { apiClient } from "../api/apiClient";
import { projectStore } from "./projectStore.svelte";

import type {
  BlueprintClass,
  BlueprintFieldType,
  ValueTypeOptionItem,
  EnumOptionItem,
  DynamicFieldDef,
  BlueprintDef,
  EntityItem,
  EffectOperation,
  TimelineEffectItem,
  TimelineEventItem,
  RuleSeverity,
  RuleType,
  InvariantRuleItem,
  ContinuityViolationItem,
  RevisionType,
  EntityRevisionPatch,
  EntityRevision,
  BitemporalEntityState,
  EditNode,
  EditTree,
  TimelineEventWithTree,
} from "@novwrite/bridge";

export type {
  BlueprintClass,
  BlueprintFieldType,
  ValueTypeOptionItem,
  EnumOptionItem,
  DynamicFieldDef,
  BlueprintDef,
  EntityItem,
  EffectOperation,
  TimelineEffectItem,
  TimelineEventItem,
  RuleSeverity,
  RuleType,
  InvariantRuleItem,
  ContinuityViolationItem,
  RevisionType,
  EntityRevisionPatch,
  EntityRevision,
  BitemporalEntityState,
  EditNode,
  EditTree,
  TimelineEventWithTree,
};

const WORLD_STATE_STORAGE_KEY = "novwrite_world_state_v1";

export class WorldStateStore {
  currentProjectId = $state<string | null>(null);
  blueprints = $state<BlueprintDef[]>([]);
  entities = $state<EntityItem[]>([]);
  timelineEvents = $state<TimelineEventItem[]>([]);
  rules = $state<InvariantRuleItem[]>([]);
  violations = $state<ContinuityViolationItem[]>([]);
  revisions = $state<Record<string, EntityRevision[]>>({});
  eventEditTrees = $state<Record<string, EditTree<TimelineEventItem>>>({});
  entityEditTrees = $state<Record<string, EditTree<EntityItem>>>({});
  isSyncing = $state<boolean>(false);
  private unsubscribeSSE: (() => void) | null = null;

  constructor() {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const activeId = localStorage.getItem("novwrite_active_project_id_v1");
      if (activeId) {
        this.currentProjectId = activeId;
      }
    }
    this.loadFromStorage();
    this.recomputeAllEntityFormulas();

    if (typeof window !== "undefined" && this.currentProjectId) {
      this.syncWithBackend(this.currentProjectId);
      this.initSSEListener(this.currentProjectId);
    }
  }

  getStorageKey(): string {
    return this.currentProjectId
      ? `novwrite_world_state_${this.currentProjectId}`
      : "";
  }

  setProject(projectId: string | null): void {
    if (this.currentProjectId) {
      this.saveToStorage();
    }
    this.currentProjectId = projectId;
    this.loadFromStorage();
    this.recomputeAllEntityFormulas();

    if (projectId) {
      this.saveToStorage();
      if (typeof window !== "undefined") {
        this.syncWithBackend(projectId);
        this.initSSEListener(projectId);
      }
    } else {
      if (this.unsubscribeSSE) {
        this.unsubscribeSSE();
        this.unsubscribeSSE = null;
      }
    }
  }

  loadFromStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    try {
      if (!this.currentProjectId) {
        this.blueprints = [];
        this.entities = [];
        this.timelineEvents = [];
        this.rules = [];
        this.violations = [];
        this.revisions = {};
        this.eventEditTrees = {};
        this.entityEditTrees = {};
        return;
      }

      const storageKey = this.getStorageKey();
      const raw = localStorage.getItem(storageKey);

      if (raw) {
        const parsed = JSON.parse(raw);
        this.blueprints = Array.isArray(parsed.blueprints)
          ? parsed.blueprints
          : [];
        this.entities = Array.isArray(parsed.entities) ? parsed.entities : [];
        this.timelineEvents = Array.isArray(parsed.timelineEvents)
          ? parsed.timelineEvents
          : [];
        this.rules = Array.isArray(parsed.rules) ? parsed.rules : [];
        this.violations = Array.isArray(parsed.violations)
          ? parsed.violations
          : [];
        this.revisions =
          parsed.revisions && typeof parsed.revisions === "object"
            ? parsed.revisions
            : {};
        this.eventEditTrees =
          parsed.eventEditTrees && typeof parsed.eventEditTrees === "object"
            ? parsed.eventEditTrees
            : {};
        this.entityEditTrees =
          parsed.entityEditTrees && typeof parsed.entityEditTrees === "object"
            ? parsed.entityEditTrees
            : {};
      } else {
        this.blueprints = [];
        this.entities = [];
        this.timelineEvents = [];
        this.rules = [];
        this.violations = [];
        this.revisions = {};
        this.eventEditTrees = {};
        this.entityEditTrees = {};
      }
    } catch (e) {
      console.warn("[WorldStore] Failed to load state from localStorage:", e);
    }
  }

  saveToStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    if (!this.currentProjectId) return;
    try {
      const payload = {
        blueprints: this.blueprints,
        entities: this.entities,
        timelineEvents: this.timelineEvents,
        rules: this.rules,
        violations: this.violations,
        revisions: this.revisions,
        eventEditTrees: this.eventEditTrees,
        entityEditTrees: this.entityEditTrees,
      };
      localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
    } catch (e) {
      console.warn("[WorldStore] Failed to save state to localStorage:", e);
    }
  }

  /**
   * Reconciles blueprints, entities, timeline events, rules, and audit violations with the canonical Go backend.
   */
  async syncWithBackend(projectId?: string): Promise<void> {
    const targetProject =
      projectId || this.currentProjectId || projectStore.activeProjectId;
    if (!targetProject || typeof window === "undefined") return;

    this.isSyncing = true;
    try {
      const [bpRes, entRes, tlRes, ruleRes, auditRes] =
        await Promise.allSettled([
          apiClient.listBlueprints(targetProject, { pageSize: 100 }),
          apiClient.listEntities(targetProject, { pageSize: 100 }),
          apiClient.listTimelineEvents(targetProject, { pageSize: 100 }),
          apiClient.listRules(targetProject, { pageSize: 100 }),
          apiClient.getAudit(targetProject, { pageSize: 100 }),
        ]);

      if (bpRes.status === "fulfilled" && bpRes.value && bpRes.value.data) {
        const backendBps: BlueprintDef[] = bpRes.value.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          blueprintClass: b.blueprintClass || "FIRST_CLASS",
          category: b.category || "General",
          description: b.description || "",
          fields: b.fields || [],
          isSystemDefault: b.isSystemDefault,
        }));
        const backendIds = new Set(backendBps.map((b) => b.id));
        const localOnly = this.blueprints.filter((b) => !backendIds.has(b.id));
        this.blueprints = [...backendBps, ...localOnly];
      }

      if (entRes.status === "fulfilled" && entRes.value && entRes.value.data) {
        const backendEnts: EntityItem[] = entRes.value.data.map((e: any) => ({
          id: e.id,
          name: e.name,
          blueprintId: e.blueprintId,
          blueprintName: e.blueprintName || "",
          category: e.category || "General",
          description: e.description || "",
          properties: e.properties || {},
          computedFormulas: e.computedFormulas || {},
          lastMutatedSeqNumber: e.lastMutatedSeqNumber ?? 0,
        }));
        const backendEntIds = new Set(backendEnts.map((e) => e.id));
        const localOnlyEnts = this.entities.filter(
          (e) => !backendEntIds.has(e.id),
        );
        this.entities = [...backendEnts, ...localOnlyEnts];
      }

      if (tlRes.status === "fulfilled" && tlRes.value && tlRes.value.data) {
        const backendTls: TimelineEventItem[] = tlRes.value.data.map(
          (ev: any) => ({
            id: ev.id,
            narrativeSequenceNumber: ev.narrativeSequenceNumber ?? 0,
            chronologicalOrder: ev.chronologicalOrder ?? 0,
            title: ev.title,
            description: ev.description || "",
            anchorChapterTitle: ev.anchorChapterTitle,
            anchorSceneTitle: ev.anchorSceneTitle,
            anchorSceneId: ev.anchorSceneId,
            effects: (ev.effects || []).map((eff: any) => ({
              id: eff.id,
              targetEntityId: eff.targetEntity || eff.targetEntityId,
              entityName: eff.entityName,
              propertyKey: eff.propertyKey,
              operation: eff.operation || "SET",
              value: eff.value,
            })),
            createdAt: ev.createdAt || new Date().toISOString(),
          }),
        );
        const backendTlIds = new Set(backendTls.map((t) => t.id));
        const localOnlyTls = this.timelineEvents.filter(
          (t) => !backendTlIds.has(t.id),
        );
        this.timelineEvents = [...backendTls, ...localOnlyTls];
      }

      if (
        ruleRes.status === "fulfilled" &&
        ruleRes.value &&
        ruleRes.value.data
      ) {
        const backendRules: InvariantRuleItem[] = ruleRes.value.data.map(
          (r: any) => ({
            id: r.id,
            name: r.name,
            severity: r.severity || "BLOCKING_ERROR",
            type: r.type || "STATE_GUARD",
            targetBlueprintId: r.targetBlueprintId,
            targetBlueprintName: r.targetBlueprintName,
            targetCategory: r.targetCategory,
            predicateExpression: r.predicateExpression || "",
            predicateSummary: r.predicateSummary || "",
            description: r.description || "",
            enabled: r.enabled ?? true,
            suggestedResolution: r.suggestedResolution,
          }),
        );
        const backendRuleIds = new Set(backendRules.map((r) => r.id));
        const localOnlyRules = this.rules.filter(
          (r) => !backendRuleIds.has(r.id),
        );
        this.rules = [...backendRules, ...localOnlyRules];
      }

      if (
        auditRes.status === "fulfilled" &&
        auditRes.value &&
        auditRes.value.data
      ) {
        const backendAudit: ContinuityViolationItem[] = auditRes.value.data.map(
          (v: any) => ({
            id: v.id,
            code: v.code || "INVARIANT_STATE_ILLEGAL_ACTION",
            ruleId: v.ruleId,
            ruleName: v.ruleName || "Invariant Guard",
            severity: v.severity || "BLOCKING_ERROR",
            sceneId: v.sceneId || "",
            sceneTitle: v.sceneTitle || "",
            sequenceNumber: v.sequenceNumber ?? 0,
            entityId: v.entityId || "",
            entityName: v.entityName || "",
            property: v.property || "",
            expectedValue: v.expectedValue || "",
            calculatedValue: v.calculatedValue || "",
            historicalCausalEventId: v.historicalCausalEventId,
            historicalCausalEventTitle: v.historicalCausalEventTitle,
            historicalCausalSequence: v.historicalCausalSequence,
            message: v.message || "",
            rfc7807Uri:
              v.rfc7807Uri || "https://novwrite.io/errors/continuity-audit",
            suggestedResolution: v.suggestedResolution || "",
            overridden: v.overridden ?? false,
            overrideJustification: v.overrideJustification,
            overriddenBy: v.overriddenBy,
            overriddenAt: v.overriddenAt,
          }),
        );
        this.violations = backendAudit;
      }

      this.recomputeAllEntityFormulas();
      this.saveToStorage();
    } catch {
      // Backend offline or error; seamlessly continue with local cache
    } finally {
      this.isSyncing = false;
    }
  }

  private initSSEListener(projectId: string): void {
    if (this.unsubscribeSSE) {
      this.unsubscribeSSE();
      this.unsubscribeSSE = null;
    }

    this.unsubscribeSSE = apiClient.subscribeEvents(projectId, (evt) => {
      if (evt.event === "BLUEPRINT_CREATED" && evt.payload) {
        const bp = evt.payload as BlueprintDef;
        if (!this.blueprints.some((b) => b.id === bp.id)) {
          this.blueprints.push(bp);
          this.recomputeAllEntityFormulas();
          this.saveToStorage();
        }
      } else if (evt.event === "BLUEPRINT_UPDATED" && evt.payload) {
        const bp = evt.payload as BlueprintDef;
        const idx = this.blueprints.findIndex((b) => b.id === bp.id);
        if (idx !== -1) {
          this.blueprints[idx] = { ...this.blueprints[idx], ...bp };
          this.recomputeAllEntityFormulas();
          this.saveToStorage();
        }
      } else if (evt.event === "BLUEPRINT_DELETED" && evt.payload) {
        const payload = evt.payload as { id: string };
        this.blueprints = this.blueprints.filter((b) => b.id !== payload.id);
        this.recomputeAllEntityFormulas();
        this.saveToStorage();
      } else if (evt.event === "ENTITY_CREATED" && evt.payload) {
        const ent = evt.payload as EntityItem;
        if (!this.entities.some((e) => e.id === ent.id)) {
          this.entities.push(ent);
          this.recomputeAllEntityFormulas();
          this.saveToStorage();
        }
      } else if (
        (evt.event === "ENTITY_UPDATED" || evt.event === "ENTITY_MUTATED") &&
        evt.payload
      ) {
        const ent = evt.payload as EntityItem;
        const idx = this.entities.findIndex((e) => e.id === ent.id);
        if (idx !== -1) {
          this.entities[idx] = { ...this.entities[idx], ...ent };
          this.recomputeAllEntityFormulas();
          this.saveToStorage();
        }
      } else if (evt.event === "ENTITY_DELETED" && evt.payload) {
        const payload = evt.payload as { id: string };
        this.entities = this.entities.filter((e) => e.id !== payload.id);
        delete this.revisions[payload.id];
        delete this.entityEditTrees[payload.id];
        this.recomputeAllEntityFormulas();
        this.saveToStorage();
      } else if (evt.event === "TIMELINE_CHANGED" && evt.payload) {
        const ev = evt.payload as TimelineEventItem;
        const idx = this.timelineEvents.findIndex((e) => e.id === ev.id);
        if (idx !== -1) {
          this.timelineEvents[idx] = { ...this.timelineEvents[idx], ...ev };
        } else {
          this.timelineEvents.push(ev);
        }
        this.recomputeAllEntityFormulas();
        this.saveToStorage();
      } else if (evt.event === "RULE_CREATED" && evt.payload) {
        const r = evt.payload as InvariantRuleItem;
        if (!this.rules.some((item) => item.id === r.id)) {
          this.rules.push(r);
          this.saveToStorage();
        }
      } else if (evt.event === "RULE_UPDATED" && evt.payload) {
        const r = evt.payload as InvariantRuleItem;
        const idx = this.rules.findIndex((item) => item.id === r.id);
        if (idx !== -1) {
          this.rules[idx] = { ...this.rules[idx], ...r };
          this.saveToStorage();
        }
      } else if (evt.event === "RULE_DELETED" && evt.payload) {
        const payload = evt.payload as { id: string };
        this.rules = this.rules.filter((r) => r.id !== payload.id);
        this.saveToStorage();
      } else if (evt.event === "AUDIT_OVERRIDDEN" && evt.payload) {
        const viol = evt.payload as ContinuityViolationItem;
        const idx = this.violations.findIndex((v) => v.id === viol.id);
        if (idx !== -1) {
          this.violations[idx] = {
            ...this.violations[idx],
            ...viol,
            overridden: true,
          };
          this.saveToStorage();
        }
      }
    });
  }

  deleteProjectData(projectId: string): void {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(`novwrite_world_state_${projectId}`);
    }
    if (this.currentProjectId === projectId) {
      this.clearState();
    }
  }

  clearState(): void {
    this.blueprints = [];
    this.entities = [];
    this.timelineEvents = [];
    this.rules = [];
    this.violations = [];
    this.revisions = {};
    this.eventEditTrees = {};
    this.entityEditTrees = {};
    if (this.unsubscribeSSE) {
      this.unsubscribeSSE();
      this.unsubscribeSSE = null;
    }
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const key = this.getStorageKey();
      if (key) {
        localStorage.removeItem(key);
      }
      localStorage.removeItem("novwrite_world_state_v1");
    }
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
    const targetProject =
      this.currentProjectId || projectStore.activeProjectId || "default";
    const newBlueprint: BlueprintDef = {
      ...data,
      id: `bp-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      fields: data.fields || [],
    };
    this.blueprints.push(newBlueprint);
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .createBlueprint(targetProject, {
          name: newBlueprint.name,
          blueprintClass: newBlueprint.blueprintClass,
          category: newBlueprint.category,
          description: newBlueprint.description,
          fields: newBlueprint.fields,
        })
        .then((res) => {
          if (
            res &&
            res.data &&
            res.data.id &&
            res.data.id !== newBlueprint.id
          ) {
            const idx = this.blueprints.findIndex(
              (b) => b.id === newBlueprint.id,
            );
            if (idx !== -1) {
              this.blueprints[idx] = {
                ...this.blueprints[idx],
                id: res.data.id,
              };
              this.saveToStorage();
            }
          }
        })
        .catch(() => {});
    }

    return newBlueprint;
  }

  updateBlueprint(
    id: string | undefined,
    updates: Partial<Omit<BlueprintDef, "id">>,
  ): BlueprintDef | undefined {
    if (!id) return undefined;
    const idx = this.blueprints.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

    this.blueprints[idx] = {
      ...this.blueprints[idx],
      ...updates,
      fields: updates.fields || this.blueprints[idx].fields,
    };

    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .updateBlueprint(targetProject, id, this.blueprints[idx])
        .catch(() => {});
    }

    return this.blueprints[idx];
  }

  deleteBlueprint(id?: string): boolean {
    if (!id) return false;
    const idx = this.blueprints.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

    this.blueprints.splice(idx, 1);
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient.deleteBlueprint(targetProject, id).catch(() => {});
    }

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
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient.updateBlueprint(targetProject, blueprintId, bp).catch(() => {});
    }

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
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient.updateBlueprint(targetProject, blueprintId, bp).catch(() => {});
    }

    return bp.fields[fIdx];
  }

  removeFieldFromBlueprint(blueprintId: string, fieldId: string): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;

    const fIdx = bp.fields.findIndex((f) => f.id === fieldId);
    if (fIdx === -1) return false;

    bp.fields.splice(fIdx, 1);
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient.updateBlueprint(targetProject, blueprintId, bp).catch(() => {});
    }

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
    if (
      !field ||
      (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE")
    )
      return false;
    if (!field.options) field.options = [];
    field.options.push(option);
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient.updateBlueprint(targetProject, blueprintId, bp).catch(() => {});
    }

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
    if (
      !field ||
      (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE") ||
      !field.options ||
      optionIndex < 0 ||
      optionIndex >= field.options.length
    )
      return false;
    field.options[optionIndex] = updatedOption;
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient.updateBlueprint(targetProject, blueprintId, bp).catch(() => {});
    }

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
    if (
      !field ||
      (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE") ||
      !field.options ||
      optionIndex < 0 ||
      optionIndex >= field.options.length
    )
      return false;
    field.options.splice(optionIndex, 1);
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient.updateBlueprint(targetProject, blueprintId, bp).catch(() => {});
    }

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
    const targetProject =
      this.currentProjectId || projectStore.activeProjectId || "default";
    const newEntity: EntityItem = {
      ...data,
      id: `ent-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`,
      blueprintName: bp ? bp.name : data.blueprintName,
      category: bp ? bp.category : data.category,
      lastMutatedSeqNumber: 0,
    };

    newEntity.computedFormulas = this.evaluateEntityFormulas(newEntity, bp);
    this.entities.push(newEntity);

    // Automatically record initial baseline revision
    this.recordEntityRevision(
      newEntity,
      "BASELINE_EDIT",
      "Initial entity creation",
    );

    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .createEntity(targetProject, {
          name: newEntity.name,
          blueprintId: newEntity.blueprintId,
          blueprintName: newEntity.blueprintName,
          category: newEntity.category,
          description: newEntity.description,
          properties: newEntity.properties,
        })
        .then((res) => {
          if (res && res.data && res.data.id && res.data.id !== newEntity.id) {
            const oldId = newEntity.id;
            const newId = res.data.id;
            const idx = this.entities.findIndex((e) => e.id === oldId);
            if (idx !== -1) {
              this.entities[idx] = { ...this.entities[idx], id: newId };
            }
            if (this.revisions[oldId]) {
              this.revisions[newId] = this.revisions[oldId];
              delete this.revisions[oldId];
            }
            if (this.entityEditTrees[oldId]) {
              this.entityEditTrees[newId] = this.entityEditTrees[oldId];
              delete this.entityEditTrees[oldId];
            }
            this.saveToStorage();
          }
        })
        .catch(() => {});
    }

    return newEntity;
  }

  updateEntity(
    id: string | undefined,
    updates: Partial<Omit<EntityItem, "id">>,
    revisionType: RevisionType = "BASELINE_EDIT",
    authorNote?: string,
  ): EntityItem | undefined {
    if (!id) return undefined;
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

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

    // Automatically record edit revision
    this.recordEntityRevision(
      this.entities[idx],
      revisionType,
      authorNote || "Updated entity properties",
    );

    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .updateEntity(targetProject, id, {
          name: updates.name,
          category: updates.category,
          description: updates.description,
          properties: updates.properties,
        })
        .catch(() => {});
    }

    return this.entities[idx];
  }

  deleteEntity(id?: string): boolean {
    if (!id) return false;
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

    this.entities.splice(idx, 1);
    delete this.revisions[id];
    delete this.entityEditTrees[id];
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient.deleteEntity(targetProject, id).catch(() => {});
    }

    return true;
  }

  // =====================================
  // Bitemporal & Dual-Axis Revision Methods
  // =====================================

  computeEntityPatch(
    before: EntityItem | null,
    after: EntityItem,
  ): EntityRevisionPatch {
    const patch: EntityRevisionPatch = {};
    if (!before) {
      patch.name = { before: "", after: after.name };
      patch.propertiesChanged = {};
      for (const [k, v] of Object.entries(after.properties || {})) {
        patch.propertiesChanged[k] = { before: undefined, after: v };
      }
      return patch;
    }

    if (before.name !== after.name) {
      patch.name = { before: before.name, after: after.name };
    }
    if ((before.description || "") !== (after.description || "")) {
      patch.description = {
        before: before.description || "",
        after: after.description || "",
      };
    }
    if ((before.category || "") !== (after.category || "")) {
      patch.category = {
        before: before.category || "",
        after: after.category || "",
      };
    }

    const propsChanged: Record<string, { before: unknown; after: unknown }> =
      {};
    const allKeys = new Set([
      ...Object.keys(before.properties || {}),
      ...Object.keys(after.properties || {}),
    ]);
    for (const k of allKeys) {
      const bVal = before.properties ? before.properties[k] : undefined;
      const aVal = after.properties ? after.properties[k] : undefined;
      if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
        propsChanged[k] = { before: bVal, after: aVal };
      }
    }
    if (Object.keys(propsChanged).length > 0) {
      patch.propertiesChanged = propsChanged;
    }

    if (before.computedFormulas || after.computedFormulas) {
      const formulasChanged: Record<string, { before: number; after: number }> =
        {};
      const allFKeys = new Set([
        ...Object.keys(before.computedFormulas || {}),
        ...Object.keys(after.computedFormulas || {}),
      ]);
      for (const k of allFKeys) {
        const bVal = before.computedFormulas
          ? before.computedFormulas[k]
          : undefined;
        const aVal = after.computedFormulas
          ? after.computedFormulas[k]
          : undefined;
        if (bVal !== aVal && (bVal !== undefined || aVal !== undefined)) {
          formulasChanged[k] = { before: bVal ?? 0, after: aVal ?? 0 };
        }
      }
      if (Object.keys(formulasChanged).length > 0) {
        patch.formulasChanged = formulasChanged;
      }
    }

    return patch;
  }

  recordEntityRevision(
    entity: EntityItem,
    type: RevisionType = "BASELINE_EDIT",
    authorNote?: string,
  ): EntityRevision {
    if (!this.revisions[entity.id]) {
      this.revisions[entity.id] = [];
    }
    const history = this.revisions[entity.id];
    const parent = history.length > 0 ? history[history.length - 1] : null;
    const patch = this.computeEntityPatch(
      parent ? parent.snapshot : null,
      entity,
    );

    const revision: EntityRevision = {
      id: `rev-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      entityId: entity.id,
      parentRevisionId: parent ? parent.id : null,
      revisionNumber: history.length,
      createdAt: new Date().toISOString(),
      type,
      authorNote: authorNote?.trim() || undefined,
      patch,
      snapshot: JSON.parse(JSON.stringify(entity)),
    };

    history.push(revision);
    this.saveToStorage();
    return revision;
  }

  revertEntityRevision(
    entityId: string,
    revisionId: string,
    authorNote?: string,
  ): { restoredEntity: EntityItem; revision: EntityRevision } | undefined {
    const history = this.revisions[entityId];
    if (!history || history.length === 0) return undefined;

    const target = history.find((r) => r.id === revisionId);
    if (!target) return undefined;

    const restored: EntityItem = JSON.parse(JSON.stringify(target.snapshot));
    const note =
      authorNote ||
      `Reverted to revision #${target.revisionNumber} (${target.id})`;
    const rev = this.recordEntityRevision(restored, "REVERT", note);

    const idx = this.entities.findIndex((e) => e.id === entityId);
    if (idx !== -1) {
      this.entities[idx] = restored;
      this.recomputeAllEntityFormulas();
      this.saveToStorage();

      const targetProject =
        this.currentProjectId || projectStore.activeProjectId;
      if (targetProject && targetProject !== "default") {
        apiClient
          .updateEntity(targetProject, entityId, {
            name: restored.name,
            category: restored.category,
            description: restored.description,
            properties: restored.properties,
          })
          .catch(() => {});
      }
    }

    return { restoredEntity: restored, revision: rev };
  }

  getEntityRevisions(entityId?: string): EntityRevision[] {
    if (!entityId) return [];
    return this.revisions[entityId] || [];
  }

  resolveEntityAtCoordinate(
    entityId: string,
    targetSeq: number = 0,
    targetRevisionId?: string,
  ): BitemporalEntityState | undefined {
    const ent = this.getEntity(entityId);
    if (!ent) return undefined;

    const history = this.revisions[entityId] || [];
    let baseRevision: EntityRevision | undefined;

    if (targetRevisionId) {
      baseRevision = history.find((r) => r.id === targetRevisionId);
    } else if (history.length > 0) {
      baseRevision = history[history.length - 1];
    }

    const snapshot = baseRevision ? baseRevision.snapshot : ent;
    let computedProps: Record<string, any> = JSON.parse(
      JSON.stringify(snapshot.properties || {}),
    );

    const activeEvents = [...this.timelineEvents]
      .filter(
        (ev) => targetSeq === 0 || ev.narrativeSequenceNumber <= targetSeq,
      )
      .sort((a, b) => a.narrativeSequenceNumber - b.narrativeSequenceNumber);

    const activeMutations: BitemporalEntityState["activeMutations"] = [];
    let appliedCount = 0;

    for (const ev of activeEvents) {
      if (targetSeq > 0 && ev.narrativeSequenceNumber > targetSeq) break;
      for (const eff of ev.effects) {
        if (eff.targetEntityId === entityId || eff.entityName === ent.name) {
          const keys = eff.propertyKey.split(".");
          let curr: any = computedProps;
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!curr[k] || typeof curr[k] !== "object") curr[k] = {};
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
              if (Array.isArray(curr[finalKey])) curr[finalKey].push(eff.value);
              else curr[finalKey] = [eff.value];
              break;
            case "REMOVE":
              if (Array.isArray(curr[finalKey]))
                curr[finalKey] = curr[finalKey].filter(
                  (x: any) => x !== eff.value,
                );
              break;
          }

          activeMutations.push({
            eventId: ev.id,
            eventTitle: ev.title,
            sequenceNumber: ev.narrativeSequenceNumber,
            propertyKey: eff.propertyKey,
            operation: eff.operation,
            value: eff.value,
          });
          appliedCount++;
        }
      }
    }

    return {
      entityId,
      entityName: snapshot.name,
      category: snapshot.category || "General",
      narrativeSequenceNumber: targetSeq,
      revisionId: baseRevision ? baseRevision.id : "initial",
      revisionNumber: baseRevision ? baseRevision.revisionNumber : 0,
      revisionType: baseRevision ? baseRevision.type : "BASELINE_EDIT",
      properties: computedProps,
      computedFormulas: snapshot.computedFormulas,
      appliedEventsCount: appliedCount,
      activeMutations,
    };
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
      if (
        (field.fieldType === "ENUM" || field.fieldType === "VALUE_TYPE") &&
        field.options
      ) {
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
      } else if (
        field.fieldType === "BLUEPRINT_REF" &&
        field.targetBlueprintId
      ) {
        const targetBp = this.getBlueprint(field.targetBlueprintId);
        if (targetBp && targetBp.blueprintClass === "SECOND_CLASS") {
          const subProps = entity.properties[field.name];
          if (subProps && typeof subProps === "object") {
            const enrichedSub: Record<string, any> = { ...subProps };
            for (const subF of targetBp.fields) {
              if (
                (subF.fieldType === "ENUM" ||
                  subF.fieldType === "VALUE_TYPE") &&
                subF.options
              ) {
                const subRawVal = subProps[subF.name];
                if (subRawVal !== undefined && subRawVal !== null) {
                  const subMatchingOpt = subF.options.find((opt) => {
                    if (typeof opt === "string") return opt === subRawVal;
                    return opt.value === subRawVal || opt.label === subRawVal;
                  });
                  if (subMatchingOpt && typeof subMatchingOpt === "object") {
                    const numVal =
                      subMatchingOpt.numericValue ?? subMatchingOpt.power ?? 0;
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
            const linkedEntity = this.entities.find(
              (e) => e.id === targetEntityId,
            );
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
      } else if (field.fieldType === "ARRAY") {
        const arr = entity.properties[field.name];
        if (Array.isArray(arr)) {
          context[field.name] = arr;
          context[`${field.name}_count`] = arr.length;
        } else {
          context[field.name] = [];
          context[`${field.name}_count`] = 0;
        }
      } else if (field.fieldType === "ARRAY_REF") {
        const arr = entity.properties[field.name];
        if (Array.isArray(arr)) {
          const resolved = arr
            .map((id) => this.entities.find((e) => e.id === id))
            .filter(Boolean);
          context[field.name] = resolved;
          context[`${field.name}_count`] = resolved.length;
        } else {
          context[field.name] = [];
          context[`${field.name}_count`] = 0;
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

  addTimelineEvent(
    eventData: Omit<TimelineEventItem, "id">,
  ): TimelineEventItem {
    const targetProject =
      this.currentProjectId || projectStore.activeProjectId || "default";
    const newEvent: TimelineEventItem = {
      ...eventData,
      id: `ev-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      createdAt: eventData.createdAt || new Date().toISOString(),
    };
    this.timelineEvents.push(newEvent);
    this.getEventEditTree(newEvent.id);
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .createTimelineEvent(targetProject, {
          narrativeSequenceNumber: newEvent.narrativeSequenceNumber,
          chronologicalOrder: newEvent.chronologicalOrder,
          title: newEvent.title,
          description: newEvent.description,
          anchorSceneId: newEvent.anchorSceneId,
          effects: newEvent.effects.map((eff) => ({
            targetEntity: eff.targetEntityId,
            propertyKey: eff.propertyKey,
            operation: eff.operation,
            value: eff.value,
          })),
        })
        .then((res) => {
          if (res && res.data && res.data.id && res.data.id !== newEvent.id) {
            const oldId = newEvent.id;
            const newId = res.data.id;
            const idx = this.timelineEvents.findIndex((e) => e.id === oldId);
            if (idx !== -1) {
              this.timelineEvents[idx] = {
                ...this.timelineEvents[idx],
                id: newId,
              };
            }
            if (this.eventEditTrees[oldId]) {
              this.eventEditTrees[newId] = this.eventEditTrees[oldId];
              delete this.eventEditTrees[oldId];
            }
            this.saveToStorage();
          }
        })
        .catch(() => {});
    }

    return newEvent;
  }

  updateTimelineEvent(
    id: string,
    updates: Partial<Omit<TimelineEventItem, "id">>,
  ): TimelineEventItem | undefined {
    const idx = this.timelineEvents.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

    this.timelineEvents[idx] = {
      ...this.timelineEvents[idx],
      ...updates,
    };
    this.addEventEdit(
      id,
      this.timelineEvents[idx],
      "Updated timeline event properties",
      "BASELINE_EDIT",
    );
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .updateTimelineEvent(targetProject, id, {
          narrativeSequenceNumber:
            this.timelineEvents[idx].narrativeSequenceNumber,
          chronologicalOrder: this.timelineEvents[idx].chronologicalOrder,
          title: this.timelineEvents[idx].title,
          description: this.timelineEvents[idx].description,
          anchorSceneId: this.timelineEvents[idx].anchorSceneId,
          effects: this.timelineEvents[idx].effects.map((eff) => ({
            targetEntity: eff.targetEntityId,
            propertyKey: eff.propertyKey,
            operation: eff.operation,
            value: eff.value,
          })),
        })
        .catch(() => {});
    }

    return this.timelineEvents[idx];
  }

  deleteTimelineEvent(id: string): boolean {
    const idx = this.timelineEvents.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

    this.timelineEvents.splice(idx, 1);
    delete this.eventEditTrees[id];
    this.recomputeAllEntityFormulas();
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient.deleteTimelineEvent(targetProject, id).catch(() => {});
    }

    return true;
  }

  // =====================================
  // Event & Entity Hanging Edit Trees
  // =====================================

  getEventEditTree(eventId: string): EditTree<TimelineEventItem> {
    if (!this.eventEditTrees[eventId]) {
      const ev = this.getTimelineEvent(eventId);
      const rootId = `ed-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`;
      const rootSnapshot: TimelineEventItem = ev
        ? JSON.parse(JSON.stringify(ev))
        : {
            id: eventId,
            narrativeSequenceNumber: 0,
            chronologicalOrder: 0,
            title: "Root Event Draft",
            description: "",
            effects: [],
          };

      const rootNode: EditNode<TimelineEventItem> = {
        id: rootId,
        parentId: null,
        childrenIds: [],
        revisionNumber: 0,
        label: "Root Draft (ED0)",
        authorNote: "Initial event creation",
        type: "BASELINE_EDIT",
        createdAt: new Date().toISOString(),
        snapshot: rootSnapshot,
      };

      this.eventEditTrees[eventId] = {
        rootId,
        activeEditId: rootId,
        nodes: {
          [rootId]: rootNode,
        },
      };
      this.saveToStorage();
    }
    return this.eventEditTrees[eventId];
  }

  addEventEdit(
    eventId: string,
    snapshot: TimelineEventItem,
    authorNote?: string,
    type: RevisionType = "BASELINE_EDIT",
    targetParentId?: string,
  ): EditNode<TimelineEventItem> {
    const tree = this.getEventEditTree(eventId);
    const parentId = targetParentId || tree.activeEditId;
    const parentNode = tree.nodes[parentId];

    const newId = `ed-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`;
    const totalCount = Object.keys(tree.nodes).length;

    const newNode: EditNode<TimelineEventItem> = {
      id: newId,
      parentId: parentNode ? parentId : null,
      childrenIds: [],
      revisionNumber: totalCount,
      label: `Edit #${totalCount} (ED${totalCount})`,
      authorNote: authorNote?.trim() || undefined,
      type,
      createdAt: new Date().toISOString(),
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    };

    if (parentNode) {
      parentNode.childrenIds.push(newId);
    }
    tree.nodes[newId] = newNode;
    tree.activeEditId = newId;

    // Sync active event in timelineEvents array
    const evIdx = this.timelineEvents.findIndex((e) => e.id === eventId);
    if (evIdx !== -1) {
      this.timelineEvents[evIdx] = JSON.parse(JSON.stringify(snapshot));
      this.recomputeAllEntityFormulas();
    }

    this.saveToStorage();
    return newNode;
  }

  checkoutEventEdit(
    eventId: string,
    targetEditId: string,
  ): EditNode<TimelineEventItem> | undefined {
    const tree = this.getEventEditTree(eventId);
    const targetNode = tree.nodes[targetEditId];
    if (!targetNode) return undefined;

    // Switch EDIT head non-destructively
    tree.activeEditId = targetEditId;

    // Sync restored event snapshot into active list
    const evIdx = this.timelineEvents.findIndex((e) => e.id === eventId);
    if (evIdx !== -1) {
      this.timelineEvents[evIdx] = JSON.parse(
        JSON.stringify(targetNode.snapshot),
      );
      this.recomputeAllEntityFormulas();
    }

    this.saveToStorage();
    return targetNode;
  }

  getEntityEditTree(entityId: string): EditTree<EntityItem> {
    if (!this.entityEditTrees[entityId]) {
      const ent = this.getEntity(entityId);
      const rootId = `ed-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`;
      const rootSnapshot: EntityItem = ent
        ? JSON.parse(JSON.stringify(ent))
        : {
            id: entityId,
            name: "Entity",
            blueprintId: "",
            blueprintName: "",
            category: "",
            description: "",
            properties: {},
            lastMutatedSeqNumber: 0,
          };

      const rootNode: EditNode<EntityItem> = {
        id: rootId,
        parentId: null,
        childrenIds: [],
        revisionNumber: 0,
        label: "Root Entity Snapshot (ED0)",
        authorNote: "Initial entity creation",
        type: "BASELINE_EDIT",
        createdAt: new Date().toISOString(),
        snapshot: rootSnapshot,
      };

      this.entityEditTrees[entityId] = {
        rootId,
        activeEditId: rootId,
        nodes: {
          [rootId]: rootNode,
        },
      };
      this.saveToStorage();
    }
    return this.entityEditTrees[entityId];
  }

  addEntityEdit(
    entityId: string,
    snapshot: EntityItem,
    authorNote?: string,
    type: RevisionType = "BASELINE_EDIT",
    targetParentId?: string,
  ): EditNode<EntityItem> {
    const tree = this.getEntityEditTree(entityId);
    const parentId = targetParentId || tree.activeEditId;
    const parentNode = tree.nodes[parentId];

    const newId = `ed-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`;
    const totalCount = Object.keys(tree.nodes).length;

    const newNode: EditNode<EntityItem> = {
      id: newId,
      parentId: parentNode ? parentId : null,
      childrenIds: [],
      revisionNumber: totalCount,
      label: `Edit #${totalCount} (ED${totalCount})`,
      authorNote: authorNote?.trim() || undefined,
      type,
      createdAt: new Date().toISOString(),
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    };

    if (parentNode) {
      parentNode.childrenIds.push(newId);
    }
    tree.nodes[newId] = newNode;
    tree.activeEditId = newId;

    this.saveToStorage();
    return newNode;
  }

  checkoutEntityEdit(
    entityId: string,
    targetEditId: string,
  ): EditNode<EntityItem> | undefined {
    const tree = this.getEntityEditTree(entityId);
    const targetNode = tree.nodes[targetEditId];
    if (!targetNode) return undefined;

    tree.activeEditId = targetEditId;

    const entIdx = this.entities.findIndex((e) => e.id === entityId);
    if (entIdx !== -1) {
      this.entities[entIdx] = JSON.parse(JSON.stringify(targetNode.snapshot));
      this.recomputeAllEntityFormulas();
    }

    this.saveToStorage();
    return targetNode;
  }

  foldStateAtSequence(
    targetSeq: number,
    mode: "narrative" | "chronological" = "narrative",
  ): EntityItem[] {
    const baseEntities: EntityItem[] = JSON.parse(
      JSON.stringify(this.entities),
    );
    const activeEvents = [...this.timelineEvents]
      .map((ev) => {
        const tree = this.eventEditTrees[ev.id];
        if (tree && tree.nodes[tree.activeEditId]) {
          return tree.nodes[tree.activeEditId].snapshot;
        }
        return ev;
      })
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
              curr[finalKey] = curr[finalKey].filter(
                (x: any) => x !== eff.value,
              );
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
    const targetProject =
      this.currentProjectId || projectStore.activeProjectId || "default";
    const newRule: InvariantRuleItem = {
      ...ruleData,
      id: `rule-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
    };
    this.rules.push(newRule);
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .createRule(targetProject, {
          name: newRule.name,
          severity: newRule.severity,
          type: newRule.type,
          targetBlueprintId: newRule.targetBlueprintId,
          targetBlueprintName: newRule.targetBlueprintName,
          targetCategory: newRule.targetCategory,
          predicateExpression: newRule.predicateExpression,
          predicateSummary: newRule.predicateSummary,
          description: newRule.description,
          enabled: newRule.enabled,
          suggestedResolution: newRule.suggestedResolution,
        })
        .then((res) => {
          if (res && res.data && res.data.id && res.data.id !== newRule.id) {
            const idx = this.rules.findIndex((r) => r.id === newRule.id);
            if (idx !== -1) {
              this.rules[idx] = { ...this.rules[idx], id: res.data.id };
              this.saveToStorage();
            }
          }
        })
        .catch(() => {});
    }

    return newRule;
  }

  updateRule(
    id: string,
    updates: Partial<Omit<InvariantRuleItem, "id">>,
  ): InvariantRuleItem | undefined {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

    this.rules[idx] = {
      ...this.rules[idx],
      ...updates,
    };
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient
        .updateRule(targetProject, id, {
          name: updates.name,
          severity: updates.severity,
          type: updates.type,
          targetBlueprintId: updates.targetBlueprintId,
          targetBlueprintName: updates.targetBlueprintName,
          targetCategory: updates.targetCategory,
          predicateExpression: updates.predicateExpression,
          predicateSummary: updates.predicateSummary,
          description: updates.description,
          enabled: updates.enabled,
          suggestedResolution: updates.suggestedResolution,
        })
        .catch(() => {});
    }

    return this.rules[idx];
  }

  toggleRule(id: string): boolean {
    const r = this.getRule(id);
    if (!r) return false;
    r.enabled = !r.enabled;
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient
        .updateRule(targetProject, id, { enabled: r.enabled })
        .catch(() => {});
    }

    return true;
  }

  deleteRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    const targetProject = this.currentProjectId || projectStore.activeProjectId;

    this.rules.splice(idx, 1);
    this.saveToStorage();

    if (targetProject && targetProject !== "default") {
      apiClient.deleteRule(targetProject, id).catch(() => {});
    }

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
    this.saveToStorage();

    const targetProject = this.currentProjectId || projectStore.activeProjectId;
    if (targetProject && targetProject !== "default") {
      apiClient
        .overrideViolation(targetProject, id, justification.trim(), authorName)
        .catch(() => {});
    }

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
      this.saveToStorage();
      return true;
    }

    if (actionType === "AUTO_LINK_RELATIONAL_WEAPON") {
      const weaponEnt = this.entities.find(
        (e: EntityItem) => e.category === "Relics & Armaments",
      );
      const charEnt = this.entities.find(
        (e: EntityItem) => e.category === "Characters",
      );
      if (weaponEnt && charEnt) {
        charEnt.properties.bound_weapon = weaponEnt.id;
        weaponEnt.properties.current_wielder = charEnt.id;
      }
      this.violations.splice(idx, 1);
      this.saveToStorage();
      return true;
    }

    // Default dismiss
    this.violations.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  dismissViolation(id: string): boolean {
    const idx = this.violations.findIndex(
      (v: ContinuityViolationItem) => v.id === id,
    );
    if (idx === -1) return false;
    this.violations.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  recomputeAllEntityFormulas(): void {
    for (const entity of this.entities) {
      entity.computedFormulas = this.evaluateEntityFormulas(entity);
    }
  }
}

export const worldStore = new WorldStateStore();
