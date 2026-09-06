<script lang="ts">
  import {
    Plus,
    Clock,
    BookOpen,
    Edit3,
    Trash2,
    Sliders,
    History,
    Sparkles,
    Eye,
    X,
    Cpu,
    Workflow,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Label } from "$lib/components/ui/label";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
  } from "$lib/components/ui/card";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "$lib/components/ui/dialog";
  import { ConfirmDialog, EmptyState } from "$lib/components/ui";
  import { toast } from "$lib/stores/toastStore.svelte";
  import {
    worldStore,
    type TimelineEventItem,
    type TimelineEffectItem,
    type EffectOperation,
    type EntityItem,
  } from "$lib/stores/worldStore.svelte";

  // Confirmation State
  let eventToDelete = $state<TimelineEventItem | null>(null);

  // Dual-index view mode: 'narrative' | 'chronological'
  let viewMode = $state<"narrative" | "chronological">("narrative");

  // Time-Travel State Folding Scrubber
  let isTimeTravelOpen = $state(true);
  let scrubSequence = $state<number>(150);

  // Modal State for Adding / Editing Events
  let isModalOpen = $state(false);
  let modalMode = $state<"add" | "edit">("add");
  let activeEditId = $state<string | null>(null);

  // Form inputs
  let formTitle = $state("");
  let formDescription = $state("");
  let formNarrativeSeq = $state<number>(100);
  let formChronoOrder = $state<number>(100);
  let formAnchorChapter = $state("");
  let formAnchorScene = $state("");
  let formEffects = $state<TimelineEffectItem[]>([]);

  // Sorted timeline events from worldStore
  const sortedEvents = $derived(
    [...worldStore.timelineEvents].sort((a: TimelineEventItem, b: TimelineEventItem) => {
      if (viewMode === "narrative") {
        return a.narrativeSequenceNumber - b.narrativeSequenceNumber;
      }
      return a.chronologicalOrder - b.chronologicalOrder;
    }),
  );

  // Max sequence available for scrubber
  const maxNarrativeSeq = $derived(
    Math.max(
      200,
      ...worldStore.timelineEvents.map((e: TimelineEventItem) => e.narrativeSequenceNumber),
    ),
  );

  const maxChronoSeq = $derived(
    Math.max(
      300,
      ...worldStore.timelineEvents.map((e: TimelineEventItem) => e.chronologicalOrder),
    ),
  );

  const activeMaxSeq = $derived(
    viewMode === "narrative" ? maxNarrativeSeq : maxChronoSeq,
  );

  // Live folded universe entities at current scrubSequence
  const foldedEntities = $derived(
    worldStore.foldStateAtSequence(scrubSequence, viewMode),
  );

  // Filtered active events up to current scrub point
  const appliedEventsCount = $derived(
    worldStore.timelineEvents.filter((e: TimelineEventItem) =>
      viewMode === "narrative"
        ? e.narrativeSequenceNumber <= scrubSequence
        : e.chronologicalOrder <= scrubSequence,
    ).length,
  );

  // Operation options for the effect editor
  const operationOptions: { value: EffectOperation; label: string }[] = [
    { value: "SET", label: "SET (Direct Assignment)" },
    { value: "INCREMENT", label: "INCREMENT (+ Number)" },
    { value: "DECREMENT", label: "DECREMENT (- Number)" },
    { value: "APPEND", label: "APPEND (Push to Array)" },
    { value: "REMOVE", label: "REMOVE (Filter from Array)" },
    { value: "TRANSFER", label: "TRANSFER (Move Relational ID)" },
  ];

  function openAddModal() {
    modalMode = "add";
    activeEditId = null;
    formTitle = "";
    formDescription = "";
    formNarrativeSeq = (sortedEvents[sortedEvents.length - 1]?.narrativeSequenceNumber || 0) + 10;
    formChronoOrder = (sortedEvents[sortedEvents.length - 1]?.chronologicalOrder || 0) + 20;
    formAnchorChapter = "Chapter 4";
    formAnchorScene = "Scene 1";
    formEffects = [
      {
        targetEntityId: worldStore.entities[0]?.id || "",
        entityName: worldStore.entities[0]?.name || "",
        propertyKey: "attack",
        operation: "INCREMENT",
        value: 100,
      },
    ];
    isModalOpen = true;
  }

  function openEditModal(event: TimelineEventItem) {
    modalMode = "edit";
    activeEditId = event.id;
    formTitle = event.title;
    formDescription = event.description;
    formNarrativeSeq = event.narrativeSequenceNumber;
    formChronoOrder = event.chronologicalOrder;
    formAnchorChapter = event.anchorChapterTitle || "";
    formAnchorScene = event.anchorSceneTitle || "";
    formEffects = JSON.parse(JSON.stringify(event.effects));
    isModalOpen = true;
  }

  function addEffectRow() {
    const firstEnt = worldStore.entities[0];
    formEffects.push({
      targetEntityId: firstEnt ? firstEnt.id : "",
      entityName: firstEnt ? firstEnt.name : "",
      propertyKey: "cultivation.major_realm",
      operation: "SET",
      value: 2,
    });
  }

  function removeEffectRow(index: number) {
    formEffects = formEffects.filter((_: TimelineEffectItem, i: number) => i !== index);
  }

  function handleTargetEntityChange(index: number, entityId: string) {
    const ent = worldStore.entities.find((e: EntityItem) => e.id === entityId);
    if (ent) {
      formEffects[index].targetEntityId = ent.id;
      formEffects[index].entityName = ent.name;
    }
  }

  function handleSaveEvent() {
    if (!formTitle.trim()) return;

    // Normalize effect values: attempt JSON / number parsing
    const normalizedEffects = formEffects.map((eff: TimelineEffectItem) => {
      let val: any = eff.value;
      if (typeof val === "string") {
        if (!isNaN(Number(val)) && val.trim() !== "") {
          val = Number(val);
        } else if (val === "true") {
          val = true;
        } else if (val === "false") {
          val = false;
        }
      }
      return {
        ...eff,
        value: val,
      };
    });

    if (modalMode === "add") {
      worldStore.addTimelineEvent({
        title: formTitle.trim(),
        description: formDescription.trim(),
        narrativeSequenceNumber: Number(formNarrativeSeq),
        chronologicalOrder: Number(formChronoOrder),
        anchorChapterTitle: formAnchorChapter.trim() || undefined,
        anchorSceneTitle: formAnchorScene.trim() || undefined,
        effects: normalizedEffects,
      });
      toast.success("Event Logged", `Timeline event "${formTitle.trim()}" added to causal stream.`);
    } else if (activeEditId) {
      worldStore.updateTimelineEvent(activeEditId, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        narrativeSequenceNumber: Number(formNarrativeSeq),
        chronologicalOrder: Number(formChronoOrder),
        anchorChapterTitle: formAnchorChapter.trim() || undefined,
        anchorSceneTitle: formAnchorScene.trim() || undefined,
        effects: normalizedEffects,
      });
      toast.success("Event Updated", `Timeline event "${formTitle.trim()}" updated.`);
    }

    isModalOpen = false;
  }

  function handleDeleteEvent(event: TimelineEventItem) {
    eventToDelete = event;
  }

  function confirmDeleteEvent() {
    if (eventToDelete) {
      const title = eventToDelete.title;
      worldStore.deleteTimelineEvent(eventToDelete.id);
      toast.success("Event Deleted", `Timeline event "${title}" was removed.`);
      eventToDelete = null;
    }
  }

  function inspectEventSequence(seq: number) {
    scrubSequence = seq;
    isTimeTravelOpen = true;
    toast.info("Scrubber Updated", `Time-travel fold point set to sequence #${seq}.`);
  }
</script>

<div class="space-y-6 transition-colors">
  <!-- Header & Mode Switcher -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
        <Clock class="w-5 h-5 text-primary" />
        <span>Causal Timeline & Delta Event Log</span>
      </h2>
      <p class="text-xs text-muted-foreground mt-0.5">
        Dual-indexed event sourcing stream powering time-travel state reconstruction across 1st-Class Entities & Sub-Schemas.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <!-- Dual Index Mode Switcher Button Group -->
      <div class="inline-flex rounded-lg bg-muted p-1 border border-border text-xs">
        <Button
          variant={viewMode === "narrative" ? "default" : "ghost"}
          size="sm"
          onclick={() => (viewMode = "narrative")}
          class="h-7 text-xs flex items-center gap-1.5"
        >
          <BookOpen class="w-3.5 h-3.5" />
          <span>Narrative Sequence (#)</span>
        </Button>
        <Button
          variant={viewMode === "chronological" ? "default" : "ghost"}
          size="sm"
          onclick={() => (viewMode = "chronological")}
          class="h-7 text-xs flex items-center gap-1.5"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>Chronological Order (Y)</span>
        </Button>
      </div>

      <!-- Toggle State Folding Inspector -->
      <Button
        variant={isTimeTravelOpen ? "secondary" : "outline"}
        size="sm"
        onclick={() => (isTimeTravelOpen = !isTimeTravelOpen)}
        class="h-8 text-xs flex items-center gap-1.5"
      >
        <History class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
        <span>{isTimeTravelOpen ? "Hide Scrubber" : "Time-Travel Scrubber"}</span>
      </Button>

      <!-- Log Event Button -->
      <Button size="sm" onclick={openAddModal} class="h-8 text-xs flex items-center gap-1.5">
        <Plus class="w-3.5 h-3.5" />
        <span>Log Timeline Event</span>
      </Button>
    </div>
  </div>

  <!-- Interactive Time-Travel Sequence Scrubber & State Snapshot Inspector -->
  {#if isTimeTravelOpen}
    <Card class="border-border bg-card p-5 space-y-4 shadow-sm transition-colors">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sliders class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Deterministic Time-Travel State Fold Engine</span>
              <span class="text-[11px] font-mono font-normal text-primary">
                ({appliedEventsCount} causal events folded)
              </span>
            </h3>
            <p class="text-xs text-muted-foreground">
              Scrub sequence point to fold all entity mutations and evaluate AST formulas in real-time.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 font-mono text-xs">
          <span class="text-muted-foreground">Target Index:</span>
          <span class="px-2.5 py-1 rounded bg-secondary text-secondary-foreground border border-border font-bold">
            {viewMode === "narrative" ? `Sequence #${scrubSequence}` : `Year #${scrubSequence}`}
          </span>
        </div>
      </div>

      <!-- Scrubber Slider & Quick Sequence Jumpers -->
      <div class="space-y-2">
        <div class="flex items-center gap-4">
          <span class="text-[11px] font-mono text-muted-foreground">0</span>
          <input
            type="range"
            min="0"
            max={activeMaxSeq}
            step="5"
            bind:value={scrubSequence}
            class="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
          />
          <span class="text-[11px] font-mono text-muted-foreground">{activeMaxSeq}</span>
        </div>

        <!-- Quick Jump Sequence Chips -->
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <span class="text-[11px] font-mono text-muted-foreground mr-1">Quick Points:</span>
          <button
            type="button"
            onclick={() => (scrubSequence = 0)}
            class="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors {scrubSequence === 0 ? 'bg-primary text-primary-foreground border-primary font-bold' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'}"
          >
            Seq #0 (Base)
          </button>
          {#each sortedEvents as ev}
            {@const val = viewMode === "narrative" ? ev.narrativeSequenceNumber : ev.chronologicalOrder}
            <button
              type="button"
              onclick={() => (scrubSequence = val)}
              class="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors {scrubSequence === val ? 'bg-primary text-primary-foreground border-primary font-bold' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'}"
            >
              {viewMode === "narrative" ? `#${ev.narrativeSequenceNumber}` : `Y${ev.chronologicalOrder}`} · {ev.title.slice(0, 18)}...
            </button>
          {/each}
        </div>
      </div>

      <!-- Point-in-Time Folded Entities Preview Grid -->
      <div class="pt-3">
        <h4 class="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-mono">
          <Cpu class="w-3.5 h-3.5 text-primary" />
          <span>Folded Universe State at Point (Entities & Formulas)</span>
        </h4>

        {#if foldedEntities.length === 0}
          <EmptyState
            icon={Cpu}
            title="No Entities Folded"
            description="No entities exist in the universe registry to evaluate at this sequence point."
            compact={true}
          />
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each foldedEntities as entity}
              <Card class="border-border bg-card/70 p-3.5 space-y-2.5 hover:border-primary/50 transition-colors shadow-xs">
                <div class="flex items-start justify-between gap-2 border-b border-border pb-2">
                  <div>
                    <h5 class="text-xs font-bold text-foreground">{entity.name}</h5>
                    <span class="text-[10px] font-mono text-primary">{entity.blueprintName}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-mono text-muted-foreground">
                      Last Mutated: <strong class="text-foreground">Seq #{entity.lastMutatedSeqNumber}</strong>
                    </span>
                  </div>
                </div>

                <!-- Folded Properties Highlights -->
                <div class="space-y-1 text-xs font-mono">
                  {#if entity.properties.cultivation}
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-muted-foreground">Cultivation Realm:</span>
                      <span class="text-amber-600 dark:text-amber-400 font-semibold">
                        {entity.properties.cultivation.realm_name || `Stage ${entity.properties.cultivation.major_realm}.${entity.properties.cultivation.minor_realm}`}
                      </span>
                    </div>
                  {/if}

                  {#if entity.properties.romantic_feelings}
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-muted-foreground">Affection Level:</span>
                      <span class="text-pink-600 dark:text-pink-400 font-semibold">
                        {entity.properties.romantic_feelings.affection_level} / 1000
                      </span>
                    </div>
                  {/if}

                  {#if entity.properties.attack !== undefined}
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-muted-foreground">Attack:</span>
                      <span class="text-foreground font-semibold">{entity.properties.attack}</span>
                    </div>
                  {/if}

                  {#if entity.properties.bound_weapon}
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-muted-foreground">Bound Weapon:</span>
                      <span class="text-primary truncate max-w-[140px]">{entity.properties.bound_weapon}</span>
                    </div>
                  {/if}

                  {#if entity.properties.current_wielder}
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-muted-foreground">Current Wielder:</span>
                      <span class="text-primary truncate max-w-[140px]">{entity.properties.current_wielder}</span>
                    </div>
                  {/if}
                </div>

                <!-- Live Recomputed Formulas at Point-in-Time -->
                {#if entity.computedFormulas && Object.keys(entity.computedFormulas).length > 0}
                  <div class="pt-2 border-t border-border space-y-1">
                    <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles class="w-3 h-3" />
                      <span>Live AST Formulas</span>
                    </span>
                    {#each Object.entries(entity.computedFormulas) as [fKey, fVal]}
                      <div class="flex items-center justify-between text-[11px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <span class="text-emerald-700 dark:text-emerald-300 text-[10px]">{fKey}</span>
                        <span class="text-emerald-700 dark:text-emerald-300 font-bold">{fVal}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </Card>
            {/each}
          </div>
        {/if}
      </div>
    </Card>
  {/if}

  <!-- Timeline Event Stream Cards -->
  <div class="space-y-3.5">
    <div class="flex items-center justify-between text-xs text-muted-foreground px-1 font-mono">
      <span>Causal Delta Stream ({sortedEvents.length} events logged)</span>
      <span>Sorted by {viewMode === "narrative" ? "Narrative Sequence" : "Chronological Order"}</span>
    </div>

    {#if sortedEvents.length === 0}
      <EmptyState
        icon={Clock}
        title="No Timeline Events Logged"
        description="Causal events log state deltas across entities to enable dual-indexed timeline tracking and state folding."
        actionText="+ Log First Event"
        onAction={openAddModal}
      />
    {:else}
      {#each sortedEvents as event (event.id)}
        <Card class="border-border bg-card p-4 space-y-3 hover:border-primary/50 transition-colors shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded bg-primary/10 border border-primary/20">
                {viewMode === "narrative"
                  ? `Sequence #${event.narrativeSequenceNumber}`
                  : `Year #${event.chronologicalOrder}`}
              </span>
              <div>
                <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>{event.title}</span>
                  {#if event.anchorChapterTitle || event.anchorSceneTitle}
                    <span class="text-xs font-normal text-muted-foreground font-sans">
                      · {event.anchorChapterTitle || ""} {event.anchorSceneTitle ? `(${event.anchorSceneTitle})` : ""}
                    </span>
                  {/if}
                </h3>
              </div>
            </div>

            <!-- Dual Index Tags & Actions -->
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted px-2.5 py-1 rounded border border-border">
                <span>Seq: <strong class="text-foreground">#{event.narrativeSequenceNumber}</strong></span>
                <span class="text-muted-foreground/60">|</span>
                <span>Year: <strong class="text-foreground">Y{event.chronologicalOrder}</strong></span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onclick={() => inspectEventSequence(event.narrativeSequenceNumber)}
                title="Inspect state at this sequence"
                class="h-7 px-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
              >
                <Eye class="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onclick={() => openEditModal(event)}
                class="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <Edit3 class="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onclick={() => handleDeleteEvent(event)}
                class="h-7 px-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <p class="text-xs text-foreground/90 leading-relaxed font-sans">{event.description}</p>

          <!-- Attached Effect Mutations with semantic styling -->
          <div class="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span class="text-muted-foreground font-medium text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Workflow class="w-3 h-3 text-primary" />
              <span>Atomic Effects:</span>
            </span>

            {#each event.effects as eff}
              <div class="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md border border-border text-foreground">
                <span class="text-primary font-semibold">{eff.entityName || eff.targetEntityId}</span>
                <span class="text-muted-foreground">.</span>
                <span class="text-cyan-600 dark:text-cyan-400">{eff.propertyKey}</span>
                <span class="text-muted-foreground font-bold text-[10px] px-1 py-0.2 bg-background rounded border border-border">{eff.operation}</span>
                <span class="text-amber-600 dark:text-amber-400 font-bold">{JSON.stringify(eff.value)}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/each}
    {/if}
  </div>

  <!-- Log / Edit Timeline Event Modal -->
  {#if isModalOpen}
    <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <Card class="border-border bg-card max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center gap-2 text-primary">
            <Clock class="w-5 h-5" />
            <h3 class="text-base font-bold text-foreground">
              {modalMode === "add" ? "Log Causal Timeline Event" : "Edit Timeline Event"}
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="text-muted-foreground hover:text-foreground"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Title -->
          <div class="space-y-1.5">
            <Label for="event-title">Event Title <span class="text-destructive">*</span></Label>
            <Input
              id="event-title"
              bind:value={formTitle}
              placeholder="e.g., Breakthrough at Dragon Peak, Duel at Crimson Ridge..."
              class="text-xs"
            />
          </div>

          <!-- Dual Index Coordinates -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label for="narrative-seq">Narrative Sequence Number (#) <span class="text-destructive">*</span></Label>
              <Input
                id="narrative-seq"
                type="number"
                bind:value={formNarrativeSeq}
                placeholder="e.g. 100"
                class="text-xs"
              />
            </div>

            <div class="space-y-1.5">
              <Label for="chrono-order">Chronological Order (Year / Timeline Order) <span class="text-destructive">*</span></Label>
              <Input
                id="chrono-order"
                type="number"
                bind:value={formChronoOrder}
                placeholder="e.g. 150"
                class="text-xs"
              />
            </div>
          </div>

          <!-- Anchor Scene & Chapter -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label for="anchor-chapter">Anchor Chapter (Optional)</Label>
              <Input
                id="anchor-chapter"
                bind:value={formAnchorChapter}
                placeholder="e.g. Chapter 4: The Golden Core"
                class="text-xs"
              />
            </div>

            <div class="space-y-1.5">
              <Label for="anchor-scene">Anchor Scene (Optional)</Label>
              <Input
                id="anchor-scene"
                bind:value={formAnchorScene}
                placeholder="e.g. Scene 2: The Breakthrough"
                class="text-xs"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <Label for="event-desc">Event Description</Label>
            <Textarea
              id="event-desc"
              bind:value={formDescription}
              rows={3}
              placeholder="Describe the narrative occurrence, causal consequences, and state shifts..."
              class="text-xs"
            />
          </div>

          <!-- Atomic Effects Builder -->
          <div class="space-y-3 pt-2 border-t border-border">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-semibold text-foreground flex items-center gap-1.5 font-mono" for="atomic-effects-list">
                <Workflow class="w-3.5 h-3.5 text-primary" />
                <span>Atomic Delta Effects ({formEffects.length})</span>
              </Label>
              <Button size="sm" variant="outline" onclick={addEffectRow} class="h-7 text-xs flex items-center gap-1">
                <Plus class="w-3 h-3" />
                <span>Add Effect</span>
              </Button>
            </div>

            <div id="atomic-effects-list" class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {#if formEffects.length === 0}
                <div class="p-3 rounded bg-muted/40 border border-border text-center text-xs text-muted-foreground font-mono">
                  No effects attached yet. Click "Add Effect" to mutate universe entities.
                </div>
              {/if}

              {#each formEffects as eff, idx}
                <div class="p-3 rounded-lg bg-muted/40 border border-border space-y-2.5">
                  <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <!-- Target Entity -->
                    <div class="sm:col-span-1">
                      <Label class="block text-[10px] font-mono text-muted-foreground mb-1" for={`eff-target-${idx}`}>Target Entity</Label>
                      <select
                        id={`eff-target-${idx}`}
                        class="w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground"
                        value={eff.targetEntityId}
                        onchange={(e) => handleTargetEntityChange(idx, e.currentTarget.value)}
                      >
                        {#each worldStore.entities as ent}
                          <option value={ent.id}>{ent.name}</option>
                        {/each}
                      </select>
                    </div>

                    <!-- Property Key -->
                    <div class="sm:col-span-1">
                      <Label class="block text-[10px] font-mono text-muted-foreground mb-1" for={`eff-key-${idx}`}>Property Key</Label>
                      <Input
                        id={`eff-key-${idx}`}
                        type="text"
                        class="h-8 text-xs font-mono"
                        placeholder="e.g. cultivation.major_realm"
                        bind:value={eff.propertyKey}
                      />
                    </div>

                    <!-- Operation -->
                    <div class="sm:col-span-1">
                      <Label class="block text-[10px] font-mono text-muted-foreground mb-1" for={`eff-op-${idx}`}>Operation</Label>
                      <select
                        id={`eff-op-${idx}`}
                        class="w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground font-mono"
                        bind:value={eff.operation}
                      >
                        {#each operationOptions as op}
                          <option value={op.value}>{op.label}</option>
                        {/each}
                      </select>
                    </div>

                    <!-- Value & Delete -->
                    <div class="sm:col-span-1 flex items-end gap-1">
                      <div class="flex-1">
                        <Label class="block text-[10px] font-mono text-muted-foreground mb-1" for={`eff-val-${idx}`}>Value</Label>
                        <Input
                          id={`eff-val-${idx}`}
                          type="text"
                          class="h-8 text-xs font-mono"
                          placeholder="e.g. 3 or Core Formation"
                          bind:value={eff.value}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => removeEffectRow(idx)}
                        class="h-8 px-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onclick={() => (isModalOpen = false)}>Cancel</Button>
          <Button size="sm" disabled={!formTitle.trim()} onclick={handleSaveEvent}>
            {modalMode === "add" ? "Log Event to Stream" : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  {/if}
</div>

<!-- Event Delete Confirmation Dialog -->
<ConfirmDialog
  open={eventToDelete !== null}
  title="Delete Causal Event"
  description={`Are you sure you want to delete the event "${eventToDelete?.title}"? Any state fold calculations depending on this event will be recomputed.`}
  confirmText="Delete Event"
  variant="destructive"
  onConfirm={confirmDeleteEvent}
  onCancel={() => (eventToDelete = null)}
/>

