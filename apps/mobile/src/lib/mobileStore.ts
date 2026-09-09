/**
 * @file mobileStore.ts
 * @description Mobile client reactive state engine with project switching, prose drafting, world building, timeline, rules, and continuity audit.
 * Block Standard: BLOCK_MOBILE_STORE_001
 */

import type {
  BlueprintDef,
  EntityItem,
  MobileProjectItem,
  MobileChapterItem,
  MobileSceneItem,
  MobileTimelineEvent,
  MobileInvariantRule,
  MobileContinuityIssue,
} from "./types.ts";

export interface MobileAppState {
  projects: MobileProjectItem[];
  activeProjectId: string | null;
  chapters: MobileChapterItem[];
  scenes: MobileSceneItem[];
  activeSceneId: string | null;
  blueprints: BlueprintDef[];
  entities: EntityItem[];
  timelineEvents: MobileTimelineEvent[];
  invariantRules: MobileInvariantRule[];
  continuityIssues: MobileContinuityIssue[];
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
    projects: [
      {
        id: "proj-celestial",
        name: "Chronicles of the Celestial Dao",
        genre: "Xianxia / Cultivation",
        description: "An ancient realm where cultivators ascend mortal planes through spiritual breakthroughs, dao comprehension, and artifact refinement.",
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-09T18:30:00.000Z",
      },
      {
        id: "proj-starfall",
        name: "Starfall Vanguard",
        genre: "Sci-Fi / Space Opera",
        description: "A dying stellar imperium wages war against rogue artificial intelligences on the galactic rim.",
        createdAt: "2026-09-05T14:20:00.000Z",
        updatedAt: "2026-09-09T12:00:00.000Z",
      },
    ],
    activeProjectId: "proj-celestial",
    chapters: [
      {
        id: "chap-1",
        projectId: "proj-celestial",
        title: "Chapter 1: The Mountain Gate",
        orderIndex: 0,
        synopsis: "Eldrin arrives at the Azure Cloud Sect gates seeking apprenticeship amidst the mist.",
      },
      {
        id: "chap-2",
        projectId: "proj-celestial",
        title: "Chapter 2: The Spirit Gathering Trial",
        orderIndex: 1,
        synopsis: "A crucible test where aspiring disciples channel spiritual qi into ancestral resonance stones.",
      },
    ],
    scenes: [
      {
        id: "scene-1",
        chapterId: "chap-1",
        projectId: "proj-celestial",
        title: "Scene 1: Dawn at the Sect Steps",
        orderIndex: 0,
        proseContent: "The morning mist clung to the thousand jade steps ascending into the heavens. Eldrin tightened his grip on the rusted ancestral blade, feeling the faint hum of lightning slumbering within the metal.",
        wordCount: 31,
        status: "IN_PROGRESS",
        targetWordCount: 1500,
        synopsis: "Eldrin encounters the outer sect gatekeeper and displays his unyielding determination.",
      },
      {
        id: "scene-2",
        chapterId: "chap-1",
        projectId: "proj-celestial",
        title: "Scene 2: The Elder's Decree",
        orderIndex: 1,
        proseContent: "Elder Shen lowered his gaze, his silver robes billowing in the mountain gale. 'A dual root of wind and thunder is rare, boy. But talent without temperance is mere kindling for disaster.'",
        wordCount: 31,
        status: "DRAFT",
        targetWordCount: 1800,
        synopsis: "Elder Shen tests Eldrin's meridians and grants him probation into the outer courtyard.",
      },
      {
        id: "scene-3",
        chapterId: "chap-2",
        projectId: "proj-celestial",
        title: "Scene 1: Resonating Pillars",
        orderIndex: 0,
        proseContent: "Nine obsidian monoliths rose around the courtyard. As Eldrin stepped forward, the azure runes ignited in a cascading shockwave.",
        wordCount: 20,
        status: "DRAFT",
        targetWordCount: 2000,
        synopsis: "The spirit trial begins.",
      },
    ],
    activeSceneId: "scene-1",
    blueprints: [
      {
        id: "bp-cultivator",
        name: "Cultivator Archetype",
        blueprintClass: "FIRST_CLASS",
        category: "Characters",
        description: "Primary martial artist or spiritual cultivator with cultivation realm and combat rating.",
        fields: [
          { id: "f1", name: "realm", label: "Cultivation Realm", fieldType: "STRING", isRequired: true },
          { id: "f2", name: "qi_power", label: "Qi Power Level", fieldType: "NUMBER", min: 1, max: 10000 },
          { id: "f3", name: "faction", label: "Sect / Allegiance", fieldType: "STRING" },
          { id: "f4", name: "status", label: "Life Status", fieldType: "ENUM", options: ["ALIVE", "INJURED", "DEAD", "TRANSCENDED"] },
        ],
      },
      {
        id: "bp-artifact",
        name: "Sacred Relic",
        blueprintClass: "FIRST_CLASS",
        category: "Relics & Armaments",
        description: "Ancient weapons, divine talismans, and spiritual treasures.",
        fields: [
          { id: "f5", name: "grade", label: "Treasure Grade", fieldType: "STRING", isRequired: true },
          { id: "f6", name: "attack_power", label: "Base Attack Power", fieldType: "NUMBER", min: 10, max: 5000 },
          { id: "f7", name: "element", label: "Elemental Affinity", fieldType: "STRING" },
        ],
      },
      {
        id: "bp-location",
        name: "Cosmic Realm / Sect",
        blueprintClass: "FIRST_CLASS",
        category: "Cosmology & Geography",
        description: "Sacred mountain domains, ancestral grounds, and mystic territories.",
        fields: [
          { id: "f8", name: "qi_density", label: "Qi Density (1-10)", fieldType: "NUMBER", min: 1, max: 10 },
          { id: "f9", name: "ruling_sect", label: "Ruling Sect", fieldType: "STRING" },
        ],
      },
    ],
    entities: [
      {
        id: "ent-eldrin",
        projectId: "proj-celestial",
        blueprintId: "bp-cultivator",
        name: "Eldrin Stormweaver",
        category: "Characters",
        description: "Protagonist with dual wind and lightning spiritual roots striving for ascension.",
        properties: {
          realm: "Foundation Establishment",
          qi_power: 450,
          faction: "Azure Cloud Sect",
          status: "ALIVE",
        },
        computedFormulas: { combat_score: 950 },
        lastMutatedSeqNumber: 12,
      },
      {
        id: "ent-malakor",
        projectId: "proj-celestial",
        blueprintId: "bp-cultivator",
        name: "Lord Malakor",
        category: "Characters",
        description: "Former grand patriarch slain in the Great Cataclysm.",
        properties: {
          realm: "Core Formation",
          qi_power: 0,
          faction: "Void Harbingers",
          status: "DEAD",
        },
        computedFormulas: { combat_score: 0 },
        lastMutatedSeqNumber: 150,
      },
      {
        id: "ent-blade",
        projectId: "proj-celestial",
        blueprintId: "bp-artifact",
        name: "Thunderfang Longsword",
        category: "Relics & Armaments",
        description: "A grade-3 spiritual blade forged from celestial lightning ore.",
        properties: {
          grade: "Grade 3 Earth Rank",
          attack_power: 620,
          element: "Lightning",
        },
        lastMutatedSeqNumber: 8,
      },
      {
        id: "ent-mountain",
        projectId: "proj-celestial",
        blueprintId: "bp-location",
        name: "Azure Cloud Peak",
        category: "Cosmology & Geography",
        description: "Sacred peak soaring ten thousand feet into the heavens.",
        properties: {
          qi_density: 9,
          ruling_sect: "Azure Cloud Sect",
        },
        lastMutatedSeqNumber: 2,
      },
    ],
    timelineEvents: [
      {
        id: "evt-1",
        projectId: "proj-celestial",
        sequenceNumber: 1,
        title: "The Fall of the Void Citadel",
        timestamp: "Year of the Dragon 1024",
        eventType: "CANON_MUTATION",
        entityName: "Lord Malakor",
        entityId: "ent-malakor",
        description: "Patriarch Malakor falls in battle; status set to DEAD at Seq #150.",
        delta: { status: "DEAD", qi_power: 0 },
        isKeyMilestone: true,
      },
      {
        id: "evt-2",
        projectId: "proj-celestial",
        sequenceNumber: 2,
        title: "Forging of Thunderfang",
        timestamp: "Year of the Dragon 1030",
        eventType: "STATE_INITIALIZATION",
        entityName: "Thunderfang Longsword",
        entityId: "ent-blade",
        description: "Divine blade awakened with lightning ore.",
        delta: { grade: "Grade 3 Earth Rank", attack_power: 620 },
      },
      {
        id: "evt-3",
        projectId: "proj-celestial",
        sequenceNumber: 3,
        title: "Eldrin Foundation Breakthrough",
        timestamp: "Year of the Dragon 1042",
        eventType: "AFFINITY_SHIFT",
        entityName: "Eldrin Stormweaver",
        entityId: "ent-eldrin",
        description: "Eldrin ascends to Foundation Establishment stage.",
        delta: { realm: "Foundation Establishment", qi_power: 450 },
        isKeyMilestone: true,
      },
    ],
    invariantRules: [
      {
        id: "r-mana-bounds",
        projectId: "proj-celestial",
        name: "Qi / Mana Non-Negativity Invariant",
        description: "Spiritual energy and stamina can never drop below zero in any scene event.",
        severity: "BLOCKING_ERROR",
        scope: "GLOBAL",
        ruleExpression: "entity.qi_power >= 0",
        isActive: true,
      },
      {
        id: "r-deceased-actions",
        projectId: "proj-celestial",
        name: "Deceased Entity Inaction Rule",
        description: "Entities marked as DEAD cannot cast spells, move, or speak without necromancy authorization.",
        severity: "BLOCKING_ERROR",
        scope: "CHARACTERS",
        ruleExpression: "entity.status != 'DEAD' || action == 'NECROMANCY'",
        isActive: true,
      },
      {
        id: "r-realm-cap",
        projectId: "proj-celestial",
        name: "Mortal Realm Boundary Cap",
        description: "Foundation Establishment disciples cannot surpass 1,000 base Qi power.",
        severity: "WARNING",
        scope: "CHARACTERS",
        ruleExpression: "realm != 'Foundation' || qi_power <= 1000",
        isActive: true,
      },
    ],
    continuityIssues: [
      {
        id: "iss-1",
        code: "INVARIANT_STATE_ILLEGAL_ACTION",
        ruleName: "Deceased Entity Inaction Rule",
        entityName: "Lord Malakor",
        sceneTitle: "Scene 1: Dawn at the Sect Steps",
        message: "Lord Malakor is marked DEAD at Seq #150 and cannot execute combat moves in active scene.",
        severity: "ERROR",
      },
    ],
    dailyWordGoal: 1000,
    todayWordsWritten: 82,
  };

  private listeners: Set<Listener> = new Set();

  getState(): MobileAppState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ==========================================
  // Project Management
  // ==========================================
  getActiveProject(): MobileProjectItem | null {
    return this.state.projects.find((p) => p.id === this.state.activeProjectId) || null;
  }

  setActiveProject(id: string | null) {
    this.state.activeProjectId = id;
    const firstChap = this.getChaptersForActiveProject()[0];
    if (firstChap) {
      const firstScene = this.getScenesForChapter(firstChap.id)[0];
      this.state.activeSceneId = firstScene ? firstScene.id : null;
    } else {
      this.state.activeSceneId = null;
    }
    this.notify();
  }

  createProject(params: { name: string; genre?: string; description?: string }): MobileProjectItem {
    const newProj: MobileProjectItem = {
      id: `proj-${Date.now()}`,
      name: params.name.trim(),
      genre: params.genre?.trim() || "Creative Fiction",
      description: params.description?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.projects = [newProj, ...this.state.projects];
    this.state.activeProjectId = newProj.id;
    this.notify();
    return newProj;
  }

  updateProject(id: string, params: { name: string; genre?: string; description?: string }) {
    this.state.projects = this.state.projects.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: params.name.trim(),
          genre: params.genre?.trim() || p.genre,
          description: params.description?.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.notify();
  }

  deleteProject(id: string) {
    this.state.projects = this.state.projects.filter((p) => p.id !== id);
    if (this.state.activeProjectId === id) {
      this.state.activeProjectId = this.state.projects[0]?.id || null;
    }
    this.notify();
  }

  // ==========================================
  // Prose Studio Operations
  // ==========================================
  getActiveScene(): MobileSceneItem | null {
    return this.state.scenes.find((s) => s.id === this.state.activeSceneId) || null;
  }

  getChaptersForActiveProject(): MobileChapterItem[] {
    return this.state.chapters
      .filter((c) => c.projectId === this.state.activeProjectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getScenesForChapter(chapterId: string): MobileSceneItem[] {
    return this.state.scenes
      .filter((s) => s.chapterId === chapterId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  selectScene(sceneId: string | null) {
    this.state.activeSceneId = sceneId;
    this.notify();
  }

  updateSceneContent(sceneId: string, content: string) {
    const words = countWords(content);
    this.state.scenes = this.state.scenes.map((s) => {
      if (s.id === sceneId) {
        const diff = Math.max(0, words - s.wordCount);
        this.state.todayWordsWritten += diff;
        return {
          ...s,
          proseContent: content,
          wordCount: words,
        };
      }
      return s;
    });
    this.notify();
  }

  setSceneStatus(sceneId: string, status: "DRAFT" | "IN_PROGRESS" | "REVISED" | "COMPLETED") {
    this.state.scenes = this.state.scenes.map((s) => (s.id === sceneId ? { ...s, status } : s));
    this.notify();
  }

  createChapter(title: string, synopsis?: string): MobileChapterItem {
    const projectId = this.state.activeProjectId || "proj-default";
    const existing = this.getChaptersForActiveProject();
    const newChap: MobileChapterItem = {
      id: `chap-${Date.now()}`,
      projectId,
      title: title.trim() || `Chapter ${existing.length + 1}`,
      orderIndex: existing.length,
      synopsis: synopsis?.trim(),
    };
    this.state.chapters = [...this.state.chapters, newChap];
    this.notify();
    return newChap;
  }

  createScene(chapterId: string, title: string, targetWords = 1500): MobileSceneItem {
    const projectId = this.state.activeProjectId || "proj-default";
    const existing = this.getScenesForChapter(chapterId);
    const newScene: MobileSceneItem = {
      id: `scene-${Date.now()}`,
      chapterId,
      projectId,
      title: title.trim() || `Scene ${existing.length + 1}`,
      orderIndex: existing.length,
      proseContent: "",
      wordCount: 0,
      status: "DRAFT",
      targetWordCount: targetWords,
    };
    this.state.scenes = [...this.state.scenes, newScene];
    this.state.activeSceneId = newScene.id;
    this.notify();
    return newScene;
  }

  // ==========================================
  // World Studio Operations: Entities
  // ==========================================
  getEntities(): EntityItem[] {
    return this.state.entities.filter(
      (e) => !e.projectId || e.projectId === this.state.activeProjectId
    );
  }

  createEntity(params: {
    name: string;
    blueprintId: string;
    category?: string;
    description?: string;
    properties?: Record<string, unknown>;
  }): EntityItem {
    const blueprint = this.state.blueprints.find((b) => b.id === params.blueprintId);
    const newEntity: EntityItem = {
      id: `ent-${Date.now()}`,
      projectId: this.state.activeProjectId || undefined,
      blueprintId: params.blueprintId,
      name: params.name.trim(),
      category: params.category || blueprint?.category || "General",
      description: params.description?.trim(),
      properties: params.properties || {},
      lastMutatedSeqNumber: 1,
    };
    this.state.entities = [newEntity, ...this.state.entities];
    this.notify();
    return newEntity;
  }

  deleteEntity(id: string) {
    this.state.entities = this.state.entities.filter((e) => e.id !== id);
    this.notify();
  }

  // ==========================================
  // World Studio Operations: Blueprints
  // ==========================================
  getBlueprints(): BlueprintDef[] {
    return this.state.blueprints;
  }

  createBlueprint(params: {
    name: string;
    category: string;
    description?: string;
    blueprintClass: "FIRST_CLASS" | "SECOND_CLASS";
  }): BlueprintDef {
    const newBp: BlueprintDef = {
      id: `bp-${Date.now()}`,
      projectId: this.state.activeProjectId || undefined,
      name: params.name.trim(),
      category: params.category.trim(),
      description: params.description?.trim(),
      blueprintClass: params.blueprintClass,
      fields: [
        { id: `f-${Date.now()}`, name: "name", label: "Entity Name", fieldType: "STRING", isRequired: true },
      ],
    };
    this.state.blueprints = [...this.state.blueprints, newBp];
    this.notify();
    return newBp;
  }

  // ==========================================
  // World Studio Operations: Timeline & Audit
  // ==========================================
  getTimelineEvents(): MobileTimelineEvent[] {
    return this.state.timelineEvents
      .filter((e) => !e.projectId || e.projectId === this.state.activeProjectId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  createTimelineEvent(params: {
    title: string;
    entityName: string;
    entityId: string;
    description: string;
    eventType: "CANON_MUTATION" | "RELATION_TRANSFER" | "AFFINITY_SHIFT" | "STATE_INITIALIZATION";
    timestamp: string;
  }): MobileTimelineEvent {
    const existing = this.getTimelineEvents();
    const newEvt: MobileTimelineEvent = {
      id: `evt-${Date.now()}`,
      projectId: this.state.activeProjectId || "proj-default",
      sequenceNumber: existing.length + 1,
      title: params.title.trim(),
      timestamp: params.timestamp.trim() || new Date().toLocaleDateString(),
      eventType: params.eventType,
      entityName: params.entityName.trim(),
      entityId: params.entityId,
      description: params.description.trim(),
      delta: {},
    };
    this.state.timelineEvents = [...this.state.timelineEvents, newEvt];
    this.notify();
    return newEvt;
  }

  getInvariantRules(): MobileInvariantRule[] {
    return this.state.invariantRules;
  }

  toggleRule(id: string) {
    this.state.invariantRules = this.state.invariantRules.map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    this.notify();
  }

  getContinuityIssues(): MobileContinuityIssue[] {
    return this.state.continuityIssues;
  }

  // ==========================================
  // Telemetry Calculations
  // ==========================================
  getTotalWordCount(): number {
    return this.state.scenes
      .filter((s) => s.projectId === this.state.activeProjectId)
      .reduce((acc, s) => acc + (s.wordCount || 0), 0);
  }

  getReadingTimeMin(): number {
    return Math.ceil(this.getTotalWordCount() / 200);
  }

  getDailyGoalProgress(): number {
    if (this.state.dailyWordGoal <= 0) return 0;
    return Math.min(100, Math.round((this.state.todayWordsWritten / this.state.dailyWordGoal) * 100));
  }
}

export const mobileStore = new MobileStore();

