<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import {
    ArrowLeft,
    Check,
    Trash2,
    Boxes,
    Sparkles,
    Calculator,
    Heart,
    Link2,
    ListFilter,
    Shield,
    Hash,
    Layers,
    Clock,
  } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import Field from '$lib/components/ui/field.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import {
    worldStore,
    type EntityItem,
    type BlueprintDef,
  } from '$lib/stores/worldStore.svelte';
  import { evaluateFormula } from '$lib/engine/formulaEngine';

  const entityId = $derived(page.params.id);
  const entity = $derived(worldStore.getEntity(entityId));
  const blueprint = $derived(
    entity ? worldStore.getBlueprint(entity.blueprintId) : undefined
  );

  let name = $state('');
  let description = $state('');
  let properties = $state<Record<string, any>>({});
  let saveMessage = $state<string | null>(null);

  $effect(() => {
    if (entity) {
      name = entity.name;
      description = entity.description || '';
      properties = JSON.parse(JSON.stringify(entity.properties || {}));
    }
  });

  function formatEnumOptions(options?: Array<string | { label: string; value: string; power?: number; numericValue?: number }>) {
    if (!options) return [];
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      const power = opt.power ?? opt.numericValue;
      return {
        value: opt.value,
        label: power !== undefined ? `${opt.label} (Power: ${power})` : opt.label,
      };
    });
  }

  // Real-time live computed formulas for the entity being inspected
  let liveComputedFormulas = $derived.by(() => {
    if (!blueprint || !entity) return {};
    const dummyEntity = {
      ...entity,
      properties: $state.snapshot(properties),
    };
    const results = worldStore.evaluateEntityFormulas(dummyEntity, blueprint);
    const computed: Record<string, { value: number; formatted: string; expr: string }> = {};

    for (const field of blueprint.fields) {
      if (field.fieldType === 'FORMULA' && field.formulaExpression) {
        const val = results[field.name] ?? 0;
        computed[field.name] = {
          value: val,
          formatted: String(val),
          expr: field.formulaExpression,
        };
      }
    }

    return computed;
  });

  function handleSaveEntity() {
    if (!entity || !name.trim()) return;

    worldStore.updateEntity(entity.id, {
      name: name.trim(),
      description: description.trim(),
      properties: { ...properties },
    });

    saveMessage = 'Entity state & formulas successfully updated!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleDeleteEntity() {
    if (!entity) return;
    if (confirm(`Are you sure you want to permanently delete "${entity.name}"?`)) {
      worldStore.deleteEntity(entity.id);
      goto('/world/entities');
    }
  }
</script>

{#if !entity}
  <div class="max-w-4xl mx-auto space-y-6">
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Entities', href: '/world/entities' },
        { label: 'Entity Not Found' },
      ]}
    />
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center space-y-3">
      <Shield class="w-8 h-8 text-zinc-600 mx-auto" />
      <h2 class="text-base font-bold text-zinc-300">Entity Not Found</h2>
      <a href="/world/entities">
        <Button variant="outline" size="sm">Return to Entities Workbench</Button>
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-4xl mx-auto space-y-6 pb-16">
    <!-- Breadcrumb -->
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Universe Entities', href: '/world/entities' },
        { label: entity.name },
      ]}
    />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Boxes class="w-5 h-5 text-teal-400" />
          <h2 class="text-xl font-bold tracking-tight text-zinc-100">{entity.name}</h2>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-teal-400 font-medium">{entity.blueprintName}</span>
          <span class="text-zinc-600">·</span>
          <span class="text-zinc-400">{entity.category}</span>
          <span class="text-zinc-600">·</span>
          <span class="text-zinc-500 font-mono">Seq #{entity.lastMutatedSeqNumber}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a href="/world/entities">
          <Button variant="outline" size="sm">
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>All Entities</span>
          </Button>
        </a>
      </div>
    </div>

    <!-- Notification Alert -->
    {#if saveMessage}
      <div class="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
        <Check class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{saveMessage}</span>
      </div>
    {/if}

    <!-- Live Computed Formulas Banner -->
    {#if Object.keys(liveComputedFormulas).length > 0}
      <div class="bg-gradient-to-r from-amber-950/30 to-zinc-900 rounded-lg border border-amber-900/40 p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Calculator class="w-4 h-4 text-amber-400" />
            <span>Live Evaluated Mathematical Formulas</span>
          </h3>
          <span class="text-[10px] text-amber-500/80 font-mono">Auto-evaluates on property changes</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each Object.entries(liveComputedFormulas) as [fKey, fData]}
            <div class="p-3.5 rounded bg-black/40 border border-amber-900/50 space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-zinc-300 capitalize">{fKey.replace(/_/g, ' ')}</span>
                <span class="text-sm font-bold font-mono text-amber-300">{fData.formatted}</span>
              </div>
              <div class="text-[10px] font-mono text-amber-500/70 line-clamp-1">
                {fData.expr}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Primary Entity Overview -->
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Boxes class="w-4 h-4 text-teal-400" />
        <span>Entity Identity</span>
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field id="entity-name" label="Entity Name">
          <Input id="entity-name" bind:value={name} class="w-full text-xs" />
        </Field>

        <Field id="entity-bp" label="Blueprint Archetype">
          <Input id="entity-bp" value={entity.blueprintName} disabled class="w-full text-xs opacity-70" />
        </Field>
      </div>

      <Field id="entity-desc" label="Description & Lore">
        <Textarea
          id="entity-desc"
          bind:value={description}
          rows={2}
          class="w-full text-xs"
        />
      </Field>
    </div>

    <!-- Dynamic Blueprint Properties Workbench -->
    {#if blueprint}
      <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
        <div class="border-b border-zinc-800 pb-3">
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-teal-400" />
            <span>Blueprint Attributes & Dynamic Fields</span>
          </h3>
          <p class="text-xs text-zinc-500 mt-0.5">
            Modify state values to trigger real-time formula updates and causal state folds.
          </p>
        </div>

        <div class="space-y-4">
          {#each blueprint.fields as field}
            <!-- 1. ENUM FIELD (e.g. Gender with Male/Female) -->
            {#if field.fieldType === 'ENUM'}
              <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-1.5">
                <Label class="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <ListFilter class="w-3.5 h-3.5 text-teal-400" />
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-zinc-500">({field.name})</span>
                </Label>

                <div class="max-w-md pt-1">
                  <Select
                    bind:value={properties[field.name]}
                    options={formatEnumOptions(field.options)}
                  />
                </div>
              </div>

            <!-- 2. BLUEPRINT REFERENCE (Sub-Blueprints e.g. Cultivation or Affection) -->
            {:else if field.fieldType === 'BLUEPRINT_REF'}
              {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
              <div class="p-4 rounded-lg border border-cyan-950/80 bg-cyan-950/15 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Link2 class="w-4 h-4 text-cyan-400" />
                    <span>{field.label}</span>
                    <span class="text-[11px] font-normal text-zinc-400">
                      (Sub-Blueprint: {targetBp ? targetBp.name : field.targetBlueprintName})
                    </span>
                  </div>
                </div>

                {#if targetBp && targetBp.blueprintClass === 'SECOND_CLASS' && properties[field.name]}
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {#each targetBp.fields as subF}
                      {#if subF.fieldType !== 'FORMULA'}
                        <div class="space-y-1 p-2.5 rounded bg-zinc-900 border border-zinc-800">
                          <span class="block text-[11px] font-medium text-zinc-300">
                            {subF.label}
                            {#if subF.unit}<span class="text-zinc-500">({subF.unit})</span>{/if}
                          </span>
                          {#if subF.fieldType === 'ENUM'}
                            <Select
                              bind:value={properties[field.name][subF.name]}
                              options={formatEnumOptions(subF.options)}
                            />
                          {:else if subF.fieldType === 'NUMBER'}
                            <Input
                              type="number"
                              min={subF.min}
                              max={subF.max}
                              step={subF.step || 1}
                              bind:value={properties[field.name][subF.name]}
                              class="text-xs"
                            />
                          {:else}
                            <Input
                              bind:value={properties[field.name][subF.name]}
                              class="text-xs"
                            />
                          {/if}
                        </div>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>

            <!-- 3. FORMULA DISPLAY -->
            {:else if field.fieldType === 'FORMULA'}
              <!-- Handled in top live formula banner -->

            <!-- 4. NUMBER FIELD -->
            {:else if field.fieldType === 'NUMBER'}
              <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-1.5">
                <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Hash class="w-3.5 h-3.5 text-emerald-400" />
                  <span>{field.label}</span>
                  {#if field.unit}<span class="text-zinc-500 font-mono">({field.unit})</span>{/if}
                </Label>
                {#if field.min !== undefined && field.max !== undefined}
                    <span class="text-[10px] font-mono text-zinc-500">Range: [{field.min} to {field.max}]</span>
                  {/if}
                </div>

                <div class="max-w-xs">
                  <Input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                    bind:value={properties[field.name]}
                    class="text-xs font-mono"
                  />
                </div>
              </div>

            <!-- 5. STRING / TEXT FIELD -->
            {:else}
              <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-1.5">
                <span class="block text-xs font-medium text-zinc-300">
                  {field.label}
                </span>
                <Input
                  bind:value={properties[field.name]}
                  class="text-xs"
                />
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Save Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-zinc-800">
      <Button variant="outline" size="sm" onclick={handleDeleteEntity} class="text-red-400 hover:bg-red-950/50">
        <Trash2 class="w-3.5 h-3.5" />
        <span>Delete Entity</span>
      </Button>

      <Button variant="default" size="sm" onclick={handleSaveEntity}>
        <Check class="w-3.5 h-3.5" />
        <span>Save Entity State</span>
      </Button>
    </div>
  </div>
{/if}
