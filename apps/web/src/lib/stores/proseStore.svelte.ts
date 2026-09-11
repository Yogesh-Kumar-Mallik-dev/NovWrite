/**
 * @file proseStore.svelte.ts
 * @description Svelte 5 Runes reactive store for Prose Studio manuscripts, chapters, and scenes with optimistic backend synchronization.
 * Block Standard: BLOCK_PROSE_STORE_RUNE_001
 */

import { toastStore } from "./toastStore.svelte";
import { projectStore } from "./projectStore.svelte";
import { apiClient } from "../api/apiClient";
import { countWords } from "../engine/proseEngine";

import type {
  SceneStatus,
  ChapterItem,
  SceneItem,
  CreateChapterParams,
  CreateSceneParams,
} from "@novwrite/bridge";

export type {
  SceneStatus,
  ChapterItem,
  SceneItem,
  CreateChapterParams,
  CreateSceneParams,
};

export class ProseStateStore {
  chapters = $state<ChapterItem[]>([]);
  scenes = $state<SceneItem[]>([]);
  activeSceneId = $state<string | null>(null);
  activeChapterId = $state<string | null>(null);
  isLoaded = $state<boolean>(false);
  isSyncing = $state<boolean>(false);
  dailyWordGoal = $state<number>(1000);
  todayWordsWritten = $state<number>(0);
  private currentLoadedProjectId: string | null = null;
  private unsubscribeSSE: (() => void) | null = null;

  // Pure derived getters
  activeScene = $derived.by(() => {
    if (!this.activeSceneId) return null;
    return this.scenes.find((s) => s.id === this.activeSceneId) || null;
  });

  activeChapter = $derived.by(() => {
    if (!this.activeChapterId) {
      if (this.activeScene) {
        return (
          this.chapters.find((c) => c.id === this.activeScene?.chapterId) ||
          null
        );
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
      if (this.unsubscribeSSE) {
        this.unsubscribeSSE();
        this.unsubscribeSSE = null;
      }
      return;
    }

    if (this.currentLoadedProjectId === currentProjectId && this.isLoaded) {
      return;
    }

    this.currentLoadedProjectId = currentProjectId;
    this.loadFromStorage(currentProjectId);

    if (typeof window !== "undefined") {
      this.syncWithBackend(currentProjectId);
      this.initSSEListener(currentProjectId);
    }
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
          this.dailyWordGoal =
            typeof parsed.dailyWordGoal === "number"
              ? parsed.dailyWordGoal
              : 1000;
          this.todayWordsWritten =
            typeof parsed.todayWordsWritten === "number"
              ? parsed.todayWordsWritten
              : 0;
          if (
            parsed.activeSceneId &&
            this.scenes.some((s) => s.id === parsed.activeSceneId)
          ) {
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
    const projectId =
      this.currentLoadedProjectId || projectStore.activeProjectId;
    if (
      !projectId ||
      typeof window === "undefined" ||
      typeof localStorage === "undefined"
    )
      return;

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

  /**
   * Reconciles local chapters and scenes with the canonical Go backend.
   */
  async syncWithBackend(projectId?: string): Promise<void> {
    const targetProject =
      projectId || this.currentLoadedProjectId || projectStore.activeProjectId;
    if (!targetProject || typeof window === "undefined") return;

    this.isSyncing = true;
    try {
      const [chapRes, sceneRes] = await Promise.allSettled([
        apiClient.listChapters(targetProject, { pageSize: 100 }),
        apiClient.listScenes(targetProject, undefined, { pageSize: 100 }),
      ]);

      if (
        chapRes.status === "fulfilled" &&
        chapRes.value &&
        chapRes.value.data
      ) {
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
        this.chapters = backendChaps.sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
      }

      if (
        sceneRes.status === "fulfilled" &&
        sceneRes.value &&
        sceneRes.value.data
      ) {
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
        this.scenes = backendScenes.sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
      }

      if (!this.activeSceneId && this.scenes.length > 0) {
        this.activeSceneId = this.scenes[0].id;
      } else if (this.activeSceneId && !this.scenes.some((s) => s.id === this.activeSceneId)) {
        this.activeSceneId = this.scenes.length > 0 ? this.scenes[0].id : null;
      }

      if (!this.activeChapterId && this.chapters.length > 0) {
        this.activeChapterId = this.chapters[0].id;
      } else if (this.activeChapterId && !this.chapters.some((c) => c.id === this.activeChapterId)) {
        this.activeChapterId = this.chapters.length > 0 ? this.chapters[0].id : null;
      }

      this.saveToStorage();
    } catch {
      // Backend offline or error; seamlessly continue with local state
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
      if (evt.event === "CHAPTER_CREATED" && evt.payload) {
        const c = evt.payload as ChapterItem;
        if (!this.chapters.some((item) => item.id === c.id)) {
          this.chapters = [...this.chapters, c].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          this.saveToStorage();
        }
      } else if (evt.event === "CHAPTER_UPDATED" && evt.payload) {
        const c = evt.payload as ChapterItem;
        const idx = this.chapters.findIndex((item) => item.id === c.id);
        if (idx !== -1) {
          this.chapters[idx] = { ...this.chapters[idx], ...c };
          this.saveToStorage();
        }
      } else if (evt.event === "CHAPTER_DELETED" && evt.payload) {
        const payload = evt.payload as { id: string };
        this.chapters = this.chapters.filter((c) => c.id !== payload.id);
        this.scenes = this.scenes.filter((s) => s.chapterId !== payload.id);
        if (this.activeChapterId === payload.id) {
          this.activeChapterId = this.chapters[0]?.id || null;
        }
        if (this.activeScene?.chapterId === payload.id) {
          this.activeSceneId = this.scenes[0]?.id || null;
        }
        this.saveToStorage();
      } else if (evt.event === "SCENE_CREATED" && evt.payload) {
        const s = evt.payload as SceneItem;
        if (!this.scenes.some((item) => item.id === s.id)) {
          this.scenes = [...this.scenes, s].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          this.saveToStorage();
        }
      } else if (evt.event === "SCENE_UPDATED" && evt.payload) {
        const s = evt.payload as SceneItem;
        const idx = this.scenes.findIndex((item) => item.id === s.id);
        if (idx !== -1) {
          this.scenes[idx] = { ...this.scenes[idx], ...s };
          this.saveToStorage();
        }
      } else if (evt.event === "SCENE_DELETED" && evt.payload) {
        const payload = evt.payload as { id: string };
        this.scenes = this.scenes.filter((s) => s.id !== payload.id);
        if (this.activeSceneId === payload.id) {
          this.activeSceneId = this.scenes[0]?.id || null;
        }
        this.saveToStorage();
      }
    });
  }

  getScenesForChapter(chapterId: string): SceneItem[] {
    return this.scenes
      .filter((s) => s.chapterId === chapterId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  createChapter(params: CreateChapterParams): ChapterItem {
    const projectId =
      this.currentLoadedProjectId || projectStore.activeProjectId || "default";
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

    // Asynchronous Backend Write-Behind
    if (projectId && projectId !== "default") {
      apiClient
        .createChapter(projectId, {
          title: newChapter.title,
          synopsis: newChapter.synopsis,
          orderIndex: newChapter.orderIndex,
        })
        .then((res) => {
          if (res && res.data && res.data.id && res.data.id !== newChapter.id) {
            const oldId = newChapter.id;
            const newId = res.data.id;
            const idx = this.chapters.findIndex((c) => c.id === oldId);
            if (idx !== -1) {
              this.chapters[idx] = { ...this.chapters[idx], id: newId };
            }
            if (this.activeChapterId === oldId) {
              this.activeChapterId = newId;
            }
            this.scenes = this.scenes.map((s) =>
              s.chapterId === oldId ? { ...s, chapterId: newId } : s,
            );
            this.saveToStorage();
          }
        })
        .catch(() => {});
    }

    toastStore.success(`Chapter "${newChapter.title}" created.`);
    return newChapter;
  }

  updateChapter(id: string, updates: Partial<ChapterItem>): void {
    const target = this.chapters.find((c) => c.id === id);
    const projectId =
      target?.projectId ||
      this.currentLoadedProjectId ||
      projectStore.activeProjectId;

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

    // Asynchronous Backend Write-Behind
    if (projectId && projectId !== "default") {
      apiClient
        .updateChapter(projectId, id, {
          title: updates.title,
          synopsis: updates.synopsis,
          orderIndex: updates.orderIndex,
        })
        .catch(() => {});
    }
  }

  deleteChapter(id: string): void {
    const chapter = this.chapters.find((c) => c.id === id);
    const chapterTitle = chapter?.title || "Chapter";
    const projectId =
      chapter?.projectId ||
      this.currentLoadedProjectId ||
      projectStore.activeProjectId;

    this.chapters = this.chapters.filter((c) => c.id !== id);
    this.scenes = this.scenes.filter((s) => s.chapterId !== id);

    if (this.activeChapterId === id) {
      this.activeChapterId = this.chapters[0]?.id || null;
    }
    if (this.activeScene?.chapterId === id) {
      this.activeSceneId = this.scenes[0]?.id || null;
    }

    this.saveToStorage();

    // Asynchronous Backend Write-Behind
    if (projectId && projectId !== "default") {
      apiClient.deleteChapter(projectId, id).catch(() => {});
    }

    toastStore.success(`Deleted "${chapterTitle}" and its associated scenes.`);
  }

  createScene(params: CreateSceneParams): SceneItem {
    const projectId =
      this.currentLoadedProjectId || projectStore.activeProjectId || "default";
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

    // Asynchronous Backend Write-Behind
    if (projectId && projectId !== "default") {
      apiClient
        .createScene(projectId, {
          chapterId: newScene.chapterId,
          title: newScene.title,
          synopsis: newScene.synopsis,
          targetWordCount: newScene.targetWordCount,
          povCharacterId: newScene.povCharacterId,
          timelineSequenceNumber: newScene.timelineSequenceNumber,
          orderIndex: newScene.orderIndex,
        })
        .then((res) => {
          if (res && res.data && res.data.id && res.data.id !== newScene.id) {
            const oldId = newScene.id;
            const newId = res.data.id;
            const idx = this.scenes.findIndex((s) => s.id === oldId);
            if (idx !== -1) {
              this.scenes[idx] = { ...this.scenes[idx], id: newId };
            }
            if (this.activeSceneId === oldId) {
              this.activeSceneId = newId;
            }
            this.saveToStorage();
          }
        })
        .catch(() => {});
    }

    toastStore.success(`Scene "${newScene.title}" created.`);
    return newScene;
  }

  updateScene(id: string, updates: Partial<SceneItem>): void {
    const target = this.scenes.find((s) => s.id === id);
    const projectId =
      target?.projectId ||
      this.currentLoadedProjectId ||
      projectStore.activeProjectId;

    this.scenes = this.scenes.map((s) => {
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
    this.saveToStorage();

    // Asynchronous Backend Write-Behind
    if (projectId && projectId !== "default") {
      apiClient
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

  updateSceneContent(id: string, content: string): void {
    const target = this.scenes.find((s) => s.id === id);
    const projectId =
      target?.projectId ||
      this.currentLoadedProjectId ||
      projectStore.activeProjectId;
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

    // Asynchronous Backend Write-Behind
    if (projectId && projectId !== "default") {
      apiClient
        .updateScene(projectId, id, {
          proseContent: content,
          wordCount: words,
        })
        .catch(() => {});
    }
  }

  deleteScene(id: string): void {
    const scene = this.scenes.find((s) => s.id === id);
    const sceneTitle = scene?.title || "Scene";
    const projectId =
      scene?.projectId ||
      this.currentLoadedProjectId ||
      projectStore.activeProjectId;

    this.scenes = this.scenes.filter((s) => s.id !== id);
    if (this.activeSceneId === id) {
      this.activeSceneId = this.scenes[0]?.id || null;
    }

    this.saveToStorage();

    // Asynchronous Backend Write-Behind
    if (projectId && projectId !== "default") {
      apiClient.deleteScene(projectId, id).catch(() => {});
    }

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
    if (
      chapterScenes.length > 0 &&
      (!this.activeSceneId ||
        !chapterScenes.some((s) => s.id === this.activeSceneId))
    ) {
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
