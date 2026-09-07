<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Field from "$lib/components/ui/field.svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { worldStore } from "$lib/stores/worldStore.svelte";
  import { Sparkles, FolderPlus } from "lucide-svelte";

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

  function handleClose() {
    open = false;
    projectStore.closeCreateDialog();
    errorMsg = null;
    if (onClose) onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open && !projectStore.isCreateDialogOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  }

  function handleSubmit(e?: SubmitEvent) {
    if (e) e.preventDefault();
    if (!name.trim()) {
      errorMsg = "Project name is required.";
      return;
    }

    isSubmitting = true;
    errorMsg = null;

    try {
      const created = projectStore.createProject({
        name: name.trim(),
        genre: genre.trim() || undefined,
        description: description.trim() || undefined,
      });

      // Synchronize world store for this new project (starts clean)
      worldStore.setProject(created.id);

      // Reset form fields
      name = "";
      genre = "";
      description = "";
      handleClose();
    } catch (err: any) {
      errorMsg = err?.message || "Failed to create project.";
    } finally {
      isSubmitting = false;
    }
  }

  // Synchronize store dialog state with local bindable open
  $effect(() => {
    if (projectStore.isCreateDialogOpen) {
      open = true;
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open || projectStore.isCreateDialogOpen}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-project-title"
    aria-describedby="create-project-description"
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
        class="border-border bg-card p-4 sm:p-6 space-y-5 shadow-2xl max-h-[min(90dvh,750px)] overflow-y-auto"
      >
        <!-- Dialog Header -->
        <div class="flex items-start gap-3 border-b border-border/80 pb-3.5">
          <div class="p-2.5 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0 border border-primary/20">
            <FolderPlus class="w-5 h-5" />
          </div>
          <div>
            <h2 id="create-project-title" class="text-base sm:text-lg font-bold text-foreground leading-snug">
              Create New Novel Universe
            </h2>
            <p id="create-project-description" class="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Instantiate an isolated project workspace for your manuscript, dynamic lore schemas, entities, and timeline.
            </p>
          </div>
        </div>

        <!-- Form Content -->
        <form onsubmit={handleSubmit} class="space-y-4">
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

          <!-- Dialog Footer Actions -->
          <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-4 border-t border-border/80">
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
              <Sparkles class="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </div>
{/if}

