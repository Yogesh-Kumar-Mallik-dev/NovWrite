/**
 * @file projectStore.svelte.ts
 * @description Svelte 5 Runes reactive store for Creative Novel Projects.
 * Block Standard: BLOCK_PROJECT_STORE_RUNE_001
 */

import { toastStore } from "./toastStore.svelte";

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  genre?: string;
  starterTemplate?: "clean" | "starter";
}

const PROJECTS_STORAGE_KEY = "novwrite_projects_v1";
const ACTIVE_PROJECT_STORAGE_KEY = "novwrite_active_project_id_v1";

export class ProjectStateStore {
  projects = $state<ProjectItem[]>([]);
  activeProjectId = $state<string | null>(null);
  isLoaded = $state<boolean>(false);
  isCreateDialogOpen = $state<boolean>(false);

  // Pure derived getter for currently active project
  activeProject = $derived.by(() => {
    if (!this.activeProjectId) return null;
    return this.projects.find((p) => p.id === this.activeProjectId) || null;
  });

  constructor() {
    this.loadFromStorage();
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

  createProject(params: CreateProjectParams): ProjectItem {
    const name = params.name.trim();
    if (!name) {
      throw new Error("Project name is required.");
    }

    const newProject: ProjectItem = {
      id: `proj-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      name,
      description: params.description?.trim() || "",
      genre: params.genre?.trim() || "General Fiction",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects = [newProject, ...this.projects];
    this.activeProjectId = newProject.id;
    this.saveToStorage();

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

    this.projects[idx] = {
      ...this.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
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
    toastStore.info(`Project "${deleted.name}" removed.`);
    return true;
  }

  openCreateDialog(): void {
    this.isCreateDialogOpen = true;
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
  }

  clearAllProjects(): void {
    this.projects = [];
    this.activeProjectId = null;
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(PROJECTS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    }
  }
}

export const projectStore = new ProjectStateStore();
