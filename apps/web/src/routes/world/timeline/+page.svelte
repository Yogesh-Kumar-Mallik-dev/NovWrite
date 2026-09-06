<script lang="ts">
  import {
    Plus,
    Clock,
    BookOpen,
    Layers,
    ArrowUpDown,
    Tag,
    Edit3,
    Trash2,
    ArrowRight,
    Play,
    Sliders,
    History,
    Sparkles,
    Eye,
    Shield,
    Activity,
    Check,
    X,
    Cpu,
    Workflow,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Field from "$lib/components/ui/field.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import {
    worldStore,
    type TimelineEventItem,
    type TimelineEffectItem,
    type EffectOperation,
    type EntityItem,
  } from "$lib/stores/worldStore.svelte";

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
    }

    isModalOpen = false;
  }

  function handleDeleteEvent(id: string) {
    if (confirm("Are you sure you want to delete this causal timeline event?")) {
      worldStore.deleteTimelineEvent(id);
    }
  }

  function inspectEventSequence(seq: number) {
    scrubSequence = seq;
    isTimeTravelOpen = true;
  }
</script>

<div class="space-y-6">
  <!-- Header & Mode Switcher -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Clock class="w-5 h-5 text-purple-400" />
        <span>Causal Timeline & Delta Event Log</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Dual-indexed event sourcing stream powering time-travel state reconstruction across 1st-Class Entities & Sub-Schemas.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <!-- Dual Index Mode Switcher Button Group -->
      <div class="inline-flex rounded-lg bg-zinc-900 p-1 border border-zinc-800 text-xs">
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
        <History class="w-3.5 h-3.5 text-cyan-400" />
        <span>{isTimeTravelOpen ? "Hide State Scrubber" : "Time-Travel Scrubber"}</span>
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
    <div class="bg-gradient-to-br from-zinc-900/95 to-zinc-950/90 rounded-xl border border-cyan-950/80 p-5 space-y-4 shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
            <Sliders class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Deterministic Time-Travel State Fold Engine</span>
              <span class="text-[11px] font-mono font-normal text-cyan-400">
                ({appliedEventsCount} causal events folded)
              </span>
            </h3>
            <p class="text-xs text-zinc-400">
              Scrub sequence point to fold all entity mutations and evaluate AST formulas in real-time.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 font-mono text-xs">
          <span class="text-zinc-400">Target Index:</span>
          <span class="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold">
            {viewMode === "narrative" ? `Sequence #${scrubSequence}` : `Year #${scrubSequence}`}
          </span>
        </div>
      </div>

      <!-- Scrubber Slider & Quick Sequence Jumpers -->
      <div class="space-y-2">
        <div class="flex items-center gap-4">
          <span class="text-[11px] font-mono text-zinc-500">0</span>
          <input
            type="range"
            min="0"
            max={activeMaxSeq}
            step="5"
            bind:value={scrubSequence}
            class="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <span class="text-[11px] font-mono text-zinc-500">{activeMaxSeq}</span>
        </div>

        <!-- Quick Jump Sequence Chips -->
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <span class="text-[11px] font-mono text-zinc-500 mr-1">Quick Points:</span>
          <button
            type="button"
            onclick={() => (scrubSequence = 0)}
            class="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors {scrubSequence === 0 ? 'bg-cyan-900/60 border-cyan-600 text-cyan-200 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            Seq #0 (Base)
          </button>
          {#each sortedEvents as ev}
            {@const val = viewMode === "narrative" ? ev.narrativeSequenceNumber : ev.chronologicalOrder}
            <button
              type="button"
              onclick={() => (scrubSequence = val)}
              class="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors {scrubSequence === val ? 'bg-cyan-900/60 border-cyan-600 text-cyan-200 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
            >
              {viewMode === "narrative" ? `#${ev.narrativeSequenceNumber}` : `Y${ev.chronologicalOrder}`} · {ev.title.slice(0, 18)}...
            </button>
          {/each}
        </div>
      </div>

      <!-- Point-in-Time Folded Entities Preview Grid -->
      <div class="pt-3">
        <h4 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-mono">
          <Cpu class="w-3.5 h-3.5 text-cyan-400" />
          <span>Folded Universe State at Point (Entities & Formulas)</span>
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each foldedEntities as entity}
            <div class="bg-zinc-950/80 rounded-lg border border-zinc-800/80 p-3.5 space-y-2.5 hover:border-zinc-700 transition-colors">
              <div class="flex items-start justify-between gap-2 border-b border-zinc-800/60 pb-2">
                <div>
                  <h5 class="text-xs font-bold text-zinc-100">{entity.name}</h5>
                  <span class="text-[10px] font-mono text-purple-400">{entity.blueprintName}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] font-mono text-zinc-400">
                    Last Mutated: <strong class="text-cyan-300">Seq #{entity.lastMutatedSeqNumber}</strong>
                  </span>
                </div>
              </div>

              <!-- Folded Properties Highlights -->
              <div class="space-y-1 text-xs font-mono">
                {#if entity.properties.cultivation}
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-zinc-400">Cultivation Realm:</span>
                    <span class="text-amber-300 font-semibold">
                      {entity.properties.cultivation.realm_name || `Stage ${entity.properties.cultivation.major_realm}.${entity.properties.cultivation.minor_realm}`}
                    </span>
                  </div>
                {/if}

                {#if entity.properties.romantic_feelings}
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-zinc-400">Affection Level:</span>
                    <span class="text-pink-300 font-semibold">
                      {entity.properties.romantic_feelings.affection_level} / 1000
                    </span>
                  </div>
                {/if}

                {#if entity.properties.attack !== undefined}
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-zinc-400">Attack:</span>
                    <span class="text-zinc-200 font-semibold">{entity.properties.attack}</span>
                  </div>
                {/if}

                {#if entity.properties.bound_weapon}
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-zinc-400">Bound Weapon:</span>
                    <span class="text-purple-300 truncate max-w-[140px]">{entity.properties.bound_weapon}</span>
                  </div>
                {/if}

                {#if entity.properties.current_wielder}
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-zinc-400">Current Wielder:</span>
                    <span class="text-purple-300 truncate max-w-[140px]">{entity.properties.current_wielder}</span>
                  </div>
                {/if}
              </div>

              <!-- Live Recomputed Formulas at Point-in-Time -->
              {#if entity.computedFormulas && Object.keys(entity.computedFormulas).length > 0}
                <div class="pt-2 border-t border-zinc-800/60 space-y-1">
                  <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles class="w-3 h-3" />
                    <span>Live AST Formulas</span>
                  </span>
                  {#each Object.entries(entity.computedFormulas) as [fKey, fVal]}
                    <div class="flex items-center justify-between text-[11px] font-mono bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
                      <span class="text-emerald-300/80 text-[10px]">{fKey}</span>
                      <span class="text-emerald-300 font-bold">{fVal}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Timeline Event Stream Cards -->
  <div class="space-y-3.5">
    <div class="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
      <span>Causal Delta Stream ({sortedEvents.length} events logged)</span>
      <span>Sorted by {viewMode === "narrative" ? "Narrative Sequence" : "Chronological Order"}</span>
    </div>

    {#each sortedEvents as event}
      <div class="bg-zinc-900/80 rounded-xl border border-zinc-800 p-4 space-y-3 hover:border-zinc-700 transition-all shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-purple-300 px-2.5 py-1 rounded bg-purple-950/60 border border-purple-800/60">
              {viewMode === "narrative"
                ? `Sequence #${event.narrativeSequenceNumber}`
                : `Year #${event.chronologicalOrder}`}
            </span>
            <div>
              <h3 class="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>{event.title}</span>
                {#if event.anchorChapterTitle || event.anchorSceneTitle}
                  <span class="text-xs font-normal text-zinc-400 font-sans">
                    · {event.anchorChapterTitle || ""} {event.anchorSceneTitle ? `(${event.anchorSceneTitle})` : ""}
                  </span>
                {/if}
              </h3>
            </div>
          </div>

          <!-- Dual Index Tags & Actions -->
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
              <span>Seq: <strong class="text-zinc-200">#{event.narrativeSequenceNumber}</strong></span>
              <span class="text-zinc-600">|</span>
              <span>Year: <strong class="text-zinc-200">Y{event.chronologicalOrder}</strong></span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onclick={() => inspectEventSequence(event.narrativeSequenceNumber)}
              title="Inspect state at this sequence"
              class="h-7 px-2 text-cyan-400 hover:text-cyan-300"
            >
              <Eye class="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onclick={() => openEditModal(event)}
              class="h-7 px-2 text-zinc-400 hover:text-zinc-200"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onclick={() => handleDeleteEvent(event.id)}
              class="h-7 px-2 text-zinc-400 hover:text-red-400"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <p class="text-xs text-zinc-300 leading-relaxed font-sans">{event.description}</p>

        <!-- Attached Effect Mutations with semantic styling -->
        <div class="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span class="text-zinc-500 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Workflow class="w-3 h-3 text-purple-400" />
            <span>Atomic Effects:</span>
          </span>

          {#each event.effects as eff}
            <div class="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800 text-zinc-300">
              <span class="text-purple-300 font-semibold">{eff.entityName || eff.targetEntityId}</span>
              <span class="text-zinc-600">.</span>
              <span class="text-cyan-300">{eff.propertyKey}</span>
              <span class="text-zinc-400 font-bold text-[10px] px-1 py-0.2 bg-zinc-800 rounded">{eff.operation}</span>
              <span class="text-amber-300 font-bold">{JSON.stringify(eff.value)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Log / Edit Timeline Event Modal -->
  {#if isModalOpen}
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div class="flex items-center gap-2 text-purple-400">
            <Clock class="w-5 h-5" />
            <h3 class="text-base font-bold text-zinc-100">
              {modalMode === "add" ? "Log Causal Timeline Event" : "Edit Timeline Event"}
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="text-zinc-400 hover:text-zinc-200"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Title -->
          <Field id="event-title" label="Event Title" required>
            <Input
              id="event-title"
              bind:value={formTitle}
              placeholder="e.g., Breakthrough at Dragon Peak, Duel at Crimson Ridge..."
              class="text-xs"
            />
          </Field>

          <!-- Dual Index Coordinates -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="narrative-seq" label="Narrative Sequence Number (#)" required>
              <Input
                id="narrative-seq"
                type="number"
                bind:value={formNarrativeSeq}
                placeholder="e.g. 100"
                class="text-xs"
              />
            </Field>

            <Field id="chrono-order" label="Chronological Order (Year / Timeline Order)" required>
              <Input
                id="chrono-order"
                type="number"
                bind:value={formChronoOrder}
                placeholder="e.g. 150"
                class="text-xs"
              />
            </Field>
          </div>

          <!-- Anchor Scene & Chapter -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="anchor-chapter" label="Anchor Chapter (Optional)">
              <Input
                id="anchor-chapter"
                bind:value={formAnchorChapter}
                placeholder="e.g. Chapter 4: The Golden Core"
                class="text-xs"
              />
            </Field>

            <Field id="anchor-scene" label="Anchor Scene (Optional)">
              <Input
                id="anchor-scene"
                bind:value={formAnchorScene}
                placeholder="e.g. Scene 2: The Breakthrough"
                class="text-xs"
              />
            </Field>
          </div>

          <!-- Description -->
          <Field id="event-desc" label="Event Description">
            <Textarea
              id="event-desc"
              bind:value={formDescription}
              rows={3}
              placeholder="Describe the narrative occurrence, causal consequences, and state shifts..."
              class="text-xs"
            />
          </Field>

          <!-- Atomic Effects Builder -->
          <div class="space-y-3 pt-2 border-t border-zinc-800">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 font-mono" for="atomic-effects-list">
                <Workflow class="w-3.5 h-3.5 text-purple-400" />
                <span>Atomic Delta Effects ({formEffects.length})</span>
              </label>
              <Button size="sm" variant="outline" onclick={addEffectRow} class="h-7 text-xs flex items-center gap-1">
                <Plus class="w-3 h-3" />
                <span>Add Effect</span>
              </Button>
            </div>

            <div id="atomic-effects-list" class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {#if formEffects.length === 0}
                <div class="p-3 rounded bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-500 font-mono">
                  No effects attached yet. Click "Add Effect" to mutate universe entities.
                </div>
              {/if}

              {#each formEffects as eff, idx}
                <div class="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                  <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <!-- Target Entity -->
                    <div class="sm:col-span-1">
                      <label class="block text-[10px] font-mono text-zinc-400 mb-1" for={`eff-target-${idx}`}>Target Entity</label>
                      <select
                        id={`eff-target-${idx}`}
                        class="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
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
                      <label class="block text-[10px] font-mono text-zinc-400 mb-1" for={`eff-key-${idx}`}>Property Key</label>
                      <input
                        id={`eff-key-${idx}`}
                        type="text"
                        class="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono"
                        placeholder="e.g. cultivation.major_realm"
                        bind:value={eff.propertyKey}
                      />
                    </div>

                    <!-- Operation -->
                    <div class="sm:col-span-1">
                      <label class="block text-[10px] font-mono text-zinc-400 mb-1" for={`eff-op-${idx}`}>Operation</label>
                      <select
                        id={`eff-op-${idx}`}
                        class="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono"
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
                        <label class="block text-[10px] font-mono text-zinc-400 mb-1" for={`eff-val-${idx}`}>Value</label>
                        <input
                          id={`eff-val-${idx}`}
                          type="text"
                          class="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono"
                          placeholder="e.g. 3 or Core Formation"
                          bind:value={eff.value}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => removeEffectRow(idx)}
                        class="h-7 px-2 text-zinc-500 hover:text-red-400"
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

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <Button variant="outline" size="sm" onclick={() => (isModalOpen = false)}>Cancel</Button>
          <Button size="sm" disabled={!formTitle.trim()} onclick={handleSaveEvent}>
            {modalMode === "add" ? "Log Event to Stream" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
