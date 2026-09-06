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
    SlidersHorizontal,
    Check,
    RotateCcw,
    Layers,
    Link2,
    Hash,
    ListFilter,
    User,
    Sword,
    MapPin,
    Eye,
    EyeOff,
  } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';
  import {
    getAvailableColumnsForBlueprint,
    getDefaultVisibleColumns,
    formatTableCellValue,
    type TableColumnDef,
  } from '$lib/engine/tableConfig';

  const STORAGE_KEY = 'novwrite_world_entity_table_columns_v1';

  let searchQuery = $state('');
  let blueprintFilter = $state('ALL');
  let categoryFilter = $state('ALL');
  let showColumnCustomizer = $state(false);

  // Per-blueprint column visibility preferences map (keyed by blueprint id, or 'ALL')
  let columnPreferences = $state<Record<string, string[]>>({});

  // Load preferences from localStorage on mount
  $effect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        columnPreferences = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load table column preferences from localStorage:', e);
    }
  });

  const firstClassBlueprints = $derived(worldStore.getFirstClassBlueprints());

  const blueprintOptions = $derived([
    { value: 'ALL', label: 'All Blueprint Archetypes' },
    ...firstClassBlueprints.map((bp) => ({
      value: bp.id,
      label: `${bp.name} (${bp.category})`,
    })),
  ]);

  const allCategories = $derived([
    { value: 'ALL', label: 'All Categories' },
    ...Array.from(new Set(worldStore.entities.map((e) => e.category))).map((c) => ({
      value: c,
      label: c,
    })),
  ]);

  const activeBlueprint = $derived(
    blueprintFilter !== 'ALL' ? worldStore.getBlueprint(blueprintFilter) : undefined
  );

  // All available columns for the active blueprint context
  const availableColumns = $derived<TableColumnDef[]>(
    getAvailableColumnsForBlueprint(activeBlueprint)
  );

  // Active visible column IDs for current blueprint
  const visibleColumnIds = $derived.by<string[]>(() => {
    const key = blueprintFilter;
    if (columnPreferences[key] && Array.isArray(columnPreferences[key])) {
      return columnPreferences[key];
    }
    return getDefaultVisibleColumns(activeBlueprint);
  });

  // Active visible column definitions in order
  const visibleColumns = $derived<TableColumnDef[]>(
    availableColumns.filter((col) => visibleColumnIds.includes(col.id))
  );

  const filteredEntities = $derived(
    worldStore.entities.filter((e) => {
      const matchesBp = blueprintFilter === 'ALL' || e.blueprintId === blueprintFilter;
      const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        e.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.blueprintName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      return matchesBp && matchesCat && matchesSearch;
    })
  );

  function savePreferences(newPrefs: Record<string, string[]>) {
    columnPreferences = newPrefs;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (e) {
      console.warn('Failed to save table column preferences to localStorage:', e);
    }
  }

  function toggleColumnVisibility(colId: string) {
    const key = blueprintFilter;
    const current = [...visibleColumnIds];
    let updated: string[];

    if (current.includes(colId)) {
      // Don't allow unchecking if it's the only visible column
      if (current.length <= 1) return;
      updated = current.filter((id) => id !== colId);
    } else {
      updated = [...current, colId];
    }

    savePreferences({
      ...columnPreferences,
      [key]: updated,
    });
  }

  function handleSelectAllColumns() {
    const key = blueprintFilter;
    const allIds = availableColumns.map((c) => c.id);
    savePreferences({
      ...columnPreferences,
      [key]: allIds,
    });
  }

  function handleResetColumnsToDefault() {
    const key = blueprintFilter;
    const defaults = getDefaultVisibleColumns(activeBlueprint);
    const updated = { ...columnPreferences };
    delete updated[key];
    savePreferences(updated);
  }

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
  <!-- Header & Actions -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Boxes class="w-5 h-5 text-teal-400" />
        <span>Universe Entities</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Instantiated universe entities with dynamic blueprints, custom columns per blueprint, and live formula evaluations.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <a href="/world/entities/create">
        <Button size="sm">
          <Plus class="w-3.5 h-3.5" />
          <span>Instantiate Entity</span>
        </Button>
      </a>
    </div>
  </div>

  <!-- Filters & Table Customization Controls -->
  <div class="space-y-3">
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800 items-center">
      <!-- Search Input -->
      <div class="relative sm:col-span-4">
        <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
        <Input
          bind:value={searchQuery}
          placeholder="Filter entities by name, properties..."
          class="pl-9 h-9 text-xs w-full"
        />
      </div>

      <!-- Blueprint Filter -->
      <div class="sm:col-span-3">
        <Select options={blueprintOptions} bind:value={blueprintFilter} />
      </div>

      <!-- Category Filter -->
      <div class="sm:col-span-3">
        <Select options={allCategories} bind:value={categoryFilter} />
      </div>

      <!-- Column Visibility Customizer Toggle Button -->
      <div class="sm:col-span-2 flex justify-end">
        <Button
          variant={showColumnCustomizer ? 'default' : 'outline'}
          size="sm"
          class="w-full h-9 text-xs flex items-center justify-center gap-1.5"
          onclick={() => (showColumnCustomizer = !showColumnCustomizer)}
        >
          <SlidersHorizontal class="w-3.5 h-3.5 text-teal-400" />
          <span>Columns ({visibleColumns.length}/{availableColumns.length})</span>
        </Button>
      </div>
    </div>

    <!-- Per-Blueprint Column Customizer Drawer / Panel -->
    {#if showColumnCustomizer}
      <div class="p-4 rounded-lg border border-teal-900/60 bg-teal-950/20 space-y-4 transition-all">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-900/40 pb-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2 text-xs font-bold text-teal-300">
              <SlidersHorizontal class="w-4 h-4 text-teal-400" />
              <span>Customize Table Columns ({activeBlueprint ? activeBlueprint.name : 'All Archetypes'})</span>
            </div>
            <p class="text-[11px] text-zinc-400">
              Configure exactly which attributes, formulas, and references appear in this entity table. Preferences are preserved per blueprint.
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-[11px] px-2.5"
              onclick={handleSelectAllColumns}
            >
              <Eye class="w-3 h-3 text-zinc-400" />
              <span>Show All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-[11px] px-2.5"
              onclick={handleResetColumnsToDefault}
            >
              <RotateCcw class="w-3 h-3 text-zinc-400" />
              <span>Reset Defaults</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              class="h-7 text-[11px] px-2.5"
              onclick={() => (showColumnCustomizer = false)}
            >
              <Check class="w-3 h-3 text-teal-400" />
              <span>Done</span>
            </Button>
          </div>
        </div>

        <!-- Grouped Columns Selection -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 1. Core Columns -->
          <div class="space-y-2 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800">
            <span class="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
              Core Identity Fields
            </span>
            <div class="space-y-1.5">
              {#each availableColumns.filter((c) => c.category === 'core') as col}
                {@const isChecked = visibleColumnIds.includes(col.id)}
                <button
                  type="button"
                  onclick={() => toggleColumnVisibility(col.id)}
                  class={`w-full flex items-center justify-between p-2 rounded text-xs text-left transition ${
                    isChecked
                      ? 'bg-teal-950/40 border border-teal-800/80 text-teal-200'
                      : 'bg-zinc-950/40 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div class="flex items-center gap-2">
                    <span class={`w-4 h-4 rounded border flex items-center justify-center ${
                      isChecked ? 'border-teal-500 bg-teal-500/20 text-teal-300' : 'border-zinc-700'
                    }`}>
                      {#if isChecked}
                        <Check class="w-3 h-3" />
                      {/if}
                    </span>
                    <span>{col.label}</span>
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- 2. Dynamic Blueprint Properties -->
          <div class="space-y-2 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800">
            <span class="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block">
              Blueprint Attributes ({availableColumns.filter((c) => c.category === 'dynamic').length})
            </span>
            {#if availableColumns.filter((c) => c.category === 'dynamic').length === 0}
              <p class="text-xs text-zinc-500 italic p-2">Select a specific blueprint to view custom attributes.</p>
            {:else}
              <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {#each availableColumns.filter((c) => c.category === 'dynamic') as col}
                  {@const isChecked = visibleColumnIds.includes(col.id)}
                  <button
                    type="button"
                    onclick={() => toggleColumnVisibility(col.id)}
                    class={`w-full flex items-center justify-between p-2 rounded text-xs text-left transition ${
                      isChecked
                        ? 'bg-teal-950/40 border border-teal-800/80 text-teal-200'
                        : 'bg-zinc-950/40 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div class="flex items-center gap-2">
                      <span class={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'border-teal-500 bg-teal-500/20 text-teal-300' : 'border-zinc-700'
                      }`}>
                        {#if isChecked}
                          <Check class="w-3 h-3" />
                        {/if}
                      </span>
                      <span>{col.label}</span>
                    </div>
                    <span class="text-[10px] font-mono text-zinc-500">{col.fieldType}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- 3. Mathematical & Logical Formulas -->
          <div class="space-y-2 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800">
            <span class="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Computed Formulas ({availableColumns.filter((c) => c.category === 'formula').length})
            </span>
            {#if availableColumns.filter((c) => c.category === 'formula').length === 0}
              <p class="text-xs text-zinc-500 italic p-2">No formula fields defined on this blueprint.</p>
            {:else}
              <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {#each availableColumns.filter((c) => c.category === 'formula') as col}
                  {@const isChecked = visibleColumnIds.includes(col.id)}
                  <button
                    type="button"
                    onclick={() => toggleColumnVisibility(col.id)}
                    class={`w-full flex items-center justify-between p-2 rounded text-xs text-left transition ${
                      isChecked
                        ? 'bg-amber-950/40 border border-amber-800/80 text-amber-200'
                        : 'bg-zinc-950/40 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div class="flex items-center gap-2">
                      <span class={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-zinc-700'
                      }`}>
                        {#if isChecked}
                          <Check class="w-3 h-3" />
                        {/if}
                      </span>
                      <span>{col.label}</span>
                    </div>
                    <Calculator class="w-3.5 h-3.5 text-amber-400" />
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Entities Table -->
  <div class="bg-zinc-900/60 rounded-lg border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
          <tr>
            {#each visibleColumns as col}
              <th class="px-4 py-3">
                <div class="flex items-center gap-1.5">
                  {#if col.category === 'formula'}
                    <Calculator class="w-3.5 h-3.5 text-amber-400" />
                  {:else if col.fieldType === 'ENUM'}
                    <ListFilter class="w-3.5 h-3.5 text-teal-400" />
                  {:else if col.fieldType === 'BLUEPRINT_REF'}
                    <Link2 class="w-3.5 h-3.5 text-cyan-400" />
                  {:else if col.fieldType === 'NUMBER'}
                    <Hash class="w-3.5 h-3.5 text-emerald-400" />
                  {/if}
                  <span>{col.label}</span>
                </div>
              </th>
            {/each}
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-zinc-800/60">
          {#if filteredEntities.length === 0}
            <tr>
              <td colspan={visibleColumns.length + 1} class="px-4 py-12 text-center text-zinc-500">
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
                {#each visibleColumns as col}
                  {@const cellInfo = formatTableCellValue(col.id, entity, activeBlueprint)}

                  <td class="px-4 py-3.5">
                    {#if col.id === 'name'}
                      <!-- Entity Name Cell -->
                      <a href={`/world/entities/${entity.id}`} class="hover:text-teal-400 transition-colors flex items-center gap-2">
                        <IconComp class="w-4 h-4 text-teal-400 shrink-0" />
                        <div>
                          <div class="font-bold text-zinc-100">{entity.name}</div>
                          {#if entity.description}
                            <div class="text-[10px] text-zinc-500 font-mono line-clamp-1">{entity.description}</div>
                          {/if}
                        </div>
                      </a>
                    {:else if col.id === 'blueprintName'}
                      <span class="text-zinc-300 font-mono text-[11px]">{entity.blueprintName}</span>
                    {:else if col.id === 'category'}
                      <span class="text-zinc-400">{entity.category}</span>
                    {:else if col.id === 'description'}
                      <span class="text-zinc-400 text-[11px] line-clamp-2 max-w-xs">{entity.description || '—'}</span>
                    {:else if col.id === 'lastMutatedSeqNumber'}
                      <span class="text-zinc-500 font-mono text-[11px]">#{entity.lastMutatedSeqNumber}</span>
                    {:else if cellInfo.isFormula}
                      <!-- Live Formula Cell -->
                      {#if cellInfo.text !== '—'}
                        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/50 text-amber-300 font-mono text-xs font-bold">
                          <Calculator class="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{cellInfo.text}</span>
                        </div>
                      {:else}
                        <span class="text-zinc-600 text-xs font-mono">—</span>
                      {/if}
                    {:else if cellInfo.subValues}
                      <!-- Sub-blueprint structured values (e.g. cultivation or affection) -->
                      <div class="flex flex-wrap gap-1 text-[11px]">
                        {#each cellInfo.subValues as subItem}
                          <span class="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <span class="text-zinc-500 capitalize">{subItem.label}:</span> {subItem.value}
                          </span>
                        {/each}
                      </div>
                    {:else}
                      <!-- Regular Property Value -->
                      <span class="text-zinc-200 text-xs">{cellInfo.text}</span>
                    {/if}
                  </td>
                {/each}

                <!-- Actions Column -->
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
