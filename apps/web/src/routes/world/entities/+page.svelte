<script lang="ts">
  import { Search, Plus, Edit3, Trash2, User, MapPin, Sparkles, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let searchQuery = $state('');
  let categoryFilter = $state('ALL');

  const categoryOptions = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'CHARACTER', label: 'Characters' },
    { value: 'LOCATION', label: 'Locations' },
    { value: 'ARTIFACT', label: 'Artifacts' },
  ];

  const filteredEntities = $derived(
    worldStore.entities.filter((e) => {
      const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      const matchesSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.properties.faction && String(e.properties.faction).toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    })
  );

  function handleDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      worldStore.deleteEntity(id);
    }
  }
</script>

<div class="space-y-6">
  <!-- Header & Create Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100">Universe Entities</h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Specific character instances, sacred locations, artifacts, and factions in your universe.
      </p>
    </div>
    <a href="/world/entities/create">
      <Button size="sm">
        <Plus class="w-3.5 h-3.5" />
        <span>Create New Entity</span>
      </Button>
    </a>
  </div>

  <!-- Search & Category Filters -->
  <div class="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
    <div class="relative flex-1 w-full">
      <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
      <Input
        bind:value={searchQuery}
        placeholder="Filter entities by name, faction, or description..."
        class="pl-9 h-9 text-xs"
      />
    </div>
    <div class="w-full sm:w-48">
      <Select
        options={categoryOptions}
        bind:value={categoryFilter}
      />
    </div>
  </div>

  <!-- Entities Table -->
  <div class="bg-zinc-900/60 rounded-lg border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
          <tr>
            <th class="px-4 py-3">Entity Name</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Realm / Stage</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Key Metric</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/60">
          {#if filteredEntities.length === 0}
            <tr>
              <td colspan="6" class="px-4 py-12 text-center text-zinc-500">
                <p class="text-xs mb-2">No entities found matching your criteria.</p>
                <a href="/world/entities/create" class="text-purple-400 hover:underline font-medium">
                  + Create your first entity
                </a>
              </td>
            </tr>
          {:else}
            {#each filteredEntities as entity}
              <tr class="hover:bg-zinc-850/80 transition-colors">
                <td class="px-4 py-3.5 font-medium text-zinc-200">
                  <a href={`/world/entities/${entity.id}`} class="hover:text-purple-400 transition-colors flex items-center gap-2">
                    {#if entity.category === 'CHARACTER'}
                      <User class="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    {:else if entity.category === 'LOCATION'}
                      <MapPin class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {:else}
                      <Sparkles class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    {/if}
                    <div>
                      <span class="font-semibold">{entity.name}</span>
                      <p class="text-[11px] text-zinc-400 font-sans line-clamp-1">{entity.description}</p>
                    </div>
                  </a>
                </td>
                <td class="px-4 py-3 text-zinc-400 font-mono text-[11px]">{entity.category}</td>
                <td class="px-4 py-3 text-zinc-300">{entity.properties.cultivation_realm || '—'}</td>
                <td class="px-4 py-3">
                  {#if entity.properties.status === 'ALIVE'}
                    <span class="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-semibold">
                      <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
                      ALIVE
                    </span>
                  {:else if entity.properties.status === 'DEAD'}
                    <span class="inline-flex items-center gap-1.5 text-red-400 font-mono text-[11px] font-semibold">
                      <XCircle class="w-3.5 h-3.5 text-red-500" />
                      DEAD
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                      <AlertCircle class="w-3.5 h-3.5 text-zinc-500" />
                      {entity.properties.status || 'ACTIVE'}
                    </span>
                  {/if}
                </td>
                <td class="px-4 py-3 font-mono text-zinc-300">
                  {#if entity.properties.mana_capacity !== undefined}
                    {entity.properties.mana_capacity} MP
                  {:else if entity.properties.spiritual_density !== undefined}
                    {entity.properties.spiritual_density} Density
                  {:else}
                    {entity.properties.durability ?? '—'}
                  {/if}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <a href={`/world/entities/${entity.id}`}>
                      <Button variant="ghost" size="sm" title="Edit Entity">
                        <Edit3 class="w-3.5 h-3.5 text-purple-400" />
                        <span>Edit</span>
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => handleDelete(entity.id, entity.name)}
                      title="Delete Entity"
                    >
                      <Trash2 class="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
