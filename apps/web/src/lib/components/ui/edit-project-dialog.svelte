<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Field from "$lib/components/ui/field.svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { Pencil, Check, Trash2 } from "lucide-svelte";

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = $bindable(false), onClose }: Props = $props();

  let name = $state("");
  let genre = $state("");
  let description = $state("");
  let errorMsg = $state<string | null>(null);
  let isSubmitting = $state(false);

  // Sync form inputs with active/editing project
  $effect(() => {
    const proj = projectStore.editingProject;
    if (proj && (open || projectStore.isEditDialogOpen)) {
      name = proj.name || "";
      genre = proj.genre || "";
      description = proj.description || "";
      errorMsg = null;
    }
  });

  // Synchronize store dialog state with local bindable open
  $effect(() => {
    if (projectStore.isEditDialogOpen) {
      open = true;
    }
  });

  function handleClose() {
    open = false;
    projectStore.closeEditDialog();
    errorMsg = null;
    if (onClose) onClose();
  }

  function handleDeleteClick() {
    const proj = projectStore.editingProject;
    if (!proj) return;
    const targetId = proj.id;
    handleClose();
    projectStore.openDeleteDialog(targetId);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open && !projectStore.isEditDialogOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  }

  function handleSubmit(e?: SubmitEvent) {
    if (e) e.preventDefault();
    const proj = projectStore.editingProject;
    if (!proj) {
      errorMsg = "No project selected to edit.";
      return;
    }

    if (!name.trim()) {
      errorMsg = "Project name is required.";
      return;
    }

    isSubmitting = true;
    errorMsg = null;

    try {
      projectStore.updateProject(proj.id, {
        name: name.trim(),
        genre: genre.trim() || undefined,
        description: description.trim() || undefined,
      });

      handleClose();
    } catch (err: any) {
      errorMsg = err?.message || "Failed to update project.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open || projectStore.isEditDialogOpen}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-project-title"
    aria-describedby="edit-project-description"
  >
    <!-- Backdrop Click to Close -->
    <button
      type="button"
      class="fixed inset-0 cursor-default bg-transparent border-0"
      onclick={handleClose}
      tabindex="-1"
      aria-hidden="true"
    ></button>

    <div
      transition:scale={{ start: 0.96, duration: 150 }}
      class="relative z-10 w-full max-w-lg"
    >
      <Card
        class="border-border bg-card p-4 sm:p-6 shadow-2xl max-h-[min(90dvh,750px)] flex flex-col overflow-hidden"
      >
        <!-- Dialog Header -->
        <div class="flex items-start gap-3 border-b border-border/80 pb-3.5 shrink-0">
          <div class="p-2.5 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0 border border-primary/20">
            <Pencil class="w-5 h-5" />
          </div>
          <div>
            <h2 id="edit-project-title" class="text-base sm:text-lg font-bold text-foreground leading-snug">
              Edit Novel Project Settings
            </h2>
            <p id="edit-project-description" class="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Update title, genre, universe classification, and synopsis for this workspace.
            </p>
          </div>
        </div>

        <!-- Form Content (Scrollable) -->
        <form onsubmit={handleSubmit} class="flex flex-col flex-1 min-h-0 overflow-hidden mt-4">
          <div class="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
            {#if errorMsg}
              <div class="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {errorMsg}
              </div>
            {/if}

            <!-- Project Title -->
            <Field label="Novel / Project Title" description="The official title or working codename for your novel universe.">
              <input
                type="text"
                bind:value={name}
                placeholder="e.g. The Celestial Ascension or Tales of Eldoria"
                class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground/60"
                required
              />
            </Field>

            <!-- Genre & Universe Setting Input -->
            <Field label="Genre & Universe Setting" description="Defines the thematic tone and default progression context.">
              <input
                type="text"
                bind:value={genre}
                placeholder="e.g. Xianxia / Cultivation, Dark Fantasy, Sci-Fi..."
                class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground/60"
              />
            </Field>

            <!-- Universe Synopsis / Description -->
            <Field label="Universe Synopsis & Description" description="Optional summary of premise, cosmology, and key themes.">
              <textarea
                bind:value={description}
                rows="3"
                placeholder="A brief overview of the world setting, major conflicts, and foundational lore..."
                class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground/60 resize-y"
              ></textarea>
            </Field>

            <!-- Danger Zone: Project Deletion -->
            <div class="p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div class="space-y-0.5">
                <span class="text-xs font-bold text-destructive block">Danger Zone</span>
                <span class="text-[11px] text-muted-foreground block">Permanently erase this novel universe, entities, and timeline.</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={handleDeleteClick}
                class="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5 shrink-0 w-full sm:w-auto"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Delete Project...</span>
              </Button>
            </div>
          </div>

          <!-- Dialog Sticky Footer Actions -->
          <div class="sticky bottom-0 bg-card/95 backdrop-blur-md pt-3 mt-2 border-t border-border/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={handleClose}
              class="h-9 px-4 text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              class="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 w-full sm:w-auto"
            >
              <Check class="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </div>
{/if}
