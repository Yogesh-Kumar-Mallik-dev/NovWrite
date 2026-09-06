<script lang="ts">
  import { Search, Plus, Edit3, Trash2, Sliders, Layers, TrendingUp, HeartHandshake, Compass } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let searchQuery = $state('');

  const filteredSystems = $derived(
    worldStore.systems.filter((sys) =>
      sys.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sys.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sys.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function handleDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete custom system "${name}"?`)) {
      worldStore.deleteSystem(id);
    }
  }
</script>

<div class="space-y-6">
  <!-- Header & Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100">Custom Progression Systems & Relationship Scales</h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Define custom multi-stage progression ladders (cultivation realms, magic circles) and relationship metrics (affection, sect loyalty).
      </p>
    </div>
    <a href="/world/systems/create">
      <Button size="sm">
        <Plus class="w-3.5 h-3.5" />
        <span>Define New System</span>
      </Button>
    </a>
  </div>

  <!-- Search Filter -->
  <div class="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
    <div class="relative w-full">
      <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
      <Input
        bind:value={searchQuery}
        placeholder="Filter progression ladders and scales by name..."
        class="pl-9 h-9 text-xs"
      />
    </div>
  </div>

  <!-- Systems Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#if filteredSystems.length === 0}
      <div class="col-span-2 bg-zinc-900/60 rounded-lg border border-zinc-800 p-12 text-center text-zinc-500">
        <p class="text-xs mb-2">No progression systems or relationship scales found.</p>
        <a href="/world/systems/create" class="text-purple-400 hover:underline font-medium">
          + Define your first power ladder or scale
        </a>
      </div>
    {:else}
      {#each filteredSystems as sys}
        <div class="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 space-y-4 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                {#if sys.type === 'PROGRESSION_LADDER'}
                  <TrendingUp class="w-4 h-4 text-purple-400" />
                {:else if sys.type === 'RELATIONSHIP_SCALE'}
                  <HeartHandshake class="w-4 h-4 text-emerald-400" />
                {:else}
                  <Compass class="w-4 h-4 text-cyan-400" />
                {/if}
                <h3 class="text-sm font-bold text-zinc-100">{sys.name}</h3>
              </div>
              <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{sys.type.replace('_', ' ')}</span>
            </div>

            <p class="text-xs text-zinc-400 leading-relaxed">{sys.description}</p>

            <!-- Stages or Gauge Breakdown -->
            {#if sys.type === 'PROGRESSION_LADDER' && sys.tiersOrScale.stages}
              <div class="pt-2 border-t border-zinc-800/80 space-y-1.5">
                <span class="text-[11px] font-mono text-zinc-500 font-semibold block">
                  Progression Stages ({sys.tiersOrScale.stages.length}):
                </span>
                <div class="flex flex-wrap gap-1.5">
                  {#each sys.tiersOrScale.stages as stage, sIdx}
                    <span class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                      <span class="text-purple-400 font-bold">{sIdx + 1}.</span> {stage}
                    </span>
                  {/each}
                </div>
              </div>
            {:else if sys.tiersOrScale.minValue !== undefined && sys.tiersOrScale.maxValue !== undefined}
              <div class="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Range: <strong>{sys.tiersOrScale.minValue}</strong> to <strong>+{sys.tiersOrScale.maxValue}</strong></span>
                <span class="text-emerald-400 font-semibold">{sys.tiersOrScale.metricName}</span>
              </div>
            {/if}
          </div>

          <div class="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
            <Button
              variant="ghost"
              size="sm"
              onclick={() => handleDelete(sys.id, sys.name)}
              class="text-zinc-500 hover:text-red-400 px-2 h-7"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <a href={`/world/systems/${sys.id}`}>
              <Button variant="outline" size="sm" class="h-7 text-xs">
                <Edit3 class="w-3.5 h-3.5" />
                <span>Customize Stages & Metrics</span>
              </Button>
            </a>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
