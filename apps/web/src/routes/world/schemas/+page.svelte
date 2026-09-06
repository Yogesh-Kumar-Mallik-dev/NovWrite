<script lang="ts">
  import { Search, Plus, Edit3, Trash2, LayoutTemplate, Layers, ArrowRight, ShieldCheck } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let searchQuery = $state('');

  const filteredSchemas = $derived(
    worldStore.schemas.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function handleDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete the "${name}" schema? Entities using this schema may be impacted.`)) {
      worldStore.deleteSchema(id);
    }
  }
</script>

<div class="space-y-6">
  <!-- Header & Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100">Entity Type Definitions & Schemas</h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Define schema blueprints, attached dynamic properties, and validation rules for universe entities.
      </p>
    </div>
    <a href="/world/schemas/create">
      <Button size="sm">
        <Plus class="w-3.5 h-3.5" />
        <span>Define New Entity Type</span>
      </Button>
    </a>
  </div>

  <!-- Search Filter -->
  <div class="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
    <div class="relative w-full">
      <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
      <Input
        bind:value={searchQuery}
        placeholder="Filter schemas by name or category..."
        class="pl-9 h-9 text-xs"
      />
    </div>
  </div>

  <!-- Schemas Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#if filteredSchemas.length === 0}
      <div class="col-span-2 bg-zinc-900/60 rounded-lg border border-zinc-800 p-12 text-center text-zinc-500">
        <p class="text-xs mb-2">No schema definitions found.</p>
        <a href="/world/schemas/create" class="text-purple-400 hover:underline font-medium">
          + Define your first entity schema
        </a>
      </div>
    {:else}
      {#each filteredSchemas as schema}
        <div class="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 space-y-4 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <LayoutTemplate class="w-4 h-4 text-purple-400" />
                <h3 class="text-sm font-bold text-zinc-100">{schema.name}</h3>
              </div>
              <span class="text-[11px] font-mono text-zinc-400 uppercase">{schema.category}</span>
            </div>

            <p class="text-xs text-zinc-400 leading-relaxed">{schema.description}</p>

            <!-- Dynamic Properties List -->
            <div class="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <span class="text-[11px] font-mono text-zinc-500 font-semibold block">
                Attached Properties ({schema.properties.length}):
              </span>
              <div class="flex flex-wrap gap-1.5">
                {#each schema.properties as prop}
                  <span class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                    {prop.name} <span class="text-zinc-500 font-normal">({prop.propertyType})</span>
                  </span>
                {/each}
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
            <Button
              variant="ghost"
              size="sm"
              onclick={() => handleDelete(schema.id, schema.name)}
              class="text-zinc-500 hover:text-red-400 px-2 h-7"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <a href={`/world/schemas/${schema.id}`}>
              <Button variant="outline" size="sm" class="h-7 text-xs">
                <Edit3 class="w-3.5 h-3.5" />
                <span>Edit Schema & Properties</span>
              </Button>
            </a>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
