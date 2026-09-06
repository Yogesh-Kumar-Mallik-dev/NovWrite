<script lang="ts">
  import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Boxes,
    Layers,
    Calculator,
    Link2,
    ListFilter,
    Hash,
    Sparkles,
  } from 'lucide-svelte';
  import { Button, Input, ConfirmDialog, EmptyState } from '$lib/components/ui';
  import { toast } from '$lib/stores/toastStore.svelte';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card';
  import { worldStore, type BlueprintClass, type BlueprintDef, type DynamicFieldDef } from '$lib/stores/worldStore.svelte';

  let searchQuery = $state('');
  let selectedClassFilter = $state<'ALL' | BlueprintClass>('ALL');
  let selectedCategoryFilter = $state<string>('ALL');

  // Deletion Confirmation Dialog State
  let bpToDelete = $state<{ id: string; name: string } | null>(null);

  // Categories list
  const allCategories = $derived(
    Array.from(new Set<string>(worldStore.blueprints.map((b: BlueprintDef) => b.category))).sort()
  );

  const filteredBlueprints = $derived(
    worldStore.blueprints.filter((b: BlueprintDef) => {
      const matchClass = selectedClassFilter === 'ALL' || b.blueprintClass === selectedClassFilter;
      const matchCat = selectedCategoryFilter === 'ALL' || b.category === selectedCategoryFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.fields.some((f: DynamicFieldDef) => f.name.toLowerCase().includes(q) || f.label.toLowerCase().includes(q));

      return matchClass && matchCat && matchSearch;
    })
  );

  function handleDelete(id: string, name: string) {
    bpToDelete = { id, name };
  }

  function confirmDeleteBp() {
    if (bpToDelete) {
      worldStore.deleteBlueprint(bpToDelete.id);
      toast.success("Blueprint Deleted", `Blueprint "${bpToDelete.name}" was removed from the universe schema registry.`);
      bpToDelete = null;
    }
  }
</script>

<div class="space-y-6">
  <!-- Header & Actions -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
        <Boxes class="w-5 h-5 text-primary" />
        <span>Blueprints & Schemas Workbench</span>
      </h2>
      <p class="text-xs text-muted-foreground mt-0.5">
        Architect 1st-Class universe archetypes and 2nd-Class sub-blueprints with dynamic enums, references, and mathematical formulas.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button size="sm" href="/world/schemas/create">
        <Plus class="w-3.5 h-3.5" />
        <span>Create Blueprint from Scratch</span>
      </Button>
    </div>
  </div>

  <!-- Filters Bar -->
  <Card class="p-3.5 border-border bg-card/75 space-y-3">
    <div class="flex flex-col md:flex-row items-center gap-3">
      <!-- Search Input -->
      <div class="relative flex-1 w-full">
        <Search class="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        <Input
          bind:value={searchQuery}
          placeholder="Filter blueprints by name, category, or field name..."
          class="pl-9 h-9 text-xs w-full"
        />
      </div>

      <!-- Class Segmented Control -->
      <div class="inline-flex rounded-lg border border-border bg-muted/60 p-0.5 w-full md:w-auto">
        <button
          type="button"
          onclick={() => (selectedClassFilter = 'ALL')}
          class={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
            selectedClassFilter === 'ALL'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({worldStore.blueprints.length})
        </button>
        <button
          type="button"
          onclick={() => (selectedClassFilter = 'FIRST_CLASS')}
          class={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
            selectedClassFilter === 'FIRST_CLASS'
              ? 'bg-secondary text-secondary-foreground border border-border font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Boxes class="w-3.5 h-3.5 text-primary" />
          <span>1st-Class ({worldStore.getFirstClassBlueprints().length})</span>
        </button>
        <button
          type="button"
          onclick={() => (selectedClassFilter = 'SECOND_CLASS')}
          class={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
            selectedClassFilter === 'SECOND_CLASS'
              ? 'bg-secondary text-secondary-foreground border border-border font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers class="w-3.5 h-3.5 text-cyan-500" />
          <span>2nd-Class ({worldStore.getSecondClassBlueprints().length})</span>
        </button>
      </div>
    </div>

    <!-- Category Pills Filter -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1">
      <span class="text-[11px] text-muted-foreground mr-1">Category:</span>
      <button
        type="button"
        onclick={() => (selectedCategoryFilter = 'ALL')}
        class={`text-xs px-2.5 py-0.5 rounded-md transition cursor-pointer ${
          selectedCategoryFilter === 'ALL'
            ? 'bg-secondary text-secondary-foreground font-semibold border border-border'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        All
      </button>
      {#each allCategories as cat}
        <button
          type="button"
          onclick={() => (selectedCategoryFilter = cat)}
          class={`text-xs px-2.5 py-0.5 rounded-md transition cursor-pointer ${
            selectedCategoryFilter === cat
              ? 'bg-secondary text-secondary-foreground font-semibold border border-border'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {cat}
        </button>
      {/each}
    </div>
  </Card>

  <!-- Blueprints Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#if filteredBlueprints.length === 0}
      <div class="col-span-1 md:col-span-2">
        <EmptyState
          icon={Boxes}
          title={worldStore.blueprints.length === 0 ? "No Blueprints Defined" : "No Matching Blueprints"}
          description={worldStore.blueprints.length === 0
            ? "Create custom schema blueprints to architect universe archetypes, nested sub-schemas, dynamic enums, and mathematical formula models."
            : "No blueprints match your active class, category, or search filters."}
          actionText={worldStore.blueprints.length === 0 ? "+ Create First Blueprint" : "Clear Filters"}
          actionHref={worldStore.blueprints.length === 0 ? "/world/schemas/create" : undefined}
          onAction={worldStore.blueprints.length === 0 ? undefined : () => { searchQuery = ''; selectedClassFilter = 'ALL'; selectedCategoryFilter = 'ALL'; }}
          class="py-14"
        />
      </div>
    {:else}
      {#each filteredBlueprints as bp (bp.id)}
        <Card class="border-border bg-card p-5 space-y-4 hover:border-border/80 transition flex flex-col justify-between">
          <div class="space-y-3">
            <!-- Header with Class Indicator & Category -->
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  {#if bp.blueprintClass === 'FIRST_CLASS'}
                    <Boxes class="w-4 h-4 text-primary" />
                  {:else}
                    <Layers class="w-4 h-4 text-cyan-500" />
                  {/if}
                  <h3 class="text-sm font-bold text-foreground">{bp.name}</h3>
                </div>
                <div class="flex items-center gap-2 text-[11px]">
                  <span class={`font-medium ${bp.blueprintClass === 'FIRST_CLASS' ? 'text-primary' : 'text-cyan-500'}`}>
                    {bp.blueprintClass === 'FIRST_CLASS' ? '1st-Class Archetype' : '2nd-Class Sub-Schema'}
                  </span>
                  <span class="text-muted-foreground/60">·</span>
                  <span class="text-muted-foreground">{bp.category}</span>
                </div>
              </div>

              {#if bp.isSystemDefault}
                <span class="text-[10px] text-muted-foreground font-mono">System Default</span>
              {/if}
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed line-clamp-2">{bp.description}</p>

            <!-- Dynamic Fields Summary -->
            <div class="pt-2 border-t border-border space-y-2">
              <div class="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>Dynamic Fields ({bp.fields.length})</span>
              </div>

              <div class="flex flex-wrap gap-1.5">
                {#each bp.fields as field}
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 border border-border text-[11px] font-mono text-foreground">
                    {#if field.fieldType === 'FORMULA'}
                      <Calculator class="w-3 h-3 text-amber-500" />
                    {:else if field.fieldType === 'ENUM'}
                      <ListFilter class="w-3 h-3 text-primary" />
                    {:else if field.fieldType === 'VALUE_TYPE'}
                      <Sparkles class="w-3 h-3 text-primary" />
                    {:else if field.fieldType === 'ARRAY'}
                      <ListFilter class="w-3 h-3 text-indigo-500" />
                    {:else if field.fieldType === 'BLUEPRINT_REF'}
                      <Link2 class="w-3 h-3 text-cyan-500" />
                    {:else if field.fieldType === 'ARRAY_REF'}
                      <Link2 class="w-3 h-3 text-cyan-400" />
                    {:else if field.fieldType === 'NUMBER'}
                      <Hash class="w-3 h-3 text-emerald-500" />
                    {/if}
                    <span>{field.name}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Card Footer Actions -->
          <div class="pt-3 border-t border-border flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onclick={() => handleDelete(bp.id, bp.name)}
              class="text-muted-foreground hover:text-destructive px-2 h-7"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <div class="flex items-center gap-2">
              {#if bp.blueprintClass === 'FIRST_CLASS'}
                <Button href={`/world/entities/create?blueprintId=${bp.id}`} variant="secondary" size="sm" class="h-7 text-xs">
                  <Plus class="w-3 h-3" />
                  <span>New Entity</span>
                </Button>
              {/if}

              <Button href={`/world/schemas/${bp.id}`} variant="outline" size="sm" class="h-7 text-xs">
                <Edit3 class="w-3 h-3" />
                <span>Inspect & Edit</span>
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    {/if}
  </div>

  <!-- Delete Blueprint Confirmation Dialog -->
  <ConfirmDialog
    open={bpToDelete !== null}
    title="Delete Blueprint"
    description={`Are you sure you want to permanently delete the "${bpToDelete?.name}" blueprint? All schema fields, formulas, and references for this blueprint will be removed from the schema registry.`}
    confirmText="Delete Blueprint"
    onConfirm={confirmDeleteBp}
    onCancel={() => (bpToDelete = null)}
  />
</div>

