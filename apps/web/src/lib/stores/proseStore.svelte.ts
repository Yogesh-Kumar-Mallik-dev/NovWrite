/**
 * @file proseStore.svelte.ts
 * @description Svelte 5 Runes reactive store for Prose Studio manuscripts, chapters, and scenes.
 * Block Standard: BLOCK_PROSE_STORE_RUNE_001
 */

import { toastStore } from "./toastStore.svelte";
import { projectStore } from "./projectStore.svelte";

export type SceneStatus = "DRAFT" | "IN_PROGRESS" | "REVISED" | "COMPLETED";

export interface ChapterItem {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  synopsis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SceneItem {
  id: string;
  chapterId: string;
  projectId: string;
  title: string;
  orderIndex: number;
  proseContent: string;
  wordCount: number;
  status: SceneStatus;
  povCharacterId?: string;
  timelineSequenceNumber?: number;
  targetWordCount?: number;
  synopsis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterParams {
  title: string;
  synopsis?: string;
}

export interface CreateSceneParams {
  chapterId: string;
  title: string;
  synopsis?: string;
  targetWordCount?: number;
  povCharacterId?: string;
  timelineSequenceNumber?: number;
}

function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export class ProseStateStore {
  chapters = $state<ChapterItem[]>([]);
  scenes = $state<SceneItem[]>([]);
  activeSceneId = $state<string | null>(null);
  activeChapterId = $state<string | null>(null);
  isLoaded = $state<boolean>(false);
  dailyWordGoal = $state<number>(1000);
  todayWordsWritten = $state<number>(0);
  private currentLoadedProjectId: string | null = null;

  // Pure derived getters
  activeScene = $derived.by(() => {
    if (!this.activeSceneId) return null;
    return this.scenes.find((s) => s.id === this.activeSceneId) || null;
  });

  activeChapter = $derived.by(() => {
    if (!this.activeChapterId) {
      if (this.activeScene) {
        return this.chapters.find((c) => c.id === this.activeScene?.chapterId) || null;
      }
      return null;
    }
    return this.chapters.find((c) => c.id === this.activeChapterId) || null;
  });

  sortedChapters = $derived.by(() => {
    return [...this.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  });

  totalWordCount = $derived.by(() => {
    return this.scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0);
  });

  totalChaptersCount = $derived.by(() => {
    return this.chapters.length;
  });

  totalScenesCount = $derived.by(() => {
    return this.scenes.length;
  });

  constructor() {
    this.initForCurrentProject();
  }

  getStorageKey(projectId: string): string {
    return `novwrite_prose_v1_${projectId}`;
  }

  initForCurrentProject(): void {
    const currentProjectId = projectStore.activeProjectId;
    if (!currentProjectId) {
      this.chapters = [];
      this.scenes = [];
      this.activeSceneId = null;
      this.activeChapterId = null;
      this.isLoaded = true;
      this.currentLoadedProjectId = null;
      return;
    }

    if (this.currentLoadedProjectId === currentProjectId && this.isLoaded) {
      return;
    }

    this.currentLoadedProjectId = currentProjectId;
    this.loadFromStorage(currentProjectId);
  }

  loadFromStorage(projectId: string): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      this.isLoaded = true;
      return;
    }

    try {
      const key = this.getStorageKey(projectId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          this.chapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];
          this.scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
          this.dailyWordGoal = typeof parsed.dailyWordGoal === "number" ? parsed.dailyWordGoal : 1000;
          this.todayWordsWritten = typeof parsed.todayWordsWritten === "number" ? parsed.todayWordsWritten : 0;
          if (parsed.activeSceneId && this.scenes.some((s) => s.id === parsed.activeSceneId)) {
            this.activeSceneId = parsed.activeSceneId;
          } else if (this.scenes.length > 0) {
            this.activeSceneId = this.scenes[0].id;
          } else {
            this.activeSceneId = null;
          }
        }
      } else {
        // Clean slate for new project - zero default clutter
        this.chapters = [];
        this.scenes = [];
        this.activeSceneId = null;
        this.activeChapterId = null;
      }
    } catch (e) {
      console.warn("[ProseStore] Failed to load prose data:", e);
    } finally {
      this.isLoaded = true;
    }
  }

  saveToStorage(): void {
    const projectId = projectStore.activeProjectId;
    if (!projectId || typeof window === "undefined" || typeof localStorage === "undefined") return;

    try {
      const key = this.getStorageKey(projectId);
      const payload = {
        chapters: this.chapters,
        scenes: this.scenes,
        activeSceneId: this.activeSceneId,
        dailyWordGoal: this.dailyWordGoal,
        todayWordsWritten: this.todayWordsWritten,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn("[ProseStore] Failed to save prose data:", e);
    }
  }

  getScenesForChapter(chapterId: string): SceneItem[] {
    return this.scenes
      .filter((s) => s.chapterId === chapterId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  createChapter(params: CreateChapterParams): ChapterItem {
    const projectId = projectStore.activeProjectId || "default";
    const newChapter: ChapterItem = {
      id: `chap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId,
      title: params.title.trim() || `Chapter ${this.chapters.length + 1}`,
      orderIndex: this.chapters.length,
      synopsis: params.synopsis?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.chapters = [...this.chapters, newChapter];
    this.activeChapterId = newChapter.id;
    this.saveToStorage();
    toastStore.success(`Chapter "${newChapter.title}" created.`);
    return newChapter;
  }

  updateChapter(id: string, updates: Partial<ChapterItem>): void {
    this.chapters = this.chapters.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    this.saveToStorage();
  }

  deleteChapter(id: string): void {
    const chapter = this.chapters.find((c) => c.id === id);
    const chapterTitle = chapter?.title || "Chapter";

    this.chapters = this.chapters.filter((c) => c.id !== id);
    this.scenes = this.scenes.filter((s) => s.chapterId !== id);

    if (this.activeChapterId === id) {
      this.activeChapterId = this.chapters[0]?.id || null;
    }
    if (this.activeScene?.chapterId === id) {
      this.activeSceneId = this.scenes[0]?.id || null;
    }

    this.saveToStorage();
    toastStore.success(`Deleted "${chapterTitle}" and its associated scenes.`);
  }

  createScene(params: CreateSceneParams): SceneItem {
    const projectId = projectStore.activeProjectId || "default";
    const existingChapterScenes = this.getScenesForChapter(params.chapterId);
    const newScene: SceneItem = {
      id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      chapterId: params.chapterId,
      projectId,
      title: params.title.trim() || `Scene ${existingChapterScenes.length + 1}`,
      orderIndex: existingChapterScenes.length,
      proseContent: "",
      wordCount: 0,
      status: "DRAFT",
      povCharacterId: params.povCharacterId,
      timelineSequenceNumber: params.timelineSequenceNumber,
      targetWordCount: params.targetWordCount || 1500,
      synopsis: params.synopsis?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.scenes = [...this.scenes, newScene];
    this.activeSceneId = newScene.id;
    this.saveToStorage();
    toastStore.success(`Scene "${newScene.title}" created.`);
    return newScene;
  }

  updateScene(id: string, updates: Partial<SceneItem>): void {
    this.scenes = this.scenes.map((s) => {
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
    this.saveToStorage();
  }

  updateSceneContent(id: string, content: string): void {
    const words = countWords(content);
    this.scenes = this.scenes.map((s) => {
      if (s.id === id) {
        const diff = Math.max(0, words - s.wordCount);
        this.todayWordsWritten += diff;
        return {
          ...s,
          proseContent: content,
          wordCount: words,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    this.saveToStorage();
  }

  deleteScene(id: string): void {
    const scene = this.scenes.find((s) => s.id === id);
    const sceneTitle = scene?.title || "Scene";

    this.scenes = this.scenes.filter((s) => s.id !== id);
    if (this.activeSceneId === id) {
      this.activeSceneId = this.scenes[0]?.id || null;
    }

    this.saveToStorage();
    toastStore.success(`Deleted scene "${sceneTitle}".`);
  }

  selectScene(sceneId: string | null): void {
    this.activeSceneId = sceneId;
    if (sceneId) {
      const scene = this.scenes.find((s) => s.id === sceneId);
      if (scene) {
        this.activeChapterId = scene.chapterId;
      }
    }
    this.saveToStorage();
  }

  selectChapter(chapterId: string | null): void {
    this.activeChapterId = chapterId;
    const chapterScenes = chapterId ? this.getScenesForChapter(chapterId) : [];
    if (chapterScenes.length > 0 && (!this.activeSceneId || !chapterScenes.some((s) => s.id === this.activeSceneId))) {
      this.activeSceneId = chapterScenes[0].id;
    }
    this.saveToStorage();
  }

  setDailyGoal(goal: number): void {
    this.dailyWordGoal = Math.max(100, goal);
    this.saveToStorage();
  }
}

export const proseStore = new ProseStateStore();
