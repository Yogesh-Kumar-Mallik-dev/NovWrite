<script lang="ts">
  import {
    Plus,
    Clock,
    BookOpen,
    Layers,
    ArrowUpDown,
    Tag,
    Edit3,
    ArrowRight,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";

  interface EventEffect {
    targetEntity: string;
    entityName: string;
    propertyKey: string;
    operation:
      "SET" | "INCREMENT" | "DECREMENT" | "APPEND" | "REMOVE" | "TRANSFER";
    value: any;
  }

  interface TimelineItem {
    id: string;
    narrativeSequenceNumber: number;
    chronologicalOrder: number;
    title: string;
    description: string;
    anchorSceneId?: string;
    effects: EventEffect[];
  }

  // Dual-index view mode: 'narrative' | 'chronological'
  let viewMode = $state<"narrative" | "chronological">("narrative");

  let events = $state<TimelineItem[]>([
    {
      id: "ev-1",
      narrativeSequenceNumber: 10,
      chronologicalOrder: 100,
      title: "Awakening at the Citadel",
      description: "Eldrin awakens and awakens spiritual mana capacity.",
      anchorSceneId: "scene-awakening-10",
      effects: [
        {
          targetEntity: "a1111111-1111-4111-a111-111111111111",
          entityName: "Eldrin",
          propertyKey: "mana_capacity",
          operation: "SET",
          value: 500,
        },
        {
          targetEntity: "a1111111-1111-4111-a111-111111111111",
          entityName: "Eldrin",
          propertyKey: "status",
          operation: "SET",
          value: "ALIVE",
        },
      ],
    },
    {
      id: "ev-2",
      narrativeSequenceNumber: 50,
      chronologicalOrder: 150,
      title: "Duel at Crimson Ridge",
      description:
        "Eldrin expends 200 mana in mortal clash with syndicate assassins.",
      anchorSceneId: "scene-duel-50",
      effects: [
        {
          targetEntity: "a1111111-1111-4111-a111-111111111111",
          entityName: "Eldrin",
          propertyKey: "mana_capacity",
          operation: "DECREMENT",
          value: 200,
        },
      ],
    },
    {
      id: "ev-3",
      narrativeSequenceNumber: 80,
      chronologicalOrder: 50, // Flashback to Year 50
      title: "Flashback: The Ancient Covenant",
      description:
        "Flashback chapter depicting Malakor sealing the ancient forbidden pact.",
      anchorSceneId: "scene-flashback-80",
      effects: [
        {
          targetEntity: "c3333333-3333-4333-a333-333333333333",
          entityName: "Lord Malakor",
          propertyKey: "faction",
          operation: "SET",
          value: "Ancient Order",
        },
      ],
    },
    {
      id: "ev-4",
      narrativeSequenceNumber: 150,
      chronologicalOrder: 200,
      title: "Fall of Malakor",
      description: "Lord Malakor is slain at the climax of Volume 1.",
      anchorSceneId: "scene-fall-150",
      effects: [
        {
          targetEntity: "c3333333-3333-4333-a333-333333333333",
          entityName: "Lord Malakor",
          propertyKey: "status",
          operation: "SET",
          value: "DEAD",
        },
      ],
    },
  ]);

  const sortedEvents = $derived(
    [...events].sort((a, b) => {
      if (viewMode === "narrative") {
        return a.narrativeSequenceNumber - b.narrativeSequenceNumber;
      }
      return a.chronologicalOrder - b.chronologicalOrder;
    }),
  );
</script>

<div class="space-y-6">
  <!-- Header & Mode Switcher -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100">
        Causal Timeline & Delta Event Log
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Dual-indexed event sourcing stream powering time-travel state
        reconstruction.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <!-- Dual Index Mode Switcher Button Group -->
      <div
        class="inline-flex rounded-md bg-zinc-900 p-1 border border-zinc-800 text-xs"
      >
        <Button
          variant={viewMode === "narrative" ? "default" : "ghost"}
          size="sm"
          onclick={() => (viewMode = "narrative")}
          class="h-7 text-xs"
        >
          <BookOpen class="w-3.5 h-3.5" />
          <span>Narrative Sequence</span>
        </Button>
        <Button
          variant={viewMode === "chronological" ? "default" : "ghost"}
          size="sm"
          onclick={() => (viewMode = "chronological")}
          class="h-7 text-xs"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>Chronological Order</span>
        </Button>
      </div>

      <Button size="sm">
        <Plus class="w-3.5 h-3.5" />
        <span>Log Event</span>
      </Button>
    </div>
  </div>

  <!-- Timeline Event Stream -->
  <div class="space-y-3">
    {#each sortedEvents as event}
      <div
        class="bg-zinc-900/80 rounded-lg border border-zinc-800 p-4 space-y-3 hover:border-zinc-700 transition-colors"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5"
        >
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-purple-300">
              {viewMode === "narrative"
                ? `Sequence #${event.narrativeSequenceNumber}`
                : `Year #${event.chronologicalOrder}`}
            </span>
            <h3 class="text-sm font-semibold text-zinc-100">{event.title}</h3>
          </div>

          <div class="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span
              >Narrative: <strong>#{event.narrativeSequenceNumber}</strong
              ></span
            >
            <span>·</span>
            <span>Chrono: <strong>Y{event.chronologicalOrder}</strong></span>
          </div>
        </div>

        <p class="text-xs text-zinc-300 leading-relaxed">{event.description}</p>

        <!-- Attached Effect Mutations with semantic text & icons -->
        <div
          class="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400"
        >
          <span class="text-zinc-500 font-medium">Atomic Effects:</span>
          {#each event.effects as eff}
            <div class="flex items-center gap-1.5 text-zinc-300">
              <span class="text-purple-400 font-medium">{eff.entityName}</span>
              <span class="text-zinc-600">.</span>
              <span>{eff.propertyKey}</span>
              <span class="text-zinc-500 font-semibold">{eff.operation}</span>
              <span class="text-amber-300 font-bold"
                >{JSON.stringify(eff.value)}</span
              >
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
