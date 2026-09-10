/**
 * @file projectStore.svelte.ts
 * @description Svelte 5 Runes reactive store for Creative Novel Projects with optimistic backend synchronization.
 * Block Standard: BLOCK_PROJECT_STORE_RUNE_001
 */

import { toastStore } from "./toastStore.svelte";
import { apiClient } from "../api/apiClient";
import {
  generateProjectId,
  validateProjectInput,
} from "../engine/projectEngine";

import type { ProjectItem, CreateProjectParams } from "@novwrite/bridge";

export type { ProjectItem, CreateProjectParams };

const PROJECTS_STORAGE_KEY = "novwrite_projects_v1";
const ACTIVE_PROJECT_STORAGE_KEY = "novwrite_active_project_id_v1";

export class ProjectStateStore {
  projects = $state<ProjectItem[]>([]);
  activeProjectId = $state<string | null>(null);
  isLoaded = $state<boolean>(false);
  isSyncing = $state<boolean>(false);
  isCreateDialogOpen = $state<boolean>(false);
  isEditDialogOpen = $state<boolean>(false);
  editingProjectId = $state<string | null>(null);
  isDeleteDialogOpen = $state<boolean>(false);
  deletingProjectId = $state<string | null>(null);
  private unsubscribeSSE: (() => void) | null = null;

  // Pure derived getter for currently active project
  activeProject = $derived.by(() => {
    if (!this.activeProjectId) return null;
    return this.projects.find((p) => p.id === this.activeProjectId) || null;
  });

  // Pure derived getter for currently edited project
  editingProject = $derived.by(() => {
    const targetId = this.editingProjectId || this.activeProjectId;
    if (!targetId) return null;
    return this.projects.find((p) => p.id === targetId) || null;
  });

  // Pure derived getter for currently deleting project
  deletingProject = $derived.by(() => {
    const targetId = this.deletingProjectId || this.activeProjectId;
    if (!targetId) return null;
    return this.projects.find((p) => p.id === targetId) || null;
  });

  constructor() {
    this.loadFromStorage();
    if (typeof window !== "undefined") {
      this.syncWithBackend();
      this.initSSEListener();
    }
  }

  loadFromStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      this.isLoaded = true;
      return;
    }
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.projects = parsed;
        }
      }

      const savedActiveId = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
      if (savedActiveId && this.projects.some((p) => p.id === savedActiveId)) {
        this.activeProjectId = savedActiveId;
      } else if (this.projects.length > 0) {
        this.activeProjectId = this.projects[0].id;
      } else {
        this.activeProjectId = null;
      }
    } catch (e) {
      console.warn(
        "[ProjectStore] Failed to load projects from localStorage:",
        e,
      );
    } finally {
      this.isLoaded = true;
    }
  }

  saveToStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(this.projects));
      if (this.activeProjectId) {
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, this.activeProjectId);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
      }
    } catch (e) {
      console.warn(
        "[ProjectStore] Failed to save projects to localStorage:",
        e,
      );
    }
  }

  /**
   * Hydrates projects from Go API backend (:8080) and reconciles with local storage.
   */
  async syncWithBackend(): Promise<void> {
    if (typeof window === "undefined") return;
    this.isSyncing = true;
    try {
      const resp = await apiClient.listProjects({ pageSize: 100 });
      if (resp && resp.data) {
        // Merge backend projects into local projects
        const backendMap = new Map<string, ProjectItem>();
        for (const bp of resp.data) {
          backendMap.set(bp.id, {
            id: bp.id,
            name: bp.name,
            description: bp.description || "",
            genre: bp.genre || "General Fiction",
            createdAt: bp.createdAt || new Date().toISOString(),
            updatedAt: bp.updatedAt || new Date().toISOString(),
          });
        }

        // Combine unique local-only and backend projects
        const merged: ProjectItem[] = [];
        const seenIds = new Set<string>();

        // Add backend items first
        for (const bp of backendMap.values()) {
          merged.push(bp);
          seenIds.add(bp.id);
        }

        // Add local-only items
        for (const lp of this.projects) {
          if (!seenIds.has(lp.id)) {
            merged.push(lp);
            seenIds.add(lp.id);
          }
        }

        this.projects = merged;
        if (!this.activeProjectId && this.projects.length > 0) {
          this.activeProjectId = this.projects[0].id;
        }
        this.saveToStorage();
      }
    } catch {
      // Backend unreachable or offline mode; cleanly use local cache
    } finally {
      this.isSyncing = false;
    }
  }

  private initSSEListener(): void {
    if (this.unsubscribeSSE) {
      this.unsubscribeSSE();
    }
    this.unsubscribeSSE = apiClient.subscribeEvents(undefined, (evt) => {
      if (evt.event === "PROJECT_CREATED" && evt.payload) {
        const p = evt.payload as ProjectItem;
        if (!this.projects.some((item) => item.id === p.id)) {
          this.projects = [p, ...this.projects];
          this.saveToStorage();
        }
      } else if (evt.event === "PROJECT_UPDATED" && evt.payload) {
        const p = evt.payload as ProjectItem;
        const idx = this.projects.findIndex((item) => item.id === p.id);
        if (idx !== -1) {
          this.projects[idx] = { ...this.projects[idx], ...p };
          this.saveToStorage();
        }
      } else if (evt.event === "PROJECT_DELETED" && evt.payload) {
        const p = evt.payload as { id: string };
        const idx = this.projects.findIndex((item) => item.id === p.id);
        if (idx !== -1) {
          this.projects.splice(idx, 1);
          if (this.activeProjectId === p.id) {
            this.activeProjectId =
              this.projects.length > 0 ? this.projects[0].id : null;
          }
          this.saveToStorage();
        }
      }
    });
  }

  createProject(params: CreateProjectParams): ProjectItem {
    const validation = validateProjectInput(params);
    if (!validation.valid || !validation.sanitized) {
      const firstError =
        Object.values(validation.errors)[0] || "Invalid project input.";
      throw new Error(firstError);
    }

    const newProject: ProjectItem = {
      id: generateProjectId(),
      name: validation.sanitized.name,
      description: validation.sanitized.description,
      genre: validation.sanitized.genre,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic Local State Update
    this.projects = [newProject, ...this.projects];
    this.activeProjectId = newProject.id;
    this.saveToStorage();

    // Asynchronous Backend Write-Behind
    apiClient
      .createProject({
        name: newProject.name,
        description: newProject.description,
        genre: newProject.genre,
      })
      .then((res) => {
        if (res && res.data && res.data.id) {
          // Reconcile ID from backend if needed
          const idx = this.projects.findIndex((p) => p.id === newProject.id);
          if (idx !== -1) {
            this.projects[idx] = { ...this.projects[idx], id: res.data.id };
            if (this.activeProjectId === newProject.id) {
              this.activeProjectId = res.data.id;
            }
            this.saveToStorage();
          }
        }
      })
      .catch(() => {
        // Retain optimistic local copy if offline
      });

    toastStore.success(`Project "${newProject.name}" created successfully.`);
    return newProject;
  }

  selectProject(projectId: string): boolean {
    const found = this.projects.find((p) => p.id === projectId);
    if (!found) return false;
    this.activeProjectId = projectId;
    this.saveToStorage();
    return true;
  }

  updateProject(
    projectId: string,
    updates: Partial<Pick<ProjectItem, "name" | "description" | "genre">>,
  ): boolean {
    const idx = this.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return false;

    const trimmedName =
      updates.name !== undefined ? updates.name.trim() : undefined;
    if (trimmedName !== undefined && !trimmedName) {
      throw new Error("Project name cannot be empty.");
    }

    this.projects[idx] = {
      ...this.projects[idx],
      ...(trimmedName !== undefined ? { name: trimmedName } : {}),
      ...(updates.description !== undefined
        ? { description: updates.description.trim() }
        : {}),
      ...(updates.genre !== undefined ? { genre: updates.genre.trim() } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();

    // Asynchronous Backend Write-Behind
    apiClient
      .updateProject(projectId, {
        name: trimmedName,
        description: updates.description,
        genre: updates.genre,
      })
      .catch(() => {
        // Retain optimistic local copy if offline
      });

    toastStore.success("Project settings updated.");
    return true;
  }

  deleteProject(projectId: string): boolean {
    const idx = this.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return false;

    const [deleted] = this.projects.splice(idx, 1);
    if (this.activeProjectId === projectId) {
      this.activeProjectId =
        this.projects.length > 0 ? this.projects[0].id : null;
    }
    this.saveToStorage();

    // Asynchronous Backend Write-Behind
    apiClient.deleteProject(projectId).catch(() => {
      // Retain optimistic local deletion if offline
    });

    toastStore.info(`Project "${deleted.name}" removed.`);
    return true;
  }

  openCreateDialog(): void {
    this.isCreateDialogOpen = true;
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
  }

  openEditDialog(projectId?: string): void {
    this.editingProjectId = projectId || this.activeProjectId;
    this.isEditDialogOpen = true;
  }

  closeEditDialog(): void {
    this.isEditDialogOpen = false;
    this.editingProjectId = null;
  }

  openDeleteDialog(projectId?: string): void {
    this.deletingProjectId = projectId || this.activeProjectId;
    this.isDeleteDialogOpen = true;
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen = false;
    this.deletingProjectId = null;
  }

  clearAllProjects(): void {
    this.projects = [];
    this.activeProjectId = null;
    this.editingProjectId = null;
    this.deletingProjectId = null;
    this.isEditDialogOpen = false;
    this.isCreateDialogOpen = false;
    this.isDeleteDialogOpen = false;
    if (this.unsubscribeSSE) {
      this.unsubscribeSSE();
      this.unsubscribeSSE = null;
    }
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(PROJECTS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    }
  }
}

export const projectStore = new ProjectStateStore();
