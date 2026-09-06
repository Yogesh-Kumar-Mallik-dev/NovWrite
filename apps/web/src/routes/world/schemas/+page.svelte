<script lang="ts">
  import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Boxes,
    Layers,
    ArrowRight,
    Calculator,
    Link2,
    ListFilter,
    Hash,
    Sparkles,
  } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { worldStore, type BlueprintClass } from '$lib/stores/worldStore.svelte';

  let searchQuery = $state('');
  let selectedClassFilter = $state<'ALL' | BlueprintClass>('ALL');
  let selectedCategoryFilter = $state<string>('ALL');

  // Categories list
  const allCategories = $derived(
    Array.from(new Set(worldStore.blueprints.map((b) => b.category))).sort()
  );

  const filteredBlueprints = $derived(
    worldStore.blueprints.filter((b) => {
      const matchClass = selectedClassFilter === 'ALL' || b.blueprintClass === selectedClassFilter;
      const matchCat = selectedCategoryFilter === 'ALL' || b.category === selectedCategoryFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.fields.some((f) => f.name.toLowerCase().includes(q) || f.label.toLowerCase().includes(q));

      return matchClass && matchCat && matchSearch;
    })
  );

  function handleDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete the "${name}" blueprint?`)) {
      worldStore.deleteBlueprint(id);
    }
  }
</script>

<div class="space-y-6">
  <!-- Header & Actions -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Boxes class="w-5 h-5 text-teal-400" />
        <span>Blueprints & Schemas Workbench</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Architect 1st-Class universe archetypes and 2nd-Class sub-blueprints with dynamic enums, references, and mathematical formulas.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <a href="/world/schemas/create">
        <Button size="sm">
          <Plus class="w-3.5 h-3.5" />
          <span>Create Blueprint from Scratch</span>
        </Button>
      </a>
    </div>
  </div>

  <!-- Filters Bar -->
  <div class="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 space-y-3">
    <div class="flex flex-col md:flex-row items-center gap-3">
      <!-- Search Input -->
      <div class="relative flex-1 w-full">
        <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
        <Input
          bind:value={searchQuery}
          placeholder="Filter blueprints by name, category, or field name..."
          class="pl-9 h-9 text-xs w-full"
        />
      </div>

      <!-- Class Segmented Control -->
      <div class="inline-flex rounded-md border border-zinc-800 bg-zinc-950 p-0.5 w-full md:w-auto">
        <button
          type="button"
          onclick={() => (selectedClassFilter = 'ALL')}
          class={`px-3 py-1.5 text-xs font-medium rounded transition ${
            selectedClassFilter === 'ALL'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All ({worldStore.blueprints.length})
        </button>
        <button
          type="button"
          onclick={() => (selectedClassFilter = 'FIRST_CLASS')}
          class={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${
            selectedClassFilter === 'FIRST_CLASS'
              ? 'bg-teal-950 text-teal-300 border border-teal-800/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Boxes class="w-3.5 h-3.5 text-teal-400" />
          <span>1st-Class ({worldStore.getFirstClassBlueprints().length})</span>
        </button>
        <button
          type="button"
          onclick={() => (selectedClassFilter = 'SECOND_CLASS')}
          class={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${
            selectedClassFilter === 'SECOND_CLASS'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers class="w-3.5 h-3.5 text-cyan-400" />
          <span>2nd-Class ({worldStore.getSecondClassBlueprints().length})</span>
        </button>
      </div>
    </div>

    <!-- Category Pills Filter -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1">
      <span class="text-[11px] text-zinc-500 mr-1">Category:</span>
      <button
        type="button"
        onclick={() => (selectedCategoryFilter = 'ALL')}
        class={`text-xs px-2.5 py-0.5 rounded transition ${
          selectedCategoryFilter === 'ALL'
            ? 'bg-zinc-700 text-zinc-100 font-semibold'
            : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        All
      </button>
      {#each allCategories as cat}
        <button
          type="button"
          onclick={() => (selectedCategoryFilter = cat)}
          class={`text-xs px-2.5 py-0.5 rounded transition ${
            selectedCategoryFilter === cat
              ? 'bg-zinc-700 text-zinc-100 font-semibold'
              : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          {cat}
        </button>
      {/each}
    </div>
  </div>

  <!-- Blueprints Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#if filteredBlueprints.length === 0}
      <div class="col-span-2 bg-zinc-900/60 rounded-lg border border-zinc-800 p-12 text-center text-zinc-500 space-y-3">
        <p class="text-xs">No blueprints match your filter criteria.</p>
        <a href="/world/schemas/create">
          <Button variant="outline" size="sm">
            <Plus class="w-3.5 h-3.5" />
            <span>Create Blueprint from Scratch</span>
          </Button>
        </a>
      </div>
    {:else}
      {#each filteredBlueprints as bp (bp.id)}
        <div class="bg-zinc-900/70 rounded-lg border border-zinc-800 p-5 space-y-4 hover:border-zinc-700 transition flex flex-col justify-between">
          <div class="space-y-3">
            <!-- Header with Class Badge & Category -->
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  {#if bp.blueprintClass === 'FIRST_CLASS'}
                    <Boxes class="w-4 h-4 text-teal-400" />
                  {:else}
                    <Layers class="w-4 h-4 text-cyan-400" />
                  {/if}
                  <h3 class="text-sm font-bold text-zinc-100">{bp.name}</h3>
                </div>
                <div class="flex items-center gap-2 text-[11px]">
                  <span class={`font-medium ${bp.blueprintClass === 'FIRST_CLASS' ? 'text-teal-400' : 'text-cyan-400'}`}>
                    {bp.blueprintClass === 'FIRST_CLASS' ? '1st-Class Archetype' : '2nd-Class Sub-Schema'}
                  </span>
                  <span class="text-zinc-600">·</span>
                  <span class="text-zinc-400">{bp.category}</span>
                </div>
              </div>

              {#if bp.isSystemDefault}
                <span class="text-[10px] text-zinc-500 font-mono">System Default</span>
              {/if}
            </div>

            <p class="text-xs text-zinc-400 leading-relaxed line-clamp-2">{bp.description}</p>

            <!-- Dynamic Fields Summary -->
            <div class="pt-2 border-t border-zinc-800/80 space-y-2">
              <div class="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <span>Dynamic Fields ({bp.fields.length})</span>
              </div>

              <div class="flex flex-wrap gap-1.5">
                {#each bp.fields as field}
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                    {#if field.fieldType === 'FORMULA'}
                      <Calculator class="w-3 h-3 text-amber-400" />
                    {:else if field.fieldType === 'ENUM'}
                      <ListFilter class="w-3 h-3 text-teal-400" />
                    {:else if field.fieldType === 'BLUEPRINT_REF'}
                      <Link2 class="w-3 h-3 text-cyan-400" />
                    {:else if field.fieldType === 'NUMBER'}
                      <Hash class="w-3 h-3 text-emerald-400" />
                    {/if}
                    <span>{field.name}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Card Footer Actions -->
          <div class="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onclick={() => handleDelete(bp.id, bp.name)}
              class="text-zinc-500 hover:text-red-400 px-2 h-7"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <div class="flex items-center gap-2">
              {#if bp.blueprintClass === 'FIRST_CLASS'}
                <a href={`/world/entities/create?blueprintId=${bp.id}`}>
                  <Button variant="secondary" size="sm" class="h-7 text-xs">
                    <Plus class="w-3 h-3" />
                    <span>New Entity</span>
                  </Button>
                </a>
              {/if}

              <a href={`/world/schemas/${bp.id}`}>
                <Button variant="outline" size="sm" class="h-7 text-xs">
                  <Edit3 class="w-3 h-3" />
                  <span>Inspect & Edit</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
