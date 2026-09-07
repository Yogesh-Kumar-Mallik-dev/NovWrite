<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Field from "$lib/components/ui/field.svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { worldStore } from "$lib/stores/worldStore.svelte";
  import { Sparkles, FolderPlus, X, Layers, FileCode } from "lucide-svelte";
  import * as Select from "$lib/components/ui/select";

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = $bindable(false), onClose }: Props = $props();

  let name = $state("");
  let genre = $state("Xianxia / Cultivation");
  let description = $state("");
  let starterTemplate = $state<"clean" | "starter">("starter");
  let errorMsg = $state<string | null>(null);
  let isSubmitting = $state(false);

  const GENRE_OPTIONS = [
    { value: "Xianxia / Cultivation", label: "Xianxia / Cultivation" },
    { value: "High Fantasy / LitRPG", label: "High Fantasy / LitRPG" },
    { value: "Sci-Fi / Space Opera", label: "Sci-Fi / Space Opera" },
    { value: "Urban Fantasy / Cyberpunk", label: "Urban Fantasy / Cyberpunk" },
    { value: "Grimdark / Dark Fantasy", label: "Grimdark / Dark Fantasy" },
    { value: "Mystery / Thriller", label: "Mystery / Thriller" },
    { value: "Historical / Realism", label: "Historical / Realism" },
    { value: "Other", label: "Other / Custom" },
  ];

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
        genre: genre.trim(),
        description: description.trim(),
        starterTemplate,
      });

      // Synchronize world store for this new project
      worldStore.setProject(created.id, starterTemplate);

      // Reset form fields
      name = "";
      description = "";
      genre = "Xianxia / Cultivation";
      starterTemplate = "starter";
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
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
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

    <Card
      class="relative z-10 border-border bg-card max-w-lg w-full p-4 sm:p-6 space-y-5 shadow-2xl max-h-[min(90dvh,750px)] overflow-y-auto animate-in zoom-in-95 duration-150"
    >
      <!-- Dialog Header -->
      <div class="flex items-start justify-between gap-3 border-b border-border/80 pb-3.5">
        <div class="flex items-start gap-3">
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

        <button
          type="button"
          onclick={handleClose}
          class="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer -mr-2 -mt-2"
          aria-label="Close dialog"
        >
          <X class="w-4 h-4" />
        </button>
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

        <!-- Genre Selection -->
        <Field label="Genre & Universe Setting" description="Defines the thematic tone and default progression tropes.">
          <Select.Root
            type="single"
            value={genre}
            onValueChange={(val) => {
              if (val) genre = val;
            }}
          >
            <Select.Trigger class="w-full bg-background border-border text-foreground text-sm">
              <span>{genre}</span>
            </Select.Trigger>
            <Select.Content class="bg-popover border-border text-foreground max-h-56">
              {#each GENRE_OPTIONS as opt}
                <Select.Item value={opt.value} label={opt.label}>
                  {opt.label}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
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

        <!-- Starter Architecture Options -->
        <div class="space-y-2 pt-1">
          <span class="text-xs font-semibold text-foreground block">Initial Blueprint Architecture</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- Starter Template Option -->
            <button
              type="button"
              onclick={() => (starterTemplate = "starter")}
              class="flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer {starterTemplate ===
              'starter'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card hover:bg-muted/50'}"
            >
              <div class="flex items-center gap-2 text-xs font-bold text-foreground">
                <Layers class="w-4 h-4 text-primary" />
                <span>Starter Archetypes</span>
              </div>
              <p class="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Preloads standard Character & Item/Relic blueprints with power formulas.
              </p>
            </button>

            <!-- Clean Slate Option -->
            <button
              type="button"
              onclick={() => (starterTemplate = "clean")}
              class="flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer {starterTemplate ===
              'clean'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card hover:bg-muted/50'}"
            >
              <div class="flex items-center gap-2 text-xs font-bold text-foreground">
                <FileCode class="w-4 h-4 text-primary" />
                <span>Clean Slate</span>
              </div>
              <p class="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Starts 100% empty with zero schema bloat. Full custom architecture.
              </p>
            </button>
          </div>
        </div>

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
{/if}
