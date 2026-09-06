<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    ArrowLeft,
    Check,
    Boxes,
    Sparkles,
    Calculator,
    Heart,
    Link2,
    ListFilter,
    Shield,
    Hash,
    Layers,
    Edit3,
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
    type BlueprintDef,
    type DynamicFieldDef,
  } from '$lib/stores/worldStore.svelte';
  import { evaluateFormula } from '$lib/engine/formulaEngine';

  // Check if blueprintId was passed in query params
  const initialBpId = page.url.searchParams.get('blueprintId') || '';
  const firstClassBlueprints = $derived(worldStore.getFirstClassBlueprints());

  let selectedBlueprintId = $state(initialBpId);

  $effect(() => {
    if (!selectedBlueprintId && firstClassBlueprints.length > 0) {
      selectedBlueprintId = firstClassBlueprints[0].id;
    }
  });

  let selectedBlueprint = $derived(
    worldStore.getBlueprint(selectedBlueprintId)
  );

  let name = $state('');
  let description = $state('');
  let properties = $state<Record<string, any>>({});

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

  function getDefaultOptionValue(options?: Array<string | { label: string; value: string; power?: number; numericValue?: number }>): string {
    if (!options || options.length === 0) return '';
    const first = options[0];
    return typeof first === 'object' ? first.value : first;
  }

  // Initialize properties based on active blueprint fields
  $effect(() => {
    if (selectedBlueprint) {
      const initialProps: Record<string, any> = {};

      for (const field of selectedBlueprint.fields) {
        if (field.fieldType === 'BLUEPRINT_REF' && field.targetBlueprintId) {
          const targetBp = worldStore.getBlueprint(field.targetBlueprintId);
          if (targetBp && targetBp.blueprintClass === 'SECOND_CLASS') {
            // Nested sub-blueprint initial values
            const subProps: Record<string, any> = {};
            for (const subF of targetBp.fields) {
              if (subF.defaultValue !== undefined) {
                subProps[subF.name] = subF.defaultValue;
              } else if (subF.fieldType === 'NUMBER') {
                subProps[subF.name] = subF.min || 0;
              } else if (subF.fieldType === 'ENUM' && subF.options) {
                subProps[subF.name] = getDefaultOptionValue(subF.options);
              } else {
                subProps[subF.name] = '';
              }
            }
            initialProps[field.name] = subProps;
          } else {
            initialProps[field.name] = '';
          }
        } else if (field.defaultValue !== undefined) {
          initialProps[field.name] = field.defaultValue;
        } else if (field.fieldType === 'NUMBER') {
          initialProps[field.name] = field.min || 0;
        } else if (field.fieldType === 'ENUM' && field.options) {
          initialProps[field.name] = getDefaultOptionValue(field.options);
        } else {
          initialProps[field.name] = '';
        }
      }

      properties = initialProps;
    }
  });

  // Real-time live computed formulas for the entity being created
  let liveComputedFormulas = $derived.by(() => {
    if (!selectedBlueprint) return {};
    const dummyEntity = {
      id: 'preview',
      name: name || 'Draft Entity',
      blueprintId: selectedBlueprint.id,
      blueprintName: selectedBlueprint.name,
      category: selectedBlueprint.category,
      properties: $state.snapshot(properties),
      lastMutatedSeqNumber: 0,
    };
    const results = worldStore.evaluateEntityFormulas(dummyEntity, selectedBlueprint);
    const computed: Record<string, { value: number; formatted: string; expr: string }> = {};

    for (const field of selectedBlueprint.fields) {
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

  function handleCreateEntity() {
    if (!name.trim()) {
      alert('Entity Name is required.');
      return;
    }
    if (!selectedBlueprint) {
      alert('Please select a valid blueprint archetype.');
      return;
    }

    worldStore.addEntity({
      name: name.trim(),
      blueprintId: selectedBlueprint.id,
      blueprintName: selectedBlueprint.name,
      category: selectedBlueprint.category,
      description: description.trim(),
      properties: { ...properties },
    });

    goto('/world/entities');
  }
</script>

<div class="max-w-4xl mx-auto space-y-6 pb-16">
  <!-- Breadcrumb -->
  <Breadcrumb
    items={[
      { label: 'World Studio', href: '/world' },
      { label: 'Universe Entities', href: '/world/entities' },
      { label: 'Instantiate New Entity' },
    ]}
  />

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Boxes class="w-5 h-5 text-teal-400" />
        <span>Instantiate Universe Entity</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-1">
        Create an entity instance bound to a 1st-Class Blueprint with live evaluated mathematical formulas.
      </p>
    </div>
    <a href="/world/entities">
      <Button variant="outline" size="sm">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Entities</span>
      </Button>
    </a>
  </div>

  <!-- Entity Meta Config & Blueprint Binding -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
    <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
      <Boxes class="w-4 h-4 text-teal-400" />
      <span>Blueprint Archetype & Identity</span>
    </h3>

    <!-- Blueprint Selector -->
    <div>
      <span class="block text-xs font-medium text-zinc-400 mb-1.5">Select 1st-Class Blueprint Archetype</span>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {#each firstClassBlueprints as bp}
          <button
            type="button"
            onclick={() => (selectedBlueprintId = bp.id)}
            class={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
              selectedBlueprintId === bp.id
                ? 'border-teal-500 bg-teal-950/30 ring-1 ring-teal-500/50'
                : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
            }`}
          >
            <div>
              <div class="font-bold text-xs text-zinc-100">{bp.name}</div>
              <div class="text-[11px] text-zinc-400 mt-1">{bp.category}</div>
            </div>
            <div class="text-[10px] text-teal-400 font-mono mt-2">{bp.fields.length} dynamic fields</div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Entity Name & Description -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field id="entity-name" label="Entity Name" required>
        <Input
          id="entity-name"
          bind:value={name}
          placeholder="e.g. Eldrin the Spellblade, Dawnbreaker Blade"
          class="w-full text-xs"
        />
      </Field>

      <Field id="entity-cat" label="Domain / Category">
        <Input
          id="entity-cat"
          value={selectedBlueprint ? selectedBlueprint.category : 'General'}
          disabled
          class="w-full text-xs opacity-80"
        />
      </Field>
    </div>

    <Field id="entity-desc" label="Lore Background & Description">
      <Textarea
        id="entity-desc"
        bind:value={description}
        rows={2}
        placeholder="Lore summary and narrative role of this entity..."
        class="w-full text-xs"
      />
    </Field>
  </div>

  <!-- Dynamic Fields Form -->
  {#if selectedBlueprint}
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-teal-400" />
            <span>Blueprint Template Options ({selectedBlueprint.name})</span>
          </h3>
          <p class="text-xs text-zinc-500 mt-0.5">
            Instantiate concrete property values from options defined in the <strong>{selectedBlueprint.name}</strong> template.
          </p>
        </div>

        <a href={`/world/schemas/${selectedBlueprint.id}`} target="_blank" class="shrink-0">
          <Button variant="outline" size="sm" class="h-7 text-[11px] px-2.5">
            <Edit3 class="w-3 h-3 text-teal-400" />
            <span>Edit Blueprint Template</span>
          </Button>
        </a>
      </div>

      <!-- Properties Grid -->
      <div class="space-y-4">
        {#each selectedBlueprint.fields as field}
          <!-- 1. ENUM FIELD (e.g. Gender with options "Male", "Female") -->
          {#if field.fieldType === 'ENUM'}
            <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <ListFilter class="w-3.5 h-3.5 text-teal-400" />
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-zinc-500">({field.name})</span>
                </Label>
              </div>
              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}

              <div class="space-y-2 max-w-lg">
                <Select
                  bind:value={properties[field.name]}
                  options={formatEnumOptions(field.options)}
                />

                {#if field.options && field.options.length > 0}
                  <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span class="text-[10px] text-zinc-500 mr-1">Template Options:</span>
                    {#each field.options as opt}
                      {@const optVal = typeof opt === 'string' ? opt : opt.value}
                      {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                      {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                      {@const isSelected = properties[field.name] === optVal || properties[field.name] === optLabel}
                      <button
                        type="button"
                        onclick={() => (properties[field.name] = optVal)}
                        class={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-teal-950 text-teal-300 border border-teal-700 ring-1 ring-teal-500/50'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <span>{optLabel}</span>
                        {#if optPower !== undefined}
                          <span class="text-[9px] font-mono opacity-80">({optPower})</span>
                        {/if}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

          <!-- 2. BLUEPRINT REFERENCE (e.g. Cultivation Matrix, Romantic Affection Scale) -->
          {:else if field.fieldType === 'BLUEPRINT_REF'}
            {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
            <div class="p-4 rounded-lg border border-cyan-950/80 bg-cyan-950/15 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Link2 class="w-4 h-4 text-cyan-400" />
                  <span>{field.label}</span>
                  <span class="text-[11px] font-normal text-zinc-400">
                    (Referencing: {targetBp ? targetBp.name : field.targetBlueprintName})
                  </span>
                </div>
              </div>

              <!-- If referencing a 2nd-Class Sub-Blueprint, render its nested template fields -->
              {#if targetBp && targetBp.blueprintClass === 'SECOND_CLASS'}
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {#each targetBp.fields as subF}
                    {#if subF.fieldType !== 'FORMULA'}
                      <div class="space-y-1.5 p-2.5 rounded bg-zinc-900 border border-zinc-800">
                        <span class="block text-[11px] font-medium text-zinc-300">
                          {subF.label}
                          {#if subF.unit}<span class="text-zinc-500">({subF.unit})</span>{/if}
                        </span>
                        {#if subF.fieldType === 'ENUM'}
                          <div class="space-y-1.5">
                            <Select
                              bind:value={properties[field.name][subF.name]}
                              options={formatEnumOptions(subF.options)}
                            />
                            {#if subF.options && subF.options.length > 0}
                              <div class="flex flex-wrap gap-1 pt-0.5">
                                {#each subF.options as opt}
                                  {@const optVal = typeof opt === 'string' ? opt : opt.value}
                                  {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                                  {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                                  {@const isSelected = properties[field.name][subF.name] === optVal || properties[field.name][subF.name] === optLabel}
                                  <button
                                    type="button"
                                    onclick={() => (properties[field.name][subF.name] = optVal)}
                                    class={`px-1.5 py-0.5 rounded text-[10px] transition flex items-center gap-1 ${
                                      isSelected
                                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 ring-1 ring-cyan-500/50'
                                        : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  >
                                    <span>{optLabel}</span>
                                    {#if optPower !== undefined}
                                      <span class="text-[8px] font-mono opacity-80">({optPower})</span>
                                    {/if}
                                  </button>
                                {/each}
                              </div>
                            {/if}
                          </div>
                        {:else if subF.fieldType === 'NUMBER'}
                          <Input
                            type="number"
                            min={subF.min}
                            max={subF.max}
                            step={subF.step || 1}
                            bind:value={properties[field.name][subF.name]}
                            class="text-xs"
                          />
                        {:else if subF.fieldType === 'BOOLEAN'}
                          <Select
                            bind:value={properties[field.name][subF.name]}
                            options={[
                              { value: 'true', label: 'True / Enabled' },
                              { value: 'false', label: 'False / Disabled' },
                            ]}
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
              {:else if targetBp && targetBp.blueprintClass === 'FIRST_CLASS'}
                <!-- If referencing a 1st-Class Blueprint, allow selecting an instantiated entity instance -->
                {@const candidateEntities = worldStore.entities.filter((e) => e.blueprintId === targetBp.id)}
                <div class="space-y-1.5 pt-1">
                  <span class="block text-[11px] text-zinc-400">
                    Select an instantiated {targetBp.name} entity instance:
                  </span>
                  <div class="max-w-md">
                    <Select
                      bind:value={properties[field.name]}
                      options={[
                        { value: '', label: 'None (Unassigned)' },
                        ...candidateEntities.map((e) => ({
                          value: e.id,
                          label: `${e.name} (${e.category})`,
                        })),
                      ]}
                    />
                  </div>
                </div>
              {/if}
            </div>

          <!-- 3. MATHEMATICAL & LOGICAL FORMULA (Real-time Live Computation Display) -->
          {:else if field.fieldType === 'FORMULA'}
            {@const computedInfo = liveComputedFormulas[field.name]}
            <div class="p-4 rounded-lg border border-amber-900/50 bg-amber-950/20 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Calculator class="w-4 h-4 text-amber-400" />
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-zinc-500">({field.name})</span>
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/80 border border-amber-800/80 text-amber-200 font-mono text-sm font-bold">
                  <span>Live Value:</span>
                  <span class="text-white text-base">{computedInfo ? computedInfo.formatted : '0'}</span>
                </div>
              </div>

              {#if field.formulaExpression}
                <div class="text-[11px] font-mono text-amber-400/80 pt-1">
                  Formula: {field.formulaExpression}
                </div>
              {/if}
            </div>

          <!-- 4. NUMBER FIELD (with step, bounds, unit) -->
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

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
    <a href="/world/entities">
      <Button variant="outline" size="sm">Cancel</Button>
    </a>
    <Button variant="default" size="sm" onclick={handleCreateEntity}>
      <Check class="w-3.5 h-3.5" />
      <span>Instantiate Entity</span>
    </Button>
  </div>
</div>
