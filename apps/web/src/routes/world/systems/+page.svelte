<script lang="ts">
  import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Layers,
    TrendingUp,
    Heart,
    Compass,
    Calculator,
    ListFilter,
    Hash,
    ArrowRight,
  } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let searchQuery = $state('');

  const secondClassBlueprints = $derived(
    worldStore.getSecondClassBlueprints().filter((sys) => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        sys.name.toLowerCase().includes(q) ||
        sys.description.toLowerCase().includes(q) ||
        sys.category.toLowerCase().includes(q) ||
        sys.fields.some((f) => f.name.toLowerCase().includes(q) || f.label.toLowerCase().includes(q))
      );
    })
  );

  function handleDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete sub-blueprint "${name}"?`)) {
      worldStore.deleteBlueprint(id);
    }
  }
</script>

<div class="space-y-6">
  <!-- Header & Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Layers class="w-5 h-5 text-cyan-400" />
        <span>2nd-Class Sub-Blueprints & Custom Systems</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Reusable value objects, multi-tier progression ladders (cultivation realms), and relationship/affection scales referenced in 1st-Class entities.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <a href="/world/schemas/create">
        <Button size="sm">
          <Plus class="w-3.5 h-3.5" />
          <span>Create 2nd-Class Blueprint</span>
        </Button>
      </a>
    </div>
  </div>

  <!-- Search Filter -->
  <div class="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
    <div class="relative w-full">
      <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
      <Input
        bind:value={searchQuery}
        placeholder="Filter progression ladders, affection scales, and sub-systems..."
        class="pl-9 h-9 text-xs w-full"
      />
    </div>
  </div>

  <!-- Systems Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#if secondClassBlueprints.length === 0}
      <div class="col-span-2 bg-zinc-900/60 rounded-lg border border-zinc-800 p-12 text-center text-zinc-500 space-y-3">
        <p class="text-xs">No 2nd-Class sub-blueprints found.</p>
        <a href="/world/schemas/create">
          <Button variant="outline" size="sm">
            <Plus class="w-3.5 h-3.5" />
            <span>Create 2nd-Class Blueprint</span>
          </Button>
        </a>
      </div>
    {:else}
      {#each secondClassBlueprints as sys (sys.id)}
        <div class="bg-zinc-900/70 rounded-lg border border-zinc-800 p-5 space-y-4 hover:border-zinc-700 transition flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Layers class="w-4 h-4 text-cyan-400" />
                <h3 class="text-sm font-bold text-zinc-100">{sys.name}</h3>
              </div>
              <span class="text-[11px] font-mono text-cyan-400 font-semibold">{sys.category}</span>
            </div>

            <p class="text-xs text-zinc-400 leading-relaxed line-clamp-2">{sys.description}</p>

            <!-- Dynamic Fields Summary -->
            <div class="pt-2 border-t border-zinc-800/80 space-y-2">
              <span class="text-[11px] font-mono text-zinc-500 font-semibold block">
                Sub-Attributes & Metrics ({sys.fields.length}):
              </span>
              <div class="flex flex-wrap gap-1.5">
                {#each sys.fields as field}
                  <span class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 inline-flex items-center gap-1">
                    {#if field.fieldType === 'FORMULA'}
                      <Calculator class="w-3 h-3 text-amber-400" />
                    {:else if field.fieldType === 'ENUM'}
                      <ListFilter class="w-3 h-3 text-teal-400" />
                    {:else if field.fieldType === 'NUMBER'}
                      <Hash class="w-3 h-3 text-emerald-400" />
                    {/if}
                    <span>{field.name}</span>
                  </span>
                {/each}
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onclick={() => handleDelete(sys.id, sys.name)}
              class="text-zinc-500 hover:text-red-400 px-2 h-7"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <a href={`/world/schemas/${sys.id}`}>
              <Button variant="outline" size="sm" class="h-7 text-xs">
                <Edit3 class="w-3 h-3" />
                <span>Inspect Sub-Blueprint</span>
              </Button>
            </a>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
