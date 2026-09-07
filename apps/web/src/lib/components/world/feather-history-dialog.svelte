<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import {
    History,
    GitBranch,
    RotateCcw,
    Sparkles,
    Calendar,
    Clock,
    Tag,
    Layers,
    FileEdit,
    AlertCircle,
    Check,
    ChevronRight,
    ArrowRight,
    Sliders,
  } from 'lucide-svelte';
  import {
    worldStore,
    type EntityItem,
    type EntityRevision,
    type RevisionType,
    type BitemporalEntityState,
  } from '$lib/stores/worldStore.svelte';
  import { Button, ConfirmDialog } from '$lib/components/ui';
  import { toast } from '$lib/stores/toastStore.svelte';

  let {
    open = $bindable(false),
    entityId,
    onRevert,
  }: {
    open: boolean;
    entityId: string;
    onRevert?: (restored: EntityItem) => void;
  } = $props();

  const entity = $derived(worldStore.getEntity(entityId));
  const revisions = $derived(worldStore.getEntityRevisions(entityId));
  const timelineEvents = $derived(
    worldStore.getTimelineEvents('narrative').filter((ev) =>
      ev.effects.some(
        (eff) =>
          eff.targetEntityId === entityId ||
          (entity && eff.entityName === entity.name)
      )
    )
  );

  let selectedRevisionId = $state<string | undefined>(undefined);
  let targetSeqNumber = $state<number>(0);
  let showRevertConfirm = $state(false);
  let revisionToRevert = $state<EntityRevision | null>(null);
  let mobileTab = $state<'revisions' | 'coordinates'>('revisions');

  // Initialize selected revision to latest when opened
  $effect(() => {
    if (open && revisions.length > 0 && !selectedRevisionId) {
      selectedRevisionId = revisions[revisions.length - 1].id;
    }
  });

  const activeRevision = $derived(
    revisions.find((r) => r.id === selectedRevisionId) ||
      (revisions.length > 0 ? revisions[revisions.length - 1] : null)
  );

  const bitemporalState = $derived<BitemporalEntityState | undefined>(
    entity
      ? worldStore.resolveEntityAtCoordinate(
          entityId,
          targetSeqNumber,
          selectedRevisionId
        )
      : undefined
  );

  const maxSeq = $derived(
    timelineEvents.length > 0
      ? Math.max(...timelineEvents.map((e) => e.narrativeSequenceNumber)) + 10
      : 50
  );

  function getRevisionTypeBadge(type: RevisionType) {
    switch (type) {
      case 'TYPO_FIX':
        return {
          label: 'Typo / Label Fix',
          class: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        };
      case 'BASELINE_EDIT':
        return {
          label: 'Baseline Attribute Edit',
          class: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
      case 'RETROACTIVE_PLOT_FIX':
        return {
          label: 'Retroactive Plot Fix',
          class: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        };
      case 'REVERT':
        return {
          label: 'Historical Revert',
          class: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        };
      default:
        return {
          label: type,
          class: 'bg-muted text-muted-foreground border-border',
        };
    }
  }

  function handleRevertClick(rev: EntityRevision) {
    revisionToRevert = rev;
    showRevertConfirm = true;
  }

  function confirmRevert() {
    if (!revisionToRevert) return;
    const result = worldStore.revertEntityRevision(
      entityId,
      revisionToRevert.id,
      `Reverted to Rev #${revisionToRevert.revisionNumber}`
    );
    if (result) {
      toast.success(
        `Successfully restored ${entity?.name || 'entity'} to Revision #${revisionToRevert.revisionNumber}`
      );
      selectedRevisionId = result.revision.id;
      if (onRevert) onRevert(result.restoredEntity);
    }
    showRevertConfirm = false;
    revisionToRevert = null;
  }
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && open) open = false; }} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
    transition:fade={{ duration: 150 }}
  >
    <button
      type="button"
      tabindex="-1"
      aria-label="Close modal overlay"
      onclick={() => (open = false)}
      class="fixed inset-0 cursor-default bg-transparent border-0"
    ></button>
    <div
      class="w-full max-w-5xl h-[min(90dvh,850px)] max-h-[95dvh] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden relative z-10"
      transition:scale={{ start: 0.96, duration: 150 }}
    >
      <!-- Dialog Header -->
      <div
        class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-card/60 gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <GitBranch class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base sm:text-lg font-bold tracking-tight truncate">
                Dual-Axis Feather History
              </h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium truncate max-w-[160px]">
                {entity?.name}
              </span>
            </div>
            <p class="text-xs text-muted-foreground hidden sm:block truncate">
              Explore orthogonal Plot Evolution (X-Axis) and Authorial Revision Barbs (Y-Axis) with infinite reversibility.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onclick={() => (open = false)} class="shrink-0">
          Close
        </Button>
      </div>

      <!-- Mobile Tab Switcher (< 768px) -->
      <div class="md:hidden flex border-b border-border bg-muted/40 p-1.5 gap-1.5 shrink-0">
        <button
          type="button"
          onclick={() => (mobileTab = 'revisions')}
          class={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'revisions'
              ? 'bg-card text-foreground shadow-2xs border border-border font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History class="w-3.5 h-3.5 text-primary" />
          <span>Revisions ({revisions.length})</span>
        </button>
        <button
          type="button"
          onclick={() => (mobileTab = 'coordinates')}
          class={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'coordinates'
              ? 'bg-card text-foreground shadow-2xs border border-border font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders class="w-3.5 h-3.5 text-primary" />
          <span>Coordinates (Seq #{targetSeqNumber})</span>
        </button>
      </div>

      <!-- Main Dual-Axis Viewport -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        <!-- Left Panel: Revision Barbs Stack (Y-Axis) -->
        <div
          class="{mobileTab === 'revisions' ? 'flex' : 'hidden'} md:flex col-span-1 md:col-span-5 lg:col-span-4 border-b md:border-b-0 md:border-r border-border flex-col bg-muted/20 overflow-hidden h-full"
        >
          <div
            class="p-3 border-b border-border flex items-center justify-between bg-card/40 shrink-0"
          >
            <div class="flex items-center gap-2 text-xs font-semibold text-foreground">
              <History class="w-4 h-4 text-muted-foreground" />
              <span>Authorial Revisions ({revisions.length})</span>
            </div>
            <span class="text-[10px] text-muted-foreground font-mono">
              Y-Axis / T_rev
            </span>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
            {#if revisions.length === 0}
              <div class="py-12 text-center text-xs text-muted-foreground">
                No revision history recorded yet.
              </div>
            {:else}
              {#each [...revisions].reverse() as rev (rev.id)}
                {@const badge = getRevisionTypeBadge(rev.type)}
                {@const isSelected = activeRevision?.id === rev.id}
                <button
                  type="button"
                  onclick={() => {
                    selectedRevisionId = rev.id;
                  }}
                  class="w-full text-left p-3 rounded-lg border transition-all relative cursor-pointer {isSelected
                    ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                    : 'bg-card border-border hover:border-primary/50 hover:bg-card/80'}"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs font-bold text-foreground">
                        Rev #{rev.revisionNumber}
                      </span>
                      <span
                        class="text-[10px] px-1.5 py-0.5 rounded border font-medium {badge.class}"
                      >
                        {badge.label}
                      </span>
                    </div>
                    {#if isSelected}
                      <span class="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    {/if}
                  </div>

                  {#if rev.authorNote}
                    <p class="text-xs text-foreground/90 font-medium line-clamp-2 mb-1.5">
                      "{rev.authorNote}"
                    </p>
                  {/if}

                  <div class="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/40 font-mono">
                    <span>
                      {new Date(rev.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} • {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-6 px-2 text-[10px] gap-1 hover:text-rose-500 hover:border-rose-500/30"
                      onclick={(e: MouseEvent) => {
                        e.stopPropagation();
                        handleRevertClick(rev);
                      }}
                    >
                      <RotateCcw class="w-3 h-3" />
                      Revert
                    </Button>
                  </div>
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Right Panel: Dual-Axis Inspector & Coordinate State (X-Axis) -->
        <div class="{mobileTab === 'coordinates' ? 'flex' : 'hidden'} md:flex col-span-1 md:col-span-7 lg:col-span-8 flex-col overflow-hidden bg-background h-full">
          <!-- Top Bar: Narrative Plot Sequence Scrubber (X-Axis) -->
          <div class="p-3 sm:p-4 border-b border-border bg-card/30 shrink-0">
            <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <Sliders class="w-4 h-4 text-primary shrink-0" />
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Narrative Plot Axis (X-Axis / T_story)
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">Sequence Number:</span>
                <span class="px-2 py-0.5 rounded bg-muted font-mono font-bold text-xs text-primary">
                  {targetSeqNumber === 0 ? 'Baseline (Seq #0)' : `Seq #${targetSeqNumber}`}
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <input
                type="range"
                min="0"
                max={maxSeq}
                step="1"
                bind:value={targetSeqNumber}
                class="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex items-center justify-between text-[10px] text-muted-foreground font-mono overflow-x-auto gap-2 py-0.5">
                <button
                  type="button"
                  class="hover:text-primary transition-colors cursor-pointer shrink-0"
                  onclick={() => (targetSeqNumber = 0)}
                >
                  Seq 0 (Creation)
                </button>
                {#each timelineEvents as ev}
                  <button
                    type="button"
                    class="hover:text-primary transition-colors cursor-pointer shrink-0 {targetSeqNumber === ev.narrativeSequenceNumber ? 'text-primary font-bold' : ''}"
                    onclick={() => (targetSeqNumber = ev.narrativeSequenceNumber)}
                  >
                    Seq {ev.narrativeSequenceNumber} ({ev.title.slice(0, 12)}...)
                  </button>
                {/each}
                <button
                  type="button"
                  class="hover:text-primary transition-colors cursor-pointer shrink-0"
                  onclick={() => (targetSeqNumber = maxSeq)}
                >
                  Latest (Seq {maxSeq})
                </button>
              </div>
            </div>
          </div>

          <!-- Coordinate State Inspection -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {#if bitemporalState && activeRevision}
              <!-- 2D Coordinate Badge -->
              <div class="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span class="text-[10px] uppercase tracking-wider font-bold text-primary">
                    Active Coordinate Resolution
                  </span>
                  <div class="flex items-center gap-3 mt-1">
                    <div class="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 font-mono flex-wrap">
                      <span>(T_story: Seq #{bitemporalState.narrativeSequenceNumber})</span>
                      <span class="text-muted-foreground font-normal">×</span>
                      <span>(T_rev: Rev #{bitemporalState.revisionNumber})</span>
                    </div>
                  </div>
                </div>
                <div class="sm:text-right">
                  <span class="text-xs text-muted-foreground block">
                    Applied Plot Mutations
                  </span>
                  <span class="text-sm font-bold text-primary font-mono">
                    {bitemporalState.appliedEventsCount} Event Effect(s)
                  </span>
                </div>
              </div>

              <!-- Active Narrative Mutations Breakdown -->
              {#if bitemporalState.activeMutations.length > 0}
                <div class="space-y-2">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles class="w-3.5 h-3.5 text-primary" />
                    Plot Mutations Applied up to Seq #{targetSeqNumber}
                  </h4>
                  <div class="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card/50">
                    {#each bitemporalState.activeMutations as mutation}
                      <div class="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs font-mono">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold shrink-0">
                            Seq #{mutation.sequenceNumber}
                          </span>
                          <span class="text-foreground font-sans font-medium truncate">
                            {mutation.eventTitle}
                          </span>
                        </div>
                        <div class="flex items-center gap-2 text-primary font-semibold flex-wrap">
                          <span>{mutation.propertyKey}</span>
                          <span class="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] uppercase">
                            {mutation.operation}
                          </span>
                          <span class="break-all">{JSON.stringify(mutation.value)}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Revision Granular Patch Diffs -->
              {#if activeRevision.patch && (activeRevision.patch.propertiesChanged || activeRevision.patch.name || activeRevision.patch.description)}
                <div class="space-y-2">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileEdit class="w-3.5 h-3.5 text-blue-500" />
                    Authorial Patch Deltas in Rev #{activeRevision.revisionNumber}
                  </h4>
                  <div class="p-3 rounded-lg border border-border bg-muted/10 space-y-2 text-xs font-mono">
                    {#if activeRevision.patch.name}
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-muted-foreground">name:</span>
                        <span class="line-through text-rose-500">{activeRevision.patch.name.before || '(empty)'}</span>
                        <ArrowRight class="w-3 h-3 text-muted-foreground shrink-0" />
                        <span class="text-emerald-500 font-bold">{activeRevision.patch.name.after}</span>
                      </div>
                    {/if}
                    {#if activeRevision.patch.description}
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-muted-foreground">description:</span>
                        <span class="line-through text-rose-500">{activeRevision.patch.description.before || '(empty)'}</span>
                        <ArrowRight class="w-3 h-3 text-muted-foreground shrink-0" />
                        <span class="text-emerald-500 font-bold">{activeRevision.patch.description.after}</span>
                      </div>
                    {/if}
                    {#if activeRevision.patch.propertiesChanged}
                      {#each Object.entries(activeRevision.patch.propertiesChanged) as [propKey, diff]}
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-muted-foreground">{propKey}:</span>
                          <span class="line-through text-rose-500">{JSON.stringify(diff.before)}</span>
                          <ArrowRight class="w-3 h-3 text-muted-foreground shrink-0" />
                          <span class="text-emerald-500 font-bold">{JSON.stringify(diff.after)}</span>
                        </div>
                      {/each}
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Resolved Canonical Properties Grid -->
              <div class="space-y-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers class="w-3.5 h-3.5 text-muted-foreground" />
                  Resolved State at Coordinate (Properties & Formulas)
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {#each Object.entries(bitemporalState.properties) as [key, val]}
                    <div class="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
                      <span class="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                        {key}
                      </span>
                      <span class="text-sm font-semibold text-foreground font-mono mt-1 break-all">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<ConfirmDialog
  open={showRevertConfirm}
  title="Revert to Historical Revision"
  description="Are you sure you want to revert {entity?.name || 'this entity'} to Revision #{revisionToRevert?.revisionNumber}? This will create a new immutable revision preserving complete audit history."
  confirmText="Confirm Revert"
  variant="destructive"
  onConfirm={confirmRevert}
  onCancel={() => {
    showRevertConfirm = false;
    revisionToRevert = null;
  }}
/>
