/**
 * @file mobileStore.ts
 * @description Mobile client reactive state engine with project switching, prose drafting, and world building telemetry.
 * Block Standard: BLOCK_MOBILE_STORE_001
 */

import type {
  BlueprintDef,
  EntityItem,
  MobileProjectItem,
  MobileChapterItem,
  MobileSceneItem,
} from "./types";

export interface MobileAppState {
  projects: MobileProjectItem[];
  activeProjectId: string | null;
  chapters: MobileChapterItem[];
  scenes: MobileSceneItem[];
  activeSceneId: string | null;
  blueprints: BlueprintDef[];
  entities: EntityItem[];
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
        id: "proj-demo-1",
        name: "Chronicles of the Celestial Dao",
        genre: "Xianxia / Cultivation",
        description: "An ancient realm where cultivators ascend mortal planes through spiritual breakthroughs and divine artifact refinement.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    activeProjectId: "proj-demo-1",
    chapters: [
      {
        id: "chap-1",
        projectId: "proj-demo-1",
        title: "Chapter 1: The Mountain Gate",
        orderIndex: 0,
        synopsis: "Eldrin arrives at the Azure Cloud Sect gates seeking apprenticeship.",
      },
    ],
    scenes: [
      {
        id: "scene-1",
        chapterId: "chap-1",
        projectId: "proj-demo-1",
        title: "Scene 1: Dawn at the Sect Steps",
        orderIndex: 0,
        proseContent: "The morning mist clung to the thousand jade steps ascending into the heavens. Eldrin tightened his grip on the rusted ancestral blade...",
        wordCount: 22,
        status: "IN_PROGRESS",
        targetWordCount: 1500,
        synopsis: "Eldrin encounters the outer sect gatekeeper.",
      },
    ],
    activeSceneId: "scene-1",
    blueprints: [
      {
        id: "bp-cultivator",
        name: "Cultivator Archetype",
        blueprintClass: "FIRST_CLASS",
        category: "Characters",
        description: "Primary martial artist or spiritual cultivator.",
        fields: [
          { id: "f1", name: "realm", label: "Cultivation Realm", fieldType: "STRING" },
          { id: "f2", name: "qi_power", label: "Qi Power Level", fieldType: "NUMBER", min: 1, max: 10000 },
        ],
      },
      {
        id: "bp-artifact",
        name: "Sacred Relic",
        blueprintClass: "FIRST_CLASS",
        category: "Relics & Armaments",
        description: "Ancient weapons, talismans, and spiritual treasures.",
        fields: [
          { id: "f3", name: "grade", label: "Treasure Grade", fieldType: "STRING" },
          { id: "f4", name: "attack_power", label: "Base Attack Power", fieldType: "NUMBER", min: 10, max: 5000 },
        ],
      },
    ],
    entities: [
      {
        id: "ent-eldrin",
        blueprintId: "bp-cultivator",
        name: "Eldrin Stormweaver",
        category: "Characters",
        description: "Aspiring disciple with dual wind and lightning spiritual roots.",
        properties: { realm: "Foundation Establishment", qi_power: 450 },
        computedFormulas: { combat_score: 950 },
        lastMutatedSeqNumber: 12,
      },
      {
        id: "ent-blade",
        blueprintId: "bp-artifact",
        name: "Thunderfang Longsword",
        category: "Relics & Armaments",
        description: "A grade-3 spiritual blade forged from celestial lightning ore.",
        properties: { grade: "Grade 3 Earth Rank", attack_power: 620 },
        lastMutatedSeqNumber: 8,
      },
    ],
    dailyWordGoal: 1000,
    todayWordsWritten: 22,
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

  // Active Project Getters & Setters
  getActiveProject(): MobileProjectItem | null {
    return this.state.projects.find((p) => p.id === this.state.activeProjectId) || null;
  }

  setActiveProject(id: string | null) {
    this.state.activeProjectId = id;
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

  // Prose Studio Operations
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

  // World Studio Operations
  getEntities(): EntityItem[] {
    return this.state.entities;
  }

  getBlueprints(): BlueprintDef[] {
    return this.state.blueprints;
  }

  getTotalWordCount(): number {
    return this.state.scenes
      .filter((s) => s.projectId === this.state.activeProjectId)
      .reduce((acc, s) => acc + (s.wordCount || 0), 0);
  }
}

export const mobileStore = new MobileStore();
