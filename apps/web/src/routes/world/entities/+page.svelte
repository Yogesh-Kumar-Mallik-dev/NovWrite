<script lang="ts">
  import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Boxes,
    Sparkles,
    Calculator,
    Heart,
    Shield,
    ArrowRight,
    Sword,
    MapPin,
    User,
  } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let searchQuery = $state('');
  let categoryFilter = $state('ALL');

  const allCategories = $derived([
    { value: 'ALL', label: 'All Categories' },
    ...Array.from(new Set(worldStore.entities.map((e) => e.category))).map((c) => ({
      value: c,
      label: c,
    })),
  ]);

  const filteredEntities = $derived(
    worldStore.entities.filter((e) => {
      const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.blueprintName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    })
  );

  function handleDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete entity "${name}"?`)) {
      worldStore.deleteEntity(id);
    }
  }

  function getEntityIcon(category: string) {
    const lower = category.toLowerCase();
    if (lower.includes('char')) return User;
    if (lower.includes('relic') || lower.includes('weapon') || lower.includes('art')) return Sword;
    if (lower.includes('loc') || lower.includes('geo') || lower.includes('cosmo')) return MapPin;
    return Boxes;
  }
</script>

<div class="space-y-6">
  <!-- Header & Create Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Boxes class="w-5 h-5 text-teal-400" />
        <span>Universe Entities</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Instantiated universe entities with dynamic blueprints, custom enum identities, and live mathematical formula computations.
      </p>
    </div>
    <a href="/world/entities/create">
      <Button size="sm">
        <Plus class="w-3.5 h-3.5" />
        <span>Instantiate Entity</span>
      </Button>
    </a>
  </div>

  <!-- Search & Category Filters -->
  <div class="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
    <div class="relative flex-1 w-full">
      <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
      <Input
        bind:value={searchQuery}
        placeholder="Filter entities by name, archetype blueprint, or properties..."
        class="pl-9 h-9 text-xs w-full"
      />
    </div>
    <div class="w-full sm:w-56">
      <Select options={allCategories} bind:value={categoryFilter} />
    </div>
  </div>

  <!-- Entities Table -->
  <div class="bg-zinc-900/60 rounded-lg border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
          <tr>
            <th class="px-4 py-3">Entity Name</th>
            <th class="px-4 py-3">Blueprint Archetype</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Gender / Identity</th>
            <th class="px-4 py-3">Affection / Bond</th>
            <th class="px-4 py-3">Live Computed Math / Power</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/60">
          {#if filteredEntities.length === 0}
            <tr>
              <td colspan="7" class="px-4 py-12 text-center text-zinc-500">
                <p class="text-xs mb-2">No entities found matching your criteria.</p>
                <a href="/world/entities/create" class="text-teal-400 hover:underline font-medium">
                  + Instantiate your first entity
                </a>
              </td>
            </tr>
          {:else}
            {#each filteredEntities as entity}
              {@const IconComp = getEntityIcon(entity.category)}
              <tr class="hover:bg-zinc-850/80 transition-colors">
                <!-- Name & Icon -->
                <td class="px-4 py-3.5 font-medium text-zinc-200">
                  <a href={`/world/entities/${entity.id}`} class="hover:text-teal-400 transition-colors flex items-center gap-2">
                    <IconComp class="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <div class="font-bold text-zinc-100">{entity.name}</div>
                      <div class="text-[10px] text-zinc-500 font-mono line-clamp-1">{entity.description}</div>
                    </div>
                  </a>
                </td>

                <!-- Blueprint -->
                <td class="px-4 py-3 text-zinc-300 font-mono text-[11px]">
                  {entity.blueprintName}
                </td>

                <!-- Category -->
                <td class="px-4 py-3 text-zinc-400">
                  {entity.category}
                </td>

                <!-- Gender / Enum identity -->
                <td class="px-4 py-3 text-zinc-300">
                  {#if entity.properties.gender}
                    <span class="font-medium text-zinc-200">{entity.properties.gender}</span>
                  {:else if entity.properties.weapon_type}
                    <span class="font-medium text-zinc-200">{entity.properties.weapon_type}</span>
                  {:else if entity.properties.domain_type}
                    <span class="font-medium text-zinc-200">{entity.properties.domain_type}</span>
                  {:else}
                    <span class="text-zinc-600">—</span>
                  {/if}
                </td>

                <!-- Affection / Bond -->
                <td class="px-4 py-3 text-zinc-300">
                  {#if entity.properties.romantic_feelings}
                    <div class="flex items-center gap-1.5">
                      <Heart class="w-3.5 h-3.5 text-pink-400" />
                      <span class="text-pink-300 font-medium">
                        {entity.properties.romantic_feelings.relationship_stage || 'Bond'}
                        ({entity.properties.romantic_feelings.affection_level} pts)
                      </span>
                    </div>
                  {:else}
                    <span class="text-zinc-600">—</span>
                  {/if}
                </td>

                <!-- Live Computed Formula Result -->
                <td class="px-4 py-3">
                  {#if entity.computedFormulas && Object.keys(entity.computedFormulas).length > 0}
                    <div class="space-y-1">
                      {#each Object.entries(entity.computedFormulas) as [fKey, fVal]}
                        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/50 text-amber-300 font-mono text-xs">
                          <Calculator class="w-3 h-3 text-amber-400 shrink-0" />
                          <span class="font-bold">{fVal.toLocaleString()}</span>
                          <span class="text-[10px] text-amber-500 font-normal">({fKey.replace(/_/g, ' ')})</span>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <span class="text-zinc-600 text-xs font-mono">—</span>
                  {/if}
                </td>

                <!-- Actions -->
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <a href={`/world/entities/${entity.id}`}>
                      <Button variant="outline" size="sm" class="h-7 text-xs px-2.5">
                        <Edit3 class="w-3 h-3" />
                        <span>Inspect</span>
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => handleDelete(entity.id, entity.name)}
                      class="text-zinc-500 hover:text-red-400 h-7 px-2"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
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
