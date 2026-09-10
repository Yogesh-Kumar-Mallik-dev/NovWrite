/**
 * @file mobileStore.ts
 * @description Mobile client reactive state engine matching web stores (projectStore, proseStore, worldStore) with real application state and formula evaluation.
 * Block Standard: BLOCK_MOBILE_STORE_002
 */

import { evaluateFormula } from "./formulaEngine.ts";
import type {
  ProjectItem,
  ChapterItem,
  SceneItem,
  SceneStatus,
  BlueprintDef,
  DynamicFieldDef,
  EntityItem,
  TimelineEventItem,
  TimelineEffectItem,
  InvariantRuleItem,
  ContinuityViolationItem,
  RuleSeverity,
  RuleType,
} from "./types.ts";

export interface MobileAppState {
  projects: ProjectItem[];
  activeProjectId: string | null;
  chapters: ChapterItem[];
  scenes: SceneItem[];
  activeSceneId: string | null;
  activeChapterId: string | null;
  blueprints: BlueprintDef[];
  entities: EntityItem[];
  timelineEvents: TimelineEventItem[];
  rules: InvariantRuleItem[];
  violations: ContinuityViolationItem[];
  dailyWordGoal: number;
  todayWordsWritten: number;
}

type Listener = () => void;

function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export class MobileStore {
  private state: MobileAppState = {
    projects: [],
    activeProjectId: null,
    chapters: [],
    scenes: [],
    activeSceneId: null,
    activeChapterId: null,
    blueprints: [],
    entities: [],
    timelineEvents: [],
    rules: [],
    violations: [],
    dailyWordGoal: 1000,
    todayWordsWritten: 0,
  };

  private listeners: Set<Listener> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  getState(): MobileAppState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((l) => l());
  }

  private loadFromStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      const rawProjects = localStorage.getItem("novwrite_projects_v1");
      if (rawProjects) {
        const parsed = JSON.parse(rawProjects);
        if (Array.isArray(parsed)) {
          this.state.projects = parsed;
        }
      }

      const activeId = localStorage.getItem("novwrite_active_project_id_v1");
      if (activeId && this.state.projects.some((p) => p.id === activeId)) {
        this.state.activeProjectId = activeId;
      } else if (this.state.projects.length > 0) {
        this.state.activeProjectId = this.state.projects[0].id;
      } else {
        this.state.activeProjectId = null;
      }

      if (this.state.activeProjectId) {
        this.loadProjectScopedData(this.state.activeProjectId);
      }
    } catch (e) {
      console.warn("[MobileStore] Failed to load from storage:", e);
    }
  }

  private loadProjectScopedData(projectId: string) {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      // Prose data
      const rawProse = localStorage.getItem(`novwrite_prose_v1_${projectId}`);
      if (rawProse) {
        const parsed = JSON.parse(rawProse);
        this.state.chapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];
        this.state.scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
        this.state.dailyWordGoal = typeof parsed.dailyWordGoal === "number" ? parsed.dailyWordGoal : 1000;
        this.state.todayWordsWritten = typeof parsed.todayWordsWritten === "number" ? parsed.todayWordsWritten : 0;
        this.state.activeSceneId = parsed.activeSceneId || (this.state.scenes[0]?.id ?? null);
      } else {
        this.state.chapters = [];
        this.state.scenes = [];
        this.state.activeSceneId = null;
        this.state.activeChapterId = null;
      }

      // World data
      const rawWorld = localStorage.getItem(`novwrite_world_state_${projectId}`);
      if (rawWorld) {
        const parsed = JSON.parse(rawWorld);
        this.state.blueprints = Array.isArray(parsed.blueprints) ? parsed.blueprints : [];
        this.state.entities = Array.isArray(parsed.entities) ? parsed.entities : [];
        this.state.timelineEvents = Array.isArray(parsed.timelineEvents) ? parsed.timelineEvents : [];
        this.state.rules = Array.isArray(parsed.rules) ? parsed.rules : [];
        this.state.violations = Array.isArray(parsed.violations) ? parsed.violations : [];
      } else {
        this.state.blueprints = [];
        this.state.entities = [];
        this.state.timelineEvents = [];
        this.state.rules = [];
        this.state.violations = [];
      }

      this.recomputeAllEntityFormulas();
    } catch (e) {
      console.warn("[MobileStore] Failed to load project scoped data:", e);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem("novwrite_projects_v1", JSON.stringify(this.state.projects));
      if (this.state.activeProjectId) {
        localStorage.setItem("novwrite_active_project_id_v1", this.state.activeProjectId);

        const prosePayload = {
          chapters: this.state.chapters,
          scenes: this.state.scenes,
          activeSceneId: this.state.activeSceneId,
          dailyWordGoal: this.state.dailyWordGoal,
          todayWordsWritten: this.state.todayWordsWritten,
        };
        localStorage.setItem(`novwrite_prose_v1_${this.state.activeProjectId}`, JSON.stringify(prosePayload));

        const worldPayload = {
          blueprints: this.state.blueprints,
          entities: this.state.entities,
          timelineEvents: this.state.timelineEvents,
          rules: this.state.rules,
          violations: this.state.violations,
        };
        localStorage.setItem(`novwrite_world_state_${this.state.activeProjectId}`, JSON.stringify(worldPayload));
      } else {
        localStorage.removeItem("novwrite_active_project_id_v1");
      }
    } catch (e) {
      console.warn("[MobileStore] Failed to save state to localStorage:", e);
    }
  }

  // ==========================================
  // Project Management Operations
  // ==========================================
  getActiveProject(): ProjectItem | null {
    if (!this.state.activeProjectId) return null;
    return this.state.projects.find((p) => p.id === this.state.activeProjectId) || null;
  }

  getProjects(): ProjectItem[] {
    return this.state.projects;
  }

  createProject(params: { name: string; description?: string; genre?: string }): ProjectItem {
    const name = params.name.trim();
    if (!name) {
      throw new Error("Project name is required.");
    }

    const newProj: ProjectItem = {
      id: `proj-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      name,
      description: params.description?.trim() || "",
      genre: params.genre?.trim() || "General Fiction",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.projects = [newProj, ...this.state.projects];
    this.setActiveProject(newProj.id);
    return newProj;
  }

  setActiveProject(id: string | null) {
    this.state.activeProjectId = id;
    if (id) {
      this.loadProjectScopedData(id);
    } else {
      this.state.chapters = [];
      this.state.scenes = [];
      this.state.activeSceneId = null;
      this.state.blueprints = [];
      this.state.entities = [];
      this.state.timelineEvents = [];
      this.state.rules = [];
      this.state.violations = [];
    }
    this.notify();
  }

  updateProject(id: string, updates: Partial<Pick<ProjectItem, "name" | "description" | "genre">>) {
    this.state.projects = this.state.projects.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
          ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
          ...(updates.genre !== undefined ? { genre: updates.genre.trim() } : {}),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.notify();
  }

  deleteProject(id: string) {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(`novwrite_prose_v1_${id}`);
        localStorage.removeItem(`novwrite_world_state_${id}`);
      } catch (e) {
        console.warn("[MobileStore] Failed to remove scoped project data:", e);
      }
    }
    this.state.projects = this.state.projects.filter((p) => p.id !== id);
    if (this.state.activeProjectId === id) {
      this.setActiveProject(this.state.projects[0]?.id || null);
    } else {
      this.notify();
    }
  }

  // ==========================================
  // Prose Studio Operations
  // ==========================================
  getChapters(): ChapterItem[] {
    return [...this.state.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getScenesForChapter(chapterId: string): SceneItem[] {
    return this.state.scenes
      .filter((s) => s.chapterId === chapterId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getActiveScene(): SceneItem | null {
    if (!this.state.activeSceneId) return null;
    return this.state.scenes.find((s) => s.id === this.state.activeSceneId) || null;
  }

  getActiveChapter(): ChapterItem | null {
    if (!this.state.activeChapterId) {
      if (this.state.activeSceneId) {
        const sc = this.getActiveScene();
        return this.state.chapters.find((c) => c.id === sc?.chapterId) || null;
      }
      return null;
    }
    return this.state.chapters.find((c) => c.id === this.state.activeChapterId) || null;
  }

  createChapter(title: string, synopsis?: string): ChapterItem {
    const projectId = this.state.activeProjectId || "default";
    const newChap: ChapterItem = {
      id: `chap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId,
      title: title.trim() || `Chapter ${this.state.chapters.length + 1}`,
      orderIndex: this.state.chapters.length,
      synopsis: synopsis?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.chapters = [...this.state.chapters, newChap];
    this.state.activeChapterId = newChap.id;
    this.notify();
    return newChap;
  }

  updateChapter(id: string, updates: Partial<ChapterItem>) {
    this.state.chapters = this.state.chapters.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    this.notify();
  }

  deleteChapter(id: string) {
    this.state.chapters = this.state.chapters.filter((c) => c.id !== id);
    this.state.scenes = this.state.scenes.filter((s) => s.chapterId !== id);
    if (this.state.activeChapterId === id) {
      this.state.activeChapterId = this.state.chapters[0]?.id || null;
    }
    if (this.getActiveScene()?.chapterId === id) {
      this.state.activeSceneId = this.state.scenes[0]?.id || null;
    }
    this.notify();
  }

  createScene(chapterId: string, title: string, targetWordCount?: number, synopsis?: string): SceneItem {
    const projectId = this.state.activeProjectId || "default";
    const existing = this.getScenesForChapter(chapterId);
    const newScene: SceneItem = {
      id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      chapterId,
      projectId,
      title: title.trim() || `Scene ${existing.length + 1}`,
      orderIndex: existing.length,
      proseContent: "",
      wordCount: 0,
      status: "DRAFT",
      targetWordCount: targetWordCount || 1500,
      synopsis: synopsis?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.scenes = [...this.state.scenes, newScene];
    this.state.activeSceneId = newScene.id;
    this.notify();
    return newScene;
  }

  updateScene(id: string, updates: Partial<SceneItem>) {
    this.state.scenes = this.state.scenes.map((s) => {
      if (s.id === id) {
        const nextContent = updates.proseContent !== undefined ? updates.proseContent : s.proseContent;
        const nextWordCount = updates.proseContent !== undefined ? countWords(nextContent) : s.wordCount;
        return {
          ...s,
          ...updates,
          wordCount: nextWordCount,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    this.notify();
  }

  updateSceneContent(id: string, content: string) {
    const words = countWords(content);
    this.state.scenes = this.state.scenes.map((s) => {
      if (s.id === id) {
        const diff = Math.max(0, words - s.wordCount);
        this.state.todayWordsWritten += diff;
        return {
          ...s,
          proseContent: content,
          wordCount: words,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    this.notify();
  }

  deleteScene(id: string) {
    this.state.scenes = this.state.scenes.filter((s) => s.id !== id);
    if (this.state.activeSceneId === id) {
      this.state.activeSceneId = this.state.scenes[0]?.id || null;
    }
    this.notify();
  }

  selectScene(sceneId: string | null) {
    this.state.activeSceneId = sceneId;
    if (sceneId) {
      const sc = this.state.scenes.find((s) => s.id === sceneId);
      if (sc) {
        this.state.activeChapterId = sc.chapterId;
      }
    }
    this.notify();
  }

  selectChapter(chapterId: string | null) {
    this.state.activeChapterId = chapterId;
    const chapterScenes = chapterId ? this.getScenesForChapter(chapterId) : [];
    if (chapterScenes.length > 0 && (!this.state.activeSceneId || !chapterScenes.some((s) => s.id === this.state.activeSceneId))) {
      this.state.activeSceneId = chapterScenes[0].id;
    }
    this.notify();
  }

  setDailyGoal(goal: number) {
    this.state.dailyWordGoal = Math.max(100, goal);
    this.notify();
  }

  // ==========================================
  // World Studio: Blueprints
  // ==========================================
  getBlueprints(): BlueprintDef[] {
    return this.state.blueprints;
  }

  getFirstClassBlueprints(): BlueprintDef[] {
    return this.state.blueprints.filter((b) => b.blueprintClass === "FIRST_CLASS");
  }

  getSecondClassBlueprints(): BlueprintDef[] {
    return this.state.blueprints.filter((b) => b.blueprintClass === "SECOND_CLASS");
  }

  getBlueprint(id: string): BlueprintDef | undefined {
    return this.state.blueprints.find((b) => b.id === id);
  }

  createBlueprint(params: {
    name: string;
    blueprintClass: "FIRST_CLASS" | "SECOND_CLASS";
    category: string;
    description?: string;
    fields?: DynamicFieldDef[];
  }): BlueprintDef {
    const newBp: BlueprintDef = {
      id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: params.name.trim(),
      blueprintClass: params.blueprintClass,
      category: params.category.trim() || "Characters",
      description: params.description?.trim() || "",
      fields: params.fields || [
        { id: `f-${Date.now()}`, name: "name", label: "Entity Name", fieldType: "STRING", required: true },
      ],
    };
    this.state.blueprints = [...this.state.blueprints, newBp];
    this.notify();
    return newBp;
  }

  updateBlueprint(id: string, updates: Partial<BlueprintDef>) {
    this.state.blueprints = this.state.blueprints.map((b) => (b.id === id ? { ...b, ...updates } : b));
    this.recomputeAllEntityFormulas();
    this.notify();
  }

  deleteBlueprint(id: string) {
    this.state.blueprints = this.state.blueprints.filter((b) => b.id !== id);
    this.state.entities = this.state.entities.filter((e) => e.blueprintId !== id);
    this.notify();
  }

  // ==========================================
  // World Studio: Entities
  // ==========================================
  getEntities(): EntityItem[] {
    return this.state.entities;
  }

  getEntity(id: string): EntityItem | undefined {
    return this.state.entities.find((e) => e.id === id);
  }

  createEntity(params: {
    name: string;
    blueprintId: string;
    category?: string;
    description?: string;
    properties?: Record<string, any>;
  }): EntityItem {
    const bp = this.getBlueprint(params.blueprintId);
    const newEnt: EntityItem = {
      id: `ent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: params.name.trim(),
      blueprintId: params.blueprintId,
      blueprintName: bp?.name || "Archetype",
      category: params.category?.trim() || bp?.category || "General",
      description: params.description?.trim() || "",
      properties: params.properties || {},
      lastMutatedSeqNumber: 1,
    };

    const computed = this.computeEntityFormulas(newEnt);
    newEnt.computedFormulas = computed;

    this.state.entities = [newEnt, ...this.state.entities];
    this.notify();
    return newEnt;
  }

  updateEntity(id: string, updates: Partial<EntityItem>) {
    this.state.entities = this.state.entities.map((e) => {
      if (e.id === id) {
        const updated = { ...e, ...updates };
        updated.computedFormulas = this.computeEntityFormulas(updated);
        return updated;
      }
      return e;
    });
    this.notify();
  }

  deleteEntity(id: string) {
    this.state.entities = this.state.entities.filter((e) => e.id !== id);
    this.notify();
  }

  private computeEntityFormulas(entity: EntityItem): Record<string, number> {
    const bp = this.getBlueprint(entity.blueprintId);
    if (!bp) return {};

    const computed: Record<string, number> = {};
    const context: Record<string, any> = { ...entity.properties };

    // Inject enum power ratings and structured objects into formula context
    for (const field of bp.fields) {
      if (
        (field.fieldType === "ENUM" || field.fieldType === "VALUE_TYPE") &&
        field.options
      ) {
        const val = entity.properties[field.key || field.name] ?? entity.properties[field.name];
        if (val !== undefined && val !== null) {
          const matched = field.options.find((o: any) =>
            typeof o === "string"
              ? o === val
              : o && (o.value === val || o.label === val)
          );
          let numVal = 0;
          if (matched && typeof matched === "object") {
            numVal = (matched as any).numericValue ?? (matched as any).power ?? 0;
          } else if (field.optionPowers && typeof field.optionPowers[val] === "number") {
            numVal = field.optionPowers[val];
          }

          const optObj = {
            label: matched && typeof matched === "object" ? (matched as any).label : val,
            value: matched && typeof matched === "object" ? (matched as any).value : val,
            name: matched && typeof matched === "object" ? ((matched as any).name || (matched as any).label) : val,
            numericValue: numVal,
            power: numVal,
          };

          context[field.name] = optObj;
          if (field.key) context[field.key] = optObj;
          context[`${field.name}_power`] = numVal;
          if (field.key) context[`${field.key}_power`] = numVal;
        }
      } else if (field.fieldType === "ARRAY" || field.fieldType === "ARRAY_REF") {
        const arr = entity.properties[field.key || field.name] ?? entity.properties[field.name];
        if (Array.isArray(arr)) {
          context[field.name] = arr;
          if (field.key) context[field.key] = arr;
          context[`${field.name}_count`] = arr.length;
          if (field.key) context[`${field.key}_count`] = arr.length;
        }
      }
    }

    const formulaFields = bp.fields.filter((f) => f.fieldType === "FORMULA" && f.formulaExpression);

    for (const f of formulaFields) {
      if (!f.formulaExpression) continue;
      const res = evaluateFormula(f.formulaExpression, context);
      if (res.success && typeof res.value === "number") {
        computed[f.name] = res.value;
        if (f.key) {
          computed[f.key] = res.value;
        }
        context[f.name] = res.value;
        if (f.key) {
          context[f.key] = res.value;
        }
      }
    }
    return computed;
  }

  evaluateEntityFormulas(entityId: string): Record<string, number> {
    const ent = this.getEntity(entityId);
    if (!ent) return {};
    return this.computeEntityFormulas(ent);
  }

  recomputeAllEntityFormulas() {
    this.state.entities = this.state.entities.map((e) => ({
      ...e,
      computedFormulas: this.computeEntityFormulas(e),
    }));
  }

  // ==========================================
  // World Studio: Timeline Events
  // ==========================================
  getTimelineEvents(): TimelineEventItem[] {
    return [...this.state.timelineEvents].sort((a, b) => a.narrativeSequenceNumber - b.narrativeSequenceNumber);
  }

  addTimelineEvent(params: {
    title: string;
    description: string;
    narrativeSequenceNumber: number;
    chronologicalOrder: number;
    anchorChapterTitle?: string;
    anchorSceneTitle?: string;
    effects?: TimelineEffectItem[];
  }): TimelineEventItem {
    const newEv: TimelineEventItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: params.title.trim(),
      description: params.description.trim(),
      narrativeSequenceNumber: params.narrativeSequenceNumber,
      chronologicalOrder: params.chronologicalOrder,
      anchorChapterTitle: params.anchorChapterTitle?.trim(),
      anchorSceneTitle: params.anchorSceneTitle?.trim(),
      effects: params.effects || [],
      createdAt: new Date().toISOString(),
    };
    this.state.timelineEvents = [...this.state.timelineEvents, newEv];
    this.notify();
    return newEv;
  }

  updateTimelineEvent(id: string, updates: Partial<TimelineEventItem>) {
    this.state.timelineEvents = this.state.timelineEvents.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev));
    this.notify();
  }

  deleteTimelineEvent(id: string) {
    this.state.timelineEvents = this.state.timelineEvents.filter((ev) => ev.id !== id);
    this.notify();
  }

  getFoldedEntitiesAtSequence(targetSeq: number, mode: "narrative" | "chronological" = "narrative"): EntityItem[] {
    return this.foldStateAtSequence(targetSeq, mode);
  }

  foldStateAtSequence(targetSeq: number, mode: "narrative" | "chronological" = "narrative"): EntityItem[] {
    const eventsToApply = [...this.state.timelineEvents]
      .filter((ev) => (mode === "narrative" ? ev.narrativeSequenceNumber <= targetSeq : ev.chronologicalOrder <= targetSeq))
      .sort((a, b) => (mode === "narrative" ? a.narrativeSequenceNumber - b.narrativeSequenceNumber : a.chronologicalOrder - b.chronologicalOrder));

    const clonedEntities: Record<string, EntityItem> = {};
    for (const ent of this.state.entities) {
      clonedEntities[ent.id] = JSON.parse(JSON.stringify(ent));
    }

    for (const ev of eventsToApply) {
      for (const eff of ev.effects) {
        const ent = clonedEntities[eff.targetEntityId];
        if (!ent) continue;
        ent.lastMutatedSeqNumber = mode === "narrative" ? ev.narrativeSequenceNumber : ev.chronologicalOrder;

        const keys = eff.propertyKey.split(".");
        if (keys.length === 1) {
          const k = keys[0];
          if (eff.operation === "SET") ent.properties[k] = eff.value;
          else if (eff.operation === "INCREMENT" && typeof ent.properties[k] === "number") ent.properties[k] += Number(eff.value);
          else if (eff.operation === "DECREMENT" && typeof ent.properties[k] === "number") ent.properties[k] -= Number(eff.value);
          else if (eff.operation === "APPEND" && Array.isArray(ent.properties[k])) ent.properties[k].push(eff.value);
          else if (eff.operation === "REMOVE" && Array.isArray(ent.properties[k])) ent.properties[k] = ent.properties[k].filter((x: any) => x !== eff.value);
        } else if (keys.length === 2) {
          const [p1, p2] = keys;
          if (!ent.properties[p1] || typeof ent.properties[p1] !== "object") ent.properties[p1] = {};
          if (eff.operation === "SET") ent.properties[p1][p2] = eff.value;
          else if (eff.operation === "INCREMENT" && typeof ent.properties[p1][p2] === "number") ent.properties[p1][p2] += Number(eff.value);
          else if (eff.operation === "DECREMENT" && typeof ent.properties[p1][p2] === "number") ent.properties[p1][p2] -= Number(eff.value);
        }
      }
    }

    return Object.values(clonedEntities);
  }

  // ==========================================
  // World Studio: Invariant Rules
  // ==========================================
  getRules(): InvariantRuleItem[] {
    return this.state.rules;
  }

  getRule(id: string): InvariantRuleItem | undefined {
    return this.state.rules.find((r) => r.id === id);
  }

  addRule(params: {
    name: string;
    severity: RuleSeverity;
    type: RuleType;
    targetBlueprintId?: string;
    targetBlueprintName?: string;
    targetCategory?: string;
    predicateExpression: string;
    predicateSummary?: string;
    description: string;
    enabled?: boolean;
    suggestedResolution?: string;
  }): InvariantRuleItem {
    const newRule: InvariantRuleItem = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: params.name.trim(),
      severity: params.severity,
      type: params.type,
      targetBlueprintId: params.targetBlueprintId,
      targetBlueprintName: params.targetBlueprintName,
      targetCategory: params.targetCategory,
      predicateExpression: params.predicateExpression.trim(),
      predicateSummary: (params.predicateSummary || params.predicateExpression).trim(),
      description: params.description.trim(),
      enabled: params.enabled !== undefined ? params.enabled : true,
      suggestedResolution: params.suggestedResolution?.trim(),
    };
    this.state.rules = [...this.state.rules, newRule];
    this.notify();
    return newRule;
  }

  updateRule(id: string, updates: Partial<InvariantRuleItem>) {
    this.state.rules = this.state.rules.map((r) => (r.id === id ? { ...r, ...updates } : r));
    this.notify();
  }

  deleteRule(id: string) {
    this.state.rules = this.state.rules.filter((r) => r.id !== id);
    this.notify();
  }

  toggleRule(id: string) {
    this.state.rules = this.state.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    this.notify();
  }

  // ==========================================
  // World Studio: Continuity Audit & RFC 7807
  // ==========================================
  getViolations(): ContinuityViolationItem[] {
    return this.state.violations;
  }

  runContinuityAudit() {
    this.notify();
  }

  overrideViolation(id: string, justification: string, authorName = "Lead Author") {
    this.state.violations = this.state.violations.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          overridden: true,
          overrideJustification: justification.trim(),
          overriddenBy: authorName.trim(),
          overriddenAt: new Date().toISOString(),
        };
      }
      return v;
    });
    this.notify();
  }

  reconcileViolation(id: string, actionType: string): boolean {
    this.dismissViolation(id);
    return true;
  }

  dismissViolation(id: string) {
    this.state.violations = this.state.violations.filter((v) => v.id !== id);
    this.notify();
  }

  // ==========================================
  // Telemetry Calculations & Compatibility Aliases
  // ==========================================
  getChaptersForActiveProject(): ChapterItem[] {
    return this.getChapters();
  }

  getSortedChapters(): ChapterItem[] {
    return this.getChapters();
  }

  getTotalChaptersCount(): number {
    return this.state.chapters.length;
  }

  getTotalScenesCount(): number {
    return this.state.scenes.length;
  }

  getInvariantRules(): InvariantRuleItem[] {
    return this.getRules();
  }

  getContinuityIssues(): ContinuityViolationItem[] {
    return this.getViolations();
  }

  createTimelineEvent(params: {
    title: string;
    description: string;
    narrativeSequenceNumber?: number;
    chronologicalOrder?: number;
    entityName?: string;
    entityId?: string;
    eventType?: string;
    timestamp?: string;
    anchorChapterTitle?: string;
    anchorSceneTitle?: string;
    effects?: TimelineEffectItem[];
  }): TimelineEventItem {
    return this.addTimelineEvent({
      title: params.title,
      description: params.description,
      narrativeSequenceNumber: params.narrativeSequenceNumber ?? (this.state.timelineEvents.length + 1) * 10,
      chronologicalOrder: params.chronologicalOrder ?? (this.state.timelineEvents.length + 1) * 10,
      anchorChapterTitle: params.anchorChapterTitle,
      anchorSceneTitle: params.anchorSceneTitle,
      effects: params.effects ?? [],
    });
  }

  getTotalWordCount(): number {
    return this.state.scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0);
  }

  getReadingTimeMin(): number {
    return Math.max(1, Math.ceil(this.getTotalWordCount() / 200));
  }

  getDailyGoalProgress(): number {
    if (this.state.dailyWordGoal <= 0) return 0;
    return Math.min(100, Math.round((this.state.todayWordsWritten / this.state.dailyWordGoal) * 100));
  }
}

export const mobileStore = new MobileStore();
