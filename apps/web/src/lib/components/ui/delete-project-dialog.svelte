<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Checkbox from "$lib/components/ui/checkbox.svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { worldStore } from "$lib/stores/worldStore.svelte";
  import {
    AlertTriangle,
    AlertOctagon,
    Trash2,
    ArrowRight,
    ArrowLeft,
    ShieldAlert,
  } from "lucide-svelte";

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = $bindable(false), onClose }: Props = $props();

  let step = $state<1 | 2 | 3>(1);
  let acknowledged = $state(false);
  let confirmationInput = $state("");
  let isDeleting = $state(false);
  let errorMsg = $state<string | null>(null);

  // Derived target project being deleted
  const targetProject = $derived(projectStore.deletingProject);

  // Synchronize store dialog state with local bindable open
  $effect(() => {
    if (projectStore.isDeleteDialogOpen) {
      open = true;
      step = 1;
      acknowledged = false;
      confirmationInput = "";
      errorMsg = null;
    }
  });

  function handleClose() {
    open = false;
    projectStore.closeDeleteDialog();
    step = 1;
    acknowledged = false;
    confirmationInput = "";
    errorMsg = null;
    if (onClose) onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open && !projectStore.isDeleteDialogOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  }

  function handleNextStep() {
    if (step === 1) {
      step = 2;
    } else if (step === 2) {
      if (!acknowledged) {
        errorMsg = "You must acknowledge the permanent data loss to proceed.";
        return;
      }
      errorMsg = null;
      step = 3;
    }
  }

  function handlePrevStep() {
    if (step === 3) {
      step = 2;
    } else if (step === 2) {
      step = 1;
    }
  }

  function handleFinalDelete() {
    const proj = targetProject;
    if (!proj) {
      errorMsg = "No project selected for deletion.";
      return;
    }

    if (confirmationInput.trim() !== proj.name.trim()) {
      errorMsg = "The entered project name does not match.";
      return;
    }

    isDeleting = true;
    errorMsg = null;

    try {
      const deletedId = proj.id;
      // 1. Delete world data for this project
      worldStore.deleteProjectData(deletedId);
      // 2. Delete project entry from project store
      projectStore.deleteProject(deletedId);
      // 3. Switch world store to new active project if exists
      if (projectStore.activeProjectId) {
        worldStore.setProject(projectStore.activeProjectId);
      } else {
        worldStore.clearState();
      }

      handleClose();
    } catch (err: any) {
      errorMsg = err?.message || "Failed to delete project.";
    } finally {
      isDeleting = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open || projectStore.isDeleteDialogOpen}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-dialog-title"
    aria-describedby="delete-dialog-description"
  >
    <!-- Backdrop Click to Close / Abort -->
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
        class="border-destructive/40 bg-card p-4 sm:p-6 shadow-2xl max-h-[min(90dvh,750px)] flex flex-col overflow-hidden"
      >
        <!-- Step Indicator Header -->
        <div class="flex items-center justify-between border-b border-border/80 pb-3 shrink-0">
          <div class="flex items-center gap-2">
            {#if step === 1}
              <div class="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <AlertTriangle class="w-5 h-5" />
              </div>
            {:else if step === 2}
              <div class="p-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                <AlertOctagon class="w-5 h-5" />
              </div>
            {:else}
              <div class="p-2 rounded-lg bg-destructive/20 text-destructive border border-destructive/30 shrink-0">
                <Trash2 class="w-5 h-5" />
              </div>
            {/if}
            <div>
              <div class="text-[10px] uppercase font-bold tracking-wider text-destructive">
                Confirmation Warning {step} of 3
              </div>
              <h2 id="delete-dialog-title" class="text-base sm:text-lg font-bold text-foreground leading-snug">
                {#if step === 1}
                  Scope of Destruction Warning
                {:else if step === 2}
                  Irreversible Loss Acknowledgment
                {:else}
                  Final Deletion Verification
                {/if}
              </h2>
            </div>
          </div>

          <!-- Step Dots -->
          <div class="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span class="w-2.5 h-2.5 rounded-full {step >= 1 ? 'bg-destructive' : 'bg-muted'}"></span>
            <span class="w-2.5 h-2.5 rounded-full {step >= 2 ? 'bg-destructive' : 'bg-muted'}"></span>
            <span class="w-2.5 h-2.5 rounded-full {step >= 3 ? 'bg-destructive' : 'bg-muted'}"></span>
          </div>
        </div>

        {#if errorMsg}
          <div class="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs mt-3 shrink-0">
            {errorMsg}
          </div>
        {/if}

        <!-- STEP 1: IMPACT ASSESSMENT -->
        {#if step === 1}
          <div class="flex flex-col flex-1 min-h-0 overflow-hidden mt-4">
            <div class="space-y-4 text-xs text-muted-foreground leading-relaxed overflow-y-auto flex-1 pr-1 pb-2">
              <p id="delete-dialog-description">
                You are preparing to delete the novel universe project
                <strong class="text-foreground font-semibold">"{targetProject?.name || 'Untitled Project'}"</strong>.
              </p>

              <div class="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-2">
                <div class="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldAlert class="w-4 h-4 text-amber-500 shrink-0" />
                  <span>The following assets will be permanently deleted:</span>
                </div>
                <ul class="space-y-1.5 pl-5 list-disc text-muted-foreground">
                  <li><strong class="text-foreground">Blueprints & Archetypes:</strong> All dynamic entity classes and second-class value types.</li>
                  <li><strong class="text-foreground">Universe Entities:</strong> All characters, relics, factions, and relationship graphs.</li>
                  <li><strong class="text-foreground">Causal Timeline & Events:</strong> All recorded narrative events, bitemporal branches, and AST formulas.</li>
                  <li><strong class="text-foreground">Invariant Rules & Audits:</strong> All continuity rules, active constraints, and scene audit logs.</li>
                </ul>
              </div>

              <p class="text-[11px] text-muted-foreground/80">
                Please review your decision carefully before proceeding to the irreversibility acknowledgment.
              </p>
            </div>

            <!-- Step 1 Footer -->
            <div class="sticky bottom-0 bg-card/95 backdrop-blur-md pt-3 mt-2 border-t border-border/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={handleClose}
                class="h-9 px-4 text-xs w-full sm:w-auto"
              >
                Cancel / Keep Project
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onclick={handleNextStep}
                class="h-9 px-4 text-xs font-semibold gap-1.5 w-full sm:w-auto"
              >
                <span>I Understand the Scope</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

        <!-- STEP 2: IRREVERSIBILITY ACKNOWLEDGMENT -->
        {:else if step === 2}
          <div class="flex flex-col flex-1 min-h-0 overflow-hidden mt-4">
            <div class="space-y-4 text-xs text-muted-foreground leading-relaxed overflow-y-auto flex-1 pr-1 pb-2">
              <div class="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive space-y-1.5">
                <div class="font-bold text-sm flex items-center gap-1.5">
                  <AlertOctagon class="w-4 h-4 shrink-0" />
                  <span>Zero Recovery Guarantee</span>
                </div>
                <p class="text-xs text-destructive/90 leading-relaxed">
                  This deletion is <strong>permanent and immediate</strong>. NovWrite does not maintain a trash bin or backup archives for deleted projects. Once confirmed, all data will be purged.
                </p>
              </div>

              <!-- Explicit Checkbox Acknowledgment -->
              <label class="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card hover:bg-muted/40 cursor-pointer transition-colors select-none">
                <Checkbox
                  bind:checked={acknowledged}
                  class="mt-0.5 shrink-0"
                />
                <div class="space-y-0.5">
                  <span class="font-semibold text-foreground text-xs block">
                    I explicitly acknowledge permanent, unrecoverable data loss
                  </span>
                  <span class="text-[11px] text-muted-foreground block leading-relaxed">
                    I understand that all universe lore, entity state trees, formulas, and manuscript records for "{targetProject?.name}" will be completely destroyed.
                  </span>
                </div>
              </label>
            </div>

            <!-- Step 2 Footer -->
            <div class="sticky bottom-0 bg-card/95 backdrop-blur-md pt-3 mt-2 border-t border-border/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={handlePrevStep}
                class="h-9 px-4 text-xs gap-1 w-full sm:w-auto"
              >
                <ArrowLeft class="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>
              <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onclick={handleClose}
                  class="h-9 px-4 text-xs w-full sm:w-auto"
                >
                  Cancel / Abort
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={!acknowledged}
                  onclick={handleNextStep}
                  class="h-9 px-4 text-xs font-semibold gap-1.5 w-full sm:w-auto"
                >
                  <span>Proceed to Final Verification</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

        <!-- STEP 3: FINAL NAME VERIFICATION -->
        {:else if step === 3}
          <div class="flex flex-col flex-1 min-h-0 overflow-hidden mt-4">
            <div class="space-y-4 text-xs text-muted-foreground leading-relaxed overflow-y-auto flex-1 pr-1 pb-2">
              <p>
                To execute the permanent deletion of this novel universe, please type the exact project title below:
              </p>

              <div class="p-2.5 bg-muted/60 border border-border rounded-md text-center">
                <span class="select-all font-mono font-bold text-sm text-foreground">
                  {targetProject?.name || ""}
                </span>
              </div>

              <div class="space-y-1.5">
                <label for="confirm-project-name" class="text-xs font-semibold text-foreground block">
                  Type Project Title to Confirm:
                </label>
                <input
                  id="confirm-project-name"
                  type="text"
                  bind:value={confirmationInput}
                  placeholder="Enter exact project title..."
                  class="w-full px-3 py-2 text-sm bg-background border border-destructive/50 rounded-md focus:outline-hidden focus:ring-2 focus:ring-destructive focus:border-transparent text-foreground placeholder:text-muted-foreground/60"
                  autocomplete="off"
                />
              </div>

              <p class="text-[11px] text-muted-foreground">
                The delete button will unlock only after the typed title matches identically.
              </p>
            </div>

            <!-- Step 3 Footer -->
            <div class="sticky bottom-0 bg-card/95 backdrop-blur-md pt-3 mt-2 border-t border-border/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={handlePrevStep}
                class="h-9 px-4 text-xs gap-1 w-full sm:w-auto"
              >
                <ArrowLeft class="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>
              <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onclick={handleClose}
                  class="h-9 px-4 text-xs w-full sm:w-auto"
                >
                  Cancel / Abort
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting || confirmationInput.trim() !== (targetProject?.name || '').trim()}
                  onclick={handleFinalDelete}
                  class="h-9 px-4 text-xs font-semibold gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>Permanently Delete Universe</span>
                </Button>
              </div>
            </div>
          </div>
        {/if}
      </Card>
    </div>
  </div>
{/if}
