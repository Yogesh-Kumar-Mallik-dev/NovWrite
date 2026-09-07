<script lang="ts">
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { worldStore } from "$lib/stores/worldStore.svelte";
  import {
    Folder,
    FolderPlus,
    ChevronDown,
    Check,
    BookOpen,
    Plus,
    Pencil,
    Trash2,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

  interface Props {
    isMobile?: boolean;
    class?: string;
  }

  let { isMobile = false, class: className = "" }: Props = $props();

  function handleSelect(id: string) {
    projectStore.selectProject(id);
    worldStore.setProject(id);
  }

  function handleOpenCreate() {
    projectStore.openCreateDialog();
  }

  function handleOpenEdit() {
    projectStore.openEditDialog();
  }

  function handleOpenDelete() {
    projectStore.openDeleteDialog();
  }
</script>

{#if !projectStore.activeProject && projectStore.projects.length === 0}
  <!-- Zero Projects Empty State: Direct Create Action -->
  {#if isMobile}
    <button
      type="button"
      onclick={handleOpenCreate}
      class="w-full flex items-center justify-center gap-2 h-9 px-3 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors cursor-pointer {className}"
    >
      <Plus class="w-4 h-4" />
      <span>Create Project</span>
    </button>
  {:else}
    <button
      type="button"
      onclick={handleOpenCreate}
      class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-colors cursor-pointer shrink-0 {className}"
      aria-label="Create New Project"
    >
      <Plus class="w-3.5 h-3.5 shrink-0" />
      <span class="hidden xs:inline">Create Project</span>
      <span class="xs:hidden">New</span>
    </button>
  {/if}
{:else}
  <!-- Desktop / Header Dropdown Switcher -->
  {#if !isMobile}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/80 transition-colors cursor-pointer max-w-[130px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-[240px] shrink-0 {className}"
        aria-label="Switch Active Project"
      >
        <Folder class="w-3.5 h-3.5 text-primary shrink-0" />
        <span class="truncate font-semibold text-foreground">
          {projectStore.activeProject?.name || "Select Project"}
        </span>
        <ChevronDown class="w-3 h-3 text-muted-foreground/70 shrink-0 ml-0.5" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" class="w-64 p-1 bg-popover border-border text-foreground shadow-xl z-50">
        <DropdownMenu.Group>
          <DropdownMenu.GroupHeading class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-1">
            Novel Projects ({projectStore.projects.length})
          </DropdownMenu.GroupHeading>

          {#each projectStore.projects as proj}
            {@const isActive = proj.id === projectStore.activeProjectId}
            <DropdownMenu.Item
              onclick={() => handleSelect(proj.id)}
              class="flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer {isActive
                ? 'bg-primary/10 text-primary font-bold'
                : 'hover:bg-muted'}"
            >
              <div class="flex flex-col min-w-0 pr-2">
                <span class="truncate font-medium">{proj.name}</span>
                {#if proj.genre}
                  <span class="text-[10px] text-muted-foreground truncate">{proj.genre}</span>
                {/if}
              </div>
              {#if isActive}
                <Check class="w-3.5 h-3.5 text-primary shrink-0" />
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>

        <DropdownMenu.Separator class="my-1 bg-border" />

        {#if projectStore.activeProject}
          <DropdownMenu.Item
            onclick={handleOpenEdit}
            class="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-md cursor-pointer"
          >
            <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
            <span>Edit Project Settings...</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onclick={handleOpenDelete}
            class="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Delete Project...</span>
          </DropdownMenu.Item>
        {/if}

        <DropdownMenu.Item
          onclick={handleOpenCreate}
          class="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md cursor-pointer"
        >
          <FolderPlus class="w-3.5 h-3.5" />
          <span>New Novel Project...</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <!-- Mobile Drawer Project Card & Switcher -->
    <div class="p-2.5 rounded-lg bg-muted/40 border border-border/80 flex flex-col gap-1.5 {className}">
      <div class="flex items-center justify-between px-0.5">
        <span class="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80">Active Project</span>
        <div class="flex items-center gap-2">
          {#if projectStore.activeProject}
            <button
              type="button"
              onclick={handleOpenEdit}
              class="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
            >
              <Pencil class="w-3 h-3" />
              <span>Edit</span>
            </button>
          {/if}
          <button
            type="button"
            onclick={handleOpenCreate}
            class="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus class="w-3 h-3" />
            <span>New</span>
          </button>
        </div>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="w-full flex items-center justify-between h-8 px-2.5 rounded-md bg-card border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Folder class="w-3.5 h-3.5 text-primary shrink-0" />
            <span class="truncate font-semibold text-foreground">
              {projectStore.activeProject?.name || "No Project Selected"}
            </span>
          </div>
          <ChevronDown class="w-3 h-3 text-muted-foreground shrink-0" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Content class="w-[min(75vw,270px)] p-1 bg-popover border-border text-foreground shadow-xl z-50">
          <DropdownMenu.Group>
            <DropdownMenu.GroupHeading class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-1">
              Switch Project
            </DropdownMenu.GroupHeading>

            {#each projectStore.projects as proj}
              {@const isActive = proj.id === projectStore.activeProjectId}
              <DropdownMenu.Item
                onclick={() => handleSelect(proj.id)}
                class="flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer {isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'hover:bg-muted'}"
              >
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="truncate font-medium">{proj.name}</span>
                  {#if proj.genre}
                    <span class="text-[10px] text-muted-foreground truncate">{proj.genre}</span>
                  {/if}
                </div>
                {#if isActive}
                  <Check class="w-3.5 h-3.5 text-primary shrink-0" />
                {/if}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>

          <DropdownMenu.Separator class="my-1 bg-border" />

          {#if projectStore.activeProject}
            <DropdownMenu.Item
              onclick={handleOpenEdit}
              class="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-md cursor-pointer"
            >
              <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Edit Project Settings</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onclick={handleOpenDelete}
              class="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Delete Project...</span>
            </DropdownMenu.Item>
          {/if}

          <DropdownMenu.Item
            onclick={handleOpenCreate}
            class="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md cursor-pointer"
          >
            <FolderPlus class="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  {/if}
{/if}
