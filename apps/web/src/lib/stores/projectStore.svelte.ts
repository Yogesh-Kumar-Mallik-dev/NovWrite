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
}

const PROJECTS_STORAGE_KEY = "novwrite_projects_v1";
const ACTIVE_PROJECT_STORAGE_KEY = "novwrite_active_project_id_v1";

export class ProjectStateStore {
  projects = $state<ProjectItem[]>([]);
  activeProjectId = $state<string | null>(null);
  isLoaded = $state<boolean>(false);
  isCreateDialogOpen = $state<boolean>(false);
  isEditDialogOpen = $state<boolean>(false);
  editingProjectId = $state<string | null>(null);
  isDeleteDialogOpen = $state<boolean>(false);
  deletingProjectId = $state<string | null>(null);

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
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(PROJECTS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    }
  }
}

export const projectStore = new ProjectStateStore();
