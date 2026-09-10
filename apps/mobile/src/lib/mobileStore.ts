/**
 * @file mobileStore.ts
 * @description Mobile client reactive state engine matching web stores (projectStore, proseStore, worldStore) with real application state, formula evaluation, and optimistic backend synchronization.
 * Block Standard: BLOCK_MOBILE_STORE_002
 */

import { mobileApiClient } from "./apiClient.ts";
import { computeEntityFormulas, foldTimelineState } from "./types.ts";
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

  isSyncing = false;
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
        this.state.chapters = Array.isArray(parsed.chapters)
          ? parsed.chapters
          : [];
        this.state.scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
        this.state.dailyWordGoal =
          typeof parsed.dailyWordGoal === "number"
            ? parsed.dailyWordGoal
            : 1000;
        this.state.todayWordsWritten =
          typeof parsed.todayWordsWritten === "number"
            ? parsed.todayWordsWritten
            : 0;
        this.state.activeSceneId =
          parsed.activeSceneId || (this.state.scenes[0]?.id ?? null);
      } else {
        this.state.chapters = [];
        this.state.scenes = [];
        this.state.activeSceneId = null;
        this.state.activeChapterId = null;
      }

      // World data
      const rawWorld = localStorage.getItem(
        `novwrite_world_state_${projectId}`,
      );
      if (rawWorld) {
        const parsed = JSON.parse(rawWorld);
        this.state.blueprints = Array.isArray(parsed.blueprints)
          ? parsed.blueprints
          : [];
        this.state.entities = Array.isArray(parsed.entities)
          ? parsed.entities
          : [];
        this.state.timelineEvents = Array.isArray(parsed.timelineEvents)
          ? parsed.timelineEvents
          : [];
        this.state.rules = Array.isArray(parsed.rules) ? parsed.rules : [];
        this.state.violations = Array.isArray(parsed.violations)
          ? parsed.violations
          : [];
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
      localStorage.setItem(
        "novwrite_projects_v1",
        JSON.stringify(this.state.projects),
      );
      if (this.state.activeProjectId) {
        localStorage.setItem(
          "novwrite_active_project_id_v1",
          this.state.activeProjectId,
        );

        const prosePayload = {
          chapters: this.state.chapters,
          scenes: this.state.scenes,
          activeSceneId: this.state.activeSceneId,
          dailyWordGoal: this.state.dailyWordGoal,
          todayWordsWritten: this.state.todayWordsWritten,
        };
        localStorage.setItem(
          `novwrite_prose_v1_${this.state.activeProjectId}`,
          JSON.stringify(prosePayload),
        );

        const worldPayload = {
          blueprints: this.state.blueprints,
          entities: this.state.entities,
          timelineEvents: this.state.timelineEvents,
          rules: this.state.rules,
          violations: this.state.violations,
        };
        localStorage.setItem(
          `novwrite_world_state_${this.state.activeProjectId}`,
          JSON.stringify(worldPayload),
        );
      } else {
        localStorage.removeItem("novwrite_active_project_id_v1");
      }
    } catch (e) {
      console.warn("[MobileStore] Failed to save state to localStorage:", e);
    }
  }

  /**
   * Reconciles mobile store state with the Go backend.
   */
  async syncWithBackend(projectId?: string): Promise<void> {
    const targetProject = projectId || this.state.activeProjectId;
    this.isSyncing = true;
    try {
      const projRes = await mobileApiClient.listProjects({ pageSize: 100 });
      if (projRes && projRes.data) {
        const backendProjects: ProjectItem[] = projRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          genre: p.genre || "General Fiction",
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
        const bIds = new Set(backendProjects.map((p) => p.id));
        const localOnly = this.state.projects.filter((p) => !bIds.has(p.id));
        this.state.projects = [...backendProjects, ...localOnly];
      }

      if (targetProject) {
        const [chapRes, sceneRes, bpRes, entRes, tlRes, ruleRes, auditRes] =
          await Promise.allSettled([
            mobileApiClient.listChapters(targetProject, { pageSize: 100 }),
            mobileApiClient.listScenes(targetProject, undefined, {
              pageSize: 100,
            }),
            mobileApiClient.listBlueprints(targetProject, { pageSize: 100 }),
            mobileApiClient.listEntities(targetProject, { pageSize: 100 }),
            mobileApiClient.listTimelineEvents(targetProject, {
              pageSize: 100,
            }),
            mobileApiClient.listRules(targetProject, { pageSize: 100 }),
            mobileApiClient.getAudit(targetProject, { pageSize: 100 }),
          ]);

        if (chapRes.status === "fulfilled" && chapRes.value?.data) {
          const backendChaps: ChapterItem[] = chapRes.value.data.map(
            (c: any) => ({
              id: c.id,
              projectId: c.projectId || targetProject,
              title: c.title,
              orderIndex: c.orderIndex ?? 0,
              synopsis: c.synopsis || "",
              createdAt: c.createdAt || new Date().toISOString(),
              updatedAt: c.updatedAt || new Date().toISOString(),
            }),
          );
          const cIds = new Set(backendChaps.map((c) => c.id));
          const localOnlyChaps = this.state.chapters.filter(
            (c) => !cIds.has(c.id),
          );
          this.state.chapters = [...backendChaps, ...localOnlyChaps].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
        }

        if (sceneRes.status === "fulfilled" && sceneRes.value?.data) {
          const backendScenes: SceneItem[] = sceneRes.value.data.map(
            (s: any) => ({
              id: s.id,
              chapterId: s.chapterId,
              projectId: s.projectId || targetProject,
              title: s.title,
              orderIndex: s.orderIndex ?? 0,
              proseContent: s.proseContent || "",
              wordCount: s.wordCount ?? countWords(s.proseContent || ""),
              status: s.status || "DRAFT",
              povCharacterId: s.povCharacterId,
              timelineSequenceNumber: s.timelineSequenceNumber,
              targetWordCount: s.targetWordCount || 1500,
              synopsis: s.synopsis || "",
              createdAt: s.createdAt || new Date().toISOString(),
              updatedAt: s.updatedAt || new Date().toISOString(),
            }),
          );
          const sIds = new Set(backendScenes.map((s) => s.id));
          const localOnlyScenes = this.state.scenes.filter(
            (s) => !sIds.has(s.id),
          );
          this.state.scenes = [...backendScenes, ...localOnlyScenes].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
        }

        if (bpRes.status === "fulfilled" && bpRes.value?.data) {
          const backendBps: BlueprintDef[] = bpRes.value.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            blueprintClass: b.blueprintClass || "FIRST_CLASS",
            category: b.category || "General",
            description: b.description || "",
            fields: b.fields || [],
            isSystemDefault: b.isSystemDefault,
          }));
          const bpIds = new Set(backendBps.map((b) => b.id));
          const localOnlyBps = this.state.blueprints.filter(
            (b) => !bpIds.has(b.id),
          );
          this.state.blueprints = [...backendBps, ...localOnlyBps];
        }

        if (entRes.status === "fulfilled" && entRes.value?.data) {
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
          const entIds = new Set(backendEnts.map((e) => e.id));
          const localOnlyEnts = this.state.entities.filter(
            (e) => !entIds.has(e.id),
          );
          this.state.entities = [...backendEnts, ...localOnlyEnts];
        }

        if (tlRes.status === "fulfilled" && tlRes.value?.data) {
          const backendTls: TimelineEventItem[] = tlRes.value.data.map(
            (ev: any) => ({
              id: ev.id,
              narrativeSequenceNumber: ev.narrativeSequenceNumber ?? 0,
              chronologicalOrder: ev.chronologicalOrder ?? 0,
              title: ev.title,
              description: ev.description || "",
              anchorChapterTitle: ev.anchorChapterTitle,
              anchorSceneTitle: ev.anchorSceneTitle,
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
          const tlIds = new Set(backendTls.map((t) => t.id));
          const localOnlyTls = this.state.timelineEvents.filter(
            (t) => !tlIds.has(t.id),
          );
          this.state.timelineEvents = [...backendTls, ...localOnlyTls];
        }

        if (ruleRes.status === "fulfilled" && ruleRes.value?.data) {
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
          const rIds = new Set(backendRules.map((r) => r.id));
          const localOnlyRules = this.state.rules.filter(
            (r) => !rIds.has(r.id),
          );
          this.state.rules = [...backendRules, ...localOnlyRules];
        }

        if (auditRes.status === "fulfilled" && auditRes.value?.data) {
          const backendAudit: ContinuityViolationItem[] =
            auditRes.value.data.map((v: any) => ({
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
            }));
          this.state.violations = backendAudit;
        }

        this.recomputeAllEntityFormulas();
      }

      this.notify();
    } catch {
      // Offline fallback
    } finally {
      this.isSyncing = false;
    }
  }

  // ==========================================
  // Project Management Operations
  // ==========================================
  getActiveProject(): ProjectItem | null {
    if (!this.state.activeProjectId) return null;
    return (
      this.state.projects.find((p) => p.id === this.state.activeProjectId) ||
      null
    );
  }

  getProjects(): ProjectItem[] {
    return this.state.projects;
  }

  createProject(params: {
    name: string;
    description?: string;
    genre?: string;
  }): ProjectItem {
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

    // Asynchronous Backend Write-Behind
    mobileApiClient
      .createProject({
        name: newProj.name,
        description: newProj.description,
        genre: newProj.genre,
      })
      .then((res) => {
        if (res?.data?.id && res.data.id !== newProj.id) {
          const oldId = newProj.id;
          const newId = res.data.id;
          this.state.projects = this.state.projects.map((p) =>
            p.id === oldId ? { ...p, id: newId } : p,
          );
          if (this.state.activeProjectId === oldId) {
            this.state.activeProjectId = newId;
          }
          this.notify();
        }
      })
      .catch(() => {});

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

  updateProject(
    id: string,
    updates: Partial<Pick<ProjectItem, "name" | "description" | "genre">>,
  ) {
    this.state.projects = this.state.projects.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
          ...(updates.description !== undefined
            ? { description: updates.description.trim() }
            : {}),
          ...(updates.genre !== undefined
            ? { genre: updates.genre.trim() }
            : {}),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.notify();

    mobileApiClient
      .updateProject(id, {
        name: updates.name,
        description: updates.description,
        genre: updates.genre,
      })
      .catch(() => {});
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

    mobileApiClient.deleteProject(id).catch(() => {});
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
    return (
      this.state.scenes.find((s) => s.id === this.state.activeSceneId) || null
    );
  }

  getActiveChapter(): ChapterItem | null {
    if (!this.state.activeChapterId) {
      if (this.state.activeSceneId) {
        const sc = this.getActiveScene();
        return this.state.chapters.find((c) => c.id === sc?.chapterId) || null;
      }
      return null;
    }
    return (
      this.state.chapters.find((c) => c.id === this.state.activeChapterId) ||
      null
    );
  }

  getChapter(id: string): ChapterItem | undefined {
    return this.state.chapters.find((c) => c.id === id);
  }

  getScene(id: string): SceneItem | undefined {
    return this.state.scenes.find((s) => s.id === id);
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

    if (projectId && projectId !== "default") {
      mobileApiClient
        .createChapter(projectId, {
          title: newChap.title,
          synopsis: newChap.synopsis,
          orderIndex: newChap.orderIndex,
        })
        .then((res) => {
          if (res?.data?.id && res.data.id !== newChap.id) {
            const oldId = newChap.id;
            const newId = res.data.id;
            this.state.chapters = this.state.chapters.map((c) =>
              c.id === oldId ? { ...c, id: newId } : c,
            );
            if (this.state.activeChapterId === oldId) {
              this.state.activeChapterId = newId;
            }
            this.state.scenes = this.state.scenes.map((s) =>
              s.chapterId === oldId ? { ...s, chapterId: newId } : s,
            );
            this.notify();
          }
        })
        .catch(() => {});
    }

    return newChap;
  }

  updateChapter(id: string, updates: Partial<ChapterItem>) {
    const projectId = this.state.activeProjectId;
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

    if (projectId && projectId !== "default") {
      mobileApiClient.updateChapter(projectId, id, updates).catch(() => {});
    }
  }

  deleteChapter(id: string) {
    const projectId = this.state.activeProjectId;
    this.state.chapters = this.state.chapters.filter((c) => c.id !== id);
    this.state.scenes = this.state.scenes.filter((s) => s.chapterId !== id);
    if (this.state.activeChapterId === id) {
      this.state.activeChapterId = this.state.chapters[0]?.id || null;
    }
    if (this.getActiveScene()?.chapterId === id) {
      this.state.activeSceneId = this.state.scenes[0]?.id || null;
    }
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient.deleteChapter(projectId, id).catch(() => {});
    }
  }

  createScene(
    chapterId: string,
    title: string,
    targetWordCount?: number,
    synopsis?: string,
  ): SceneItem {
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

    if (projectId && projectId !== "default") {
      mobileApiClient
        .createScene(projectId, {
          chapterId: newScene.chapterId,
          title: newScene.title,
          synopsis: newScene.synopsis,
          targetWordCount: newScene.targetWordCount,
          orderIndex: newScene.orderIndex,
        })
        .then((res) => {
          if (res?.data?.id && res.data.id !== newScene.id) {
            const oldId = newScene.id;
            const newId = res.data.id;
            this.state.scenes = this.state.scenes.map((s) =>
              s.id === oldId ? { ...s, id: newId } : s,
            );
            if (this.state.activeSceneId === oldId) {
              this.state.activeSceneId = newId;
            }
            this.notify();
          }
        })
        .catch(() => {});
    }

    return newScene;
  }

  updateScene(id: string, updates: Partial<SceneItem>) {
    const projectId = this.state.activeProjectId;
    this.state.scenes = this.state.scenes.map((s) => {
      if (s.id === id) {
        const nextContent =
          updates.proseContent !== undefined
            ? updates.proseContent
            : s.proseContent;
        const nextWordCount =
          updates.proseContent !== undefined
            ? countWords(nextContent)
            : s.wordCount;
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

    if (projectId && projectId !== "default") {
      mobileApiClient
        .updateScene(projectId, id, {
          ...updates,
          wordCount:
            updates.proseContent !== undefined
              ? countWords(updates.proseContent)
              : undefined,
        })
        .catch(() => {});
    }
  }

  updateSceneContent(id: string, content: string) {
    const projectId = this.state.activeProjectId;
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

    if (projectId && projectId !== "default") {
      mobileApiClient
        .updateScene(projectId, id, {
          proseContent: content,
          wordCount: words,
        })
        .catch(() => {});
    }
  }

  deleteScene(id: string) {
    const projectId = this.state.activeProjectId;
    this.state.scenes = this.state.scenes.filter((s) => s.id !== id);
    if (this.state.activeSceneId === id) {
      this.state.activeSceneId = this.state.scenes[0]?.id || null;
    }
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient.deleteScene(projectId, id).catch(() => {});
    }
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
    if (
      chapterScenes.length > 0 &&
      (!this.state.activeSceneId ||
        !chapterScenes.some((s) => s.id === this.state.activeSceneId))
    ) {
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
    return this.state.blueprints.filter(
      (b) => b.blueprintClass === "FIRST_CLASS",
    );
  }

  getSecondClassBlueprints(): BlueprintDef[] {
    return this.state.blueprints.filter(
      (b) => b.blueprintClass === "SECOND_CLASS",
    );
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
    const projectId = this.state.activeProjectId || "default";
    const newBp: BlueprintDef = {
      id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: params.name.trim(),
      blueprintClass: params.blueprintClass,
      category: params.category.trim() || "Characters",
      description: params.description?.trim() || "",
      fields: params.fields || [
        {
          id: `f-${Date.now()}`,
          name: "name",
          label: "Entity Name",
          fieldType: "STRING",
          required: true,
        },
      ],
    };
    this.state.blueprints = [...this.state.blueprints, newBp];
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient
        .createBlueprint(projectId, {
          name: newBp.name,
          blueprintClass: newBp.blueprintClass,
          category: newBp.category,
          description: newBp.description,
          fields: newBp.fields,
        })
        .then((res) => {
          if (res?.data?.id && res.data.id !== newBp.id) {
            const oldId = newBp.id;
            const newId = res.data.id;
            this.state.blueprints = this.state.blueprints.map((b) =>
              b.id === oldId ? { ...b, id: newId } : b,
            );
            this.notify();
          }
        })
        .catch(() => {});
    }

    return newBp;
  }

  updateBlueprint(id: string, updates: Partial<BlueprintDef>) {
    const projectId = this.state.activeProjectId;
    this.state.blueprints = this.state.blueprints.map((b) =>
      b.id === id ? { ...b, ...updates } : b,
    );
    this.recomputeAllEntityFormulas();
    this.notify();

    if (projectId && projectId !== "default") {
      const bp = this.getBlueprint(id);
      if (bp) {
        mobileApiClient.updateBlueprint(projectId, id, bp).catch(() => {});
      }
    }
  }

  deleteBlueprint(id: string) {
    const projectId = this.state.activeProjectId;
    this.state.blueprints = this.state.blueprints.filter((b) => b.id !== id);
    this.state.entities = this.state.entities.filter(
      (e) => e.blueprintId !== id,
    );
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient.deleteBlueprint(projectId, id).catch(() => {});
    }
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
    const projectId = this.state.activeProjectId || "default";
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

    if (projectId && projectId !== "default") {
      mobileApiClient
        .createEntity(projectId, {
          name: newEnt.name,
          blueprintId: newEnt.blueprintId,
          blueprintName: newEnt.blueprintName,
          category: newEnt.category,
          description: newEnt.description,
          properties: newEnt.properties,
        })
        .then((res) => {
          if (res?.data?.id && res.data.id !== newEnt.id) {
            const oldId = newEnt.id;
            const newId = res.data.id;
            this.state.entities = this.state.entities.map((e) =>
              e.id === oldId ? { ...e, id: newId } : e,
            );
            this.notify();
          }
        })
        .catch(() => {});
    }

    return newEnt;
  }

  updateEntity(id: string, updates: Partial<EntityItem>) {
    const projectId = this.state.activeProjectId;
    this.state.entities = this.state.entities.map((e) => {
      if (e.id === id) {
        const updated = { ...e, ...updates };
        updated.computedFormulas = this.computeEntityFormulas(updated);
        return updated;
      }
      return e;
    });
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient
        .updateEntity(projectId, id, {
          name: updates.name,
          category: updates.category,
          description: updates.description,
          properties: updates.properties,
        })
        .catch(() => {});
    }
  }

  deleteEntity(id: string) {
    const projectId = this.state.activeProjectId;
    this.state.entities = this.state.entities.filter((e) => e.id !== id);
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient.deleteEntity(projectId, id).catch(() => {});
    }
  }

  private computeEntityFormulas(entity: EntityItem): Record<string, number> {
    const bp = this.getBlueprint(entity.blueprintId);
    return computeEntityFormulas(
      entity,
      bp,
      this.state.entities,
      this.state.blueprints,
    );
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
    return [...this.state.timelineEvents].sort(
      (a, b) => a.narrativeSequenceNumber - b.narrativeSequenceNumber,
    );
  }

  getTimelineEvent(id: string): TimelineEventItem | undefined {
    return this.state.timelineEvents.find((e) => e.id === id);
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
    const projectId = this.state.activeProjectId || "default";
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

    if (projectId && projectId !== "default") {
      mobileApiClient
        .createTimelineEvent(projectId, {
          title: newEv.title,
          description: newEv.description,
          narrativeSequenceNumber: newEv.narrativeSequenceNumber,
          chronologicalOrder: newEv.chronologicalOrder,
          effects: newEv.effects.map((eff) => ({
            targetEntity: eff.targetEntityId,
            propertyKey: eff.propertyKey,
            operation: eff.operation,
            value: eff.value,
          })),
        })
        .then((res) => {
          if (res?.data?.id && res.data.id !== newEv.id) {
            const oldId = newEv.id;
            const newId = res.data.id;
            this.state.timelineEvents = this.state.timelineEvents.map((ev) =>
              ev.id === oldId ? { ...ev, id: newId } : ev,
            );
            this.notify();
          }
        })
        .catch(() => {});
    }

    return newEv;
  }

  updateTimelineEvent(id: string, updates: Partial<TimelineEventItem>) {
    const projectId = this.state.activeProjectId;
    this.state.timelineEvents = this.state.timelineEvents.map((ev) =>
      ev.id === id ? { ...ev, ...updates } : ev,
    );
    this.notify();

    if (projectId && projectId !== "default") {
      const ev = this.getTimelineEvent(id);
      if (ev) {
        mobileApiClient
          .updateTimelineEvent(projectId, id, {
            title: ev.title,
            description: ev.description,
            narrativeSequenceNumber: ev.narrativeSequenceNumber,
            chronologicalOrder: ev.chronologicalOrder,
            effects: ev.effects.map((eff) => ({
              targetEntity: eff.targetEntityId,
              propertyKey: eff.propertyKey,
              operation: eff.operation,
              value: eff.value,
            })),
          })
          .catch(() => {});
      }
    }
  }

  deleteTimelineEvent(id: string) {
    const projectId = this.state.activeProjectId;
    this.state.timelineEvents = this.state.timelineEvents.filter(
      (ev) => ev.id !== id,
    );
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient.deleteTimelineEvent(projectId, id).catch(() => {});
    }
  }

  getFoldedEntitiesAtSequence(
    targetSeq: number,
    mode: "narrative" | "chronological" = "narrative",
  ): EntityItem[] {
    return this.foldStateAtSequence(targetSeq, mode);
  }

  foldStateAtSequence(
    targetSeq: number,
    mode: "narrative" | "chronological" = "narrative",
  ): EntityItem[] {
    return foldTimelineState(
      this.state.entities,
      this.state.timelineEvents,
      targetSeq,
      mode,
      this.state.blueprints,
    );
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
    const projectId = this.state.activeProjectId || "default";
    const newRule: InvariantRuleItem = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: params.name.trim(),
      severity: params.severity,
      type: params.type,
      targetBlueprintId: params.targetBlueprintId,
      targetBlueprintName: params.targetBlueprintName,
      targetCategory: params.targetCategory,
      predicateExpression: params.predicateExpression.trim(),
      predicateSummary: (
        params.predicateSummary || params.predicateExpression
      ).trim(),
      description: params.description.trim(),
      enabled: params.enabled !== undefined ? params.enabled : true,
      suggestedResolution: params.suggestedResolution?.trim(),
    };
    this.state.rules = [...this.state.rules, newRule];
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient
        .createRule(projectId, {
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
          if (res?.data?.id && res.data.id !== newRule.id) {
            const oldId = newRule.id;
            const newId = res.data.id;
            this.state.rules = this.state.rules.map((r) =>
              r.id === oldId ? { ...r, id: newId } : r,
            );
            this.notify();
          }
        })
        .catch(() => {});
    }

    return newRule;
  }

  updateRule(id: string, updates: Partial<InvariantRuleItem>) {
    const projectId = this.state.activeProjectId;
    this.state.rules = this.state.rules.map((r) =>
      r.id === id ? { ...r, ...updates } : r,
    );
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient.updateRule(projectId, id, updates).catch(() => {});
    }
  }

  deleteRule(id: string) {
    const projectId = this.state.activeProjectId;
    this.state.rules = this.state.rules.filter((r) => r.id !== id);
    this.notify();

    if (projectId && projectId !== "default") {
      mobileApiClient.deleteRule(projectId, id).catch(() => {});
    }
  }

  toggleRule(id: string) {
    const r = this.getRule(id);
    const projectId = this.state.activeProjectId;
    this.state.rules = this.state.rules.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item,
    );
    this.notify();

    if (projectId && projectId !== "default" && r) {
      mobileApiClient
        .updateRule(projectId, id, { enabled: !r.enabled })
        .catch(() => {});
    }
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

  overrideViolation(
    id: string,
    justification: string,
    authorName = "Lead Author",
  ) {
    const projectId = this.state.activeProjectId;
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

    if (projectId && projectId !== "default") {
      mobileApiClient
        .overrideViolation(projectId, id, justification.trim(), authorName)
        .catch(() => {});
    }
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
      narrativeSequenceNumber:
        params.narrativeSequenceNumber ??
        (this.state.timelineEvents.length + 1) * 10,
      chronologicalOrder:
        params.chronologicalOrder ??
        (this.state.timelineEvents.length + 1) * 10,
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
    return Math.min(
      100,
      Math.round(
        (this.state.todayWordsWritten / this.state.dailyWordGoal) * 100,
      ),
    );
  }
}

export const mobileStore = new MobileStore();
