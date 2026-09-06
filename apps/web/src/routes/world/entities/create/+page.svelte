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
    User,
    Sword,
    MapPin,
    Zap,
    Scale,
    Info,
    ChevronRight,
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

  function getArchetypeIcon(bp?: BlueprintDef) {
    if (!bp) return Boxes;
    const cat = (bp.category || '').toLowerCase();
    const nm = (bp.name || '').toLowerCase();
    if (
      cat.includes('char') ||
      nm.includes('cultivator') ||
      nm.includes('char') ||
      nm.includes('hero') ||
      nm.includes('protagonist')
    ) {
      return User;
    }
    if (
      cat.includes('relic') ||
      cat.includes('arm') ||
      cat.includes('weapon') ||
      nm.includes('weapon') ||
      nm.includes('relic') ||
      nm.includes('artifact')
    ) {
      return Sword;
    }
    if (
      cat.includes('cosmo') ||
      cat.includes('geo') ||
      cat.includes('loc') ||
      nm.includes('sanctuary') ||
      nm.includes('realm') ||
      nm.includes('location') ||
      nm.includes('peak')
    ) {
      return MapPin;
    }
    return Boxes;
  }

  function getArchetypeContext(bp?: BlueprintDef) {
    if (!bp) {
      return {
        archetypeLabel: 'Universe Entity',
        nameLabel: 'Entity Name',
        namePlaceholder: 'e.g. Lin Fan, Heavensbane Spear, Azure Cloud Peak',
        domainLabel: 'Domain / Category',
        loreLabel: 'Lore Background & Narrative Role',
        lorePlaceholder:
          'Lore summary, background origins, and narrative significance in your universe...',
      };
    }

    const catLower = (bp.category || '').toLowerCase();
    const nameLower = (bp.name || '').toLowerCase();

    if (
      catLower.includes('char') ||
      nameLower.includes('cultivator') ||
      nameLower.includes('char') ||
      nameLower.includes('hero') ||
      nameLower.includes('protagonist')
    ) {
      return {
        archetypeLabel: 'Character / Cultivator',
        nameLabel: 'Character / Cultivator Name',
        namePlaceholder: 'e.g. Lin Fan, Xiao Yan, Gu Changge, Meng Hao, Han Li',
        domainLabel: 'Cultivation Faction / Domain',
        loreLabel: 'Character Background, Personality & Story Arc',
        lorePlaceholder:
          'Character origins, personality traits, martial dao pursuit, spiritual bloodline, and narrative role in the novel...',
      };
    }

    if (
      catLower.includes('relic') ||
      catLower.includes('arm') ||
      catLower.includes('weapon') ||
      nameLower.includes('weapon') ||
      nameLower.includes('relic') ||
      nameLower.includes('artifact')
    ) {
      return {
        archetypeLabel: 'Sacred Relic & Weapon',
        nameLabel: 'Artifact / Sacred Relic Name',
        namePlaceholder:
          'e.g. Heavensbane Spear, Void-Sundering Lotus, Solar Emperor Bell, Celestial Frost Blade',
        domainLabel: 'Armament Classification',
        loreLabel: 'Forging Lore, Ancient Masters & Spirit Awakening',
        lorePlaceholder:
          'Forging origin, ancient lineage, awakening of the weapon soul, and past legendary wielders...',
      };
    }

    if (
      catLower.includes('cosmo') ||
      catLower.includes('geo') ||
      catLower.includes('loc') ||
      nmIsLocation(nameLower)
    ) {
      return {
        archetypeLabel: 'Sanctuary & Spiritual Realm',
        nameLabel: 'Sanctuary / Location Name',
        namePlaceholder:
          'e.g. Azure Cloud Peak, Black Dragon Abyss, Nine Heavens Void, Kunlun Sanctuary',
        domainLabel: 'Cosmological Domain',
        loreLabel: 'Geographical Lore, Qi Formations & Regional Sects',
        lorePlaceholder:
          'Geographical terrain, spiritual Qi density, ancient protective formations, indigenous sects, and regional significance...',
      };
    }

    return {
      archetypeLabel: bp.name,
      nameLabel: `${bp.name} Name`,
      namePlaceholder: `e.g. Name of this ${bp.name.toLowerCase()} instance...`,
      domainLabel: 'Classification / Domain',
      loreLabel: `${bp.name} Lore Background & Narrative Role`,
      lorePlaceholder: `Origins, universe context, and narrative significance for this ${bp.name.toLowerCase()}...`,
    };
  }

  function nmIsLocation(nm: string) {
    return (
      nm.includes('sanctuary') ||
      nm.includes('realm') ||
      nm.includes('location') ||
      nm.includes('peak')
    );
  }

  let archetypeContext = $derived(getArchetypeContext(selectedBlueprint));
  let ArchetypeIcon = $derived(getArchetypeIcon(selectedBlueprint));

  function formatEnumOptions(
    options?: Array<
      string | { label: string; value: string; power?: number; numericValue?: number }
    >
  ) {
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

  function getDefaultOptionValue(
    options?: Array<
      string | { label: string; value: string; power?: number; numericValue?: number }
    >
  ): string {
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
                subProps[subF.name] = subF.min ?? 0;
              } else if (subF.fieldType === 'ENUM' && subF.options) {
                subProps[subF.name] = getDefaultOptionValue(subF.options);
              } else if (subF.fieldType === 'BOOLEAN') {
                subProps[subF.name] = 'false';
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
          initialProps[field.name] = field.min ?? 0;
        } else if (field.fieldType === 'ENUM' && field.options) {
          initialProps[field.name] = getDefaultOptionValue(field.options);
        } else if (field.fieldType === 'BOOLEAN') {
          initialProps[field.name] = 'false';
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
    const computed: Record<
      string,
      { value: number; formatted: string; expr: string; label: string }
    > = {};

    for (const field of selectedBlueprint.fields) {
      if (field.fieldType === 'FORMULA' && field.formulaExpression) {
        const val = results[field.name] ?? 0;
        computed[field.name] = {
          value: val,
          formatted: Number.isInteger(val) ? String(val) : val.toFixed(2),
          expr: field.formulaExpression,
          label: field.label || field.name,
        };
      }
    }

    return computed;
  });

  function handleCreateEntity() {
    if (!name.trim()) {
      alert(`${archetypeContext.nameLabel} is required.`);
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
        Instantiate concrete entity objects bound to 1st-Class Blueprints with interactive option pickers, sub-systems, and live evaluated formulas.
      </p>
    </div>
    <a href="/world/entities">
      <Button variant="outline" size="sm">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Entities</span>
      </Button>
    </a>
  </div>

  <!-- Blueprint Archetype Selector (The Class) -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Boxes class="w-4 h-4 text-teal-400" />
        <span>Select 1st-Class Blueprint Archetype</span>
      </h3>
      <span class="text-[11px] text-zinc-500 font-mono">1st-Class Schemas</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {#each firstClassBlueprints as bp}
        {@const Icon = getArchetypeIcon(bp)}
        {@const isSelected = selectedBlueprintId === bp.id}
        {@const formulaCount = bp.fields.filter((f) => f.fieldType === 'FORMULA').length}
        {@const refCount = bp.fields.filter((f) => f.fieldType === 'BLUEPRINT_REF').length}
        <button
          type="button"
          onclick={() => (selectedBlueprintId = bp.id)}
          class={`p-4 rounded-lg border text-left transition relative flex flex-col justify-between ${
            isSelected
              ? 'border-teal-500 bg-teal-950/30 ring-1 ring-teal-500/60 shadow-sm shadow-teal-950/50'
              : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50'
          }`}
        >
          <div>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class={`p-1.5 rounded ${isSelected ? 'bg-teal-900/50 text-teal-300' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Icon class="w-4 h-4" />
                </div>
                <div class="font-bold text-xs text-zinc-100">{bp.name}</div>
              </div>
              {#if isSelected}
                <span class="w-2 h-2 rounded-full bg-teal-400"></span>
              {/if}
            </div>
            <div class="text-[11px] text-zinc-400 mt-2 line-clamp-1">{bp.category}</div>
            <p class="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {bp.description}
            </p>
          </div>

          <div class="flex items-center gap-2 pt-3 mt-3 border-t border-zinc-800/80 text-[10px] font-mono">
            <span class="text-teal-400">{bp.fields.length} dynamic fields</span>
            {#if formulaCount > 0}
              <span class="text-amber-400">· {formulaCount} math formulas</span>
            {/if}
            {#if refCount > 0}
              <span class="text-cyan-400">· {refCount} sub-systems</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Entity Identity & Lore (Dynamic Context) -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
    <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <ArchetypeIcon class="w-4 h-4 text-teal-400" />
        <span>{archetypeContext.archetypeLabel} Identity</span>
      </h3>
      {#if selectedBlueprint}
        <span class="text-[11px] text-teal-400/90 font-medium px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800/50">
          Archetype: {selectedBlueprint.name}
        </span>
      {/if}
    </div>

    <!-- Entity Name & Domain -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field id="entity-name" label={archetypeContext.nameLabel} required>
        <Input
          id="entity-name"
          bind:value={name}
          placeholder={archetypeContext.namePlaceholder}
          class="w-full text-xs font-medium"
        />
      </Field>

      <Field id="entity-cat" label={archetypeContext.domainLabel}>
        <Input
          id="entity-cat"
          value={selectedBlueprint ? selectedBlueprint.category : 'General'}
          disabled
          class="w-full text-xs opacity-80 cursor-not-allowed"
        />
      </Field>
    </div>

    <!-- Contextual Lore Description -->
    <Field id="entity-desc" label={archetypeContext.loreLabel}>
      <Textarea
        id="entity-desc"
        bind:value={description}
        rows={3}
        placeholder={archetypeContext.lorePlaceholder}
        class="w-full text-xs leading-relaxed"
      />
    </Field>
  </div>

  <!-- Live Evaluated Mathematical Formulas (Live Sandbox) -->
  {#if Object.keys(liveComputedFormulas).length > 0}
    <div class="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 rounded-lg border border-amber-900/50 p-5 space-y-3 shadow-md shadow-amber-950/20">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Calculator class="w-4 h-4 text-amber-400" />
          <span>Live Evaluated Mathematical Formulas</span>
        </h3>
        <span class="text-[10px] text-amber-400/80 font-mono bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
          Evaluates instantly on option & numeric changes
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {#each Object.entries(liveComputedFormulas) as [fKey, fData]}
          <div class="p-3.5 rounded-lg bg-black/50 border border-amber-900/60 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-zinc-200">{fData.label}</span>
              <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-950/90 border border-amber-700/80 text-amber-300 font-mono text-sm font-bold">
                <span>{fData.formatted}</span>
              </div>
            </div>
            <div class="text-[10px] font-mono text-amber-500/80 pt-1 line-clamp-1" title={fData.expr}>
              Formula: {fData.expr}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Dynamic Blueprint Properties Form (The Concrete Object Values) -->
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
          <!-- 1. ENUM FIELD (e.g. Gender with options "Male", "Female", Spiritual Roots) -->
          {#if field.fieldType === 'ENUM'}
            <div class="p-4 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-2.5">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <ListFilter class="w-3.5 h-3.5 text-teal-400" />
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-zinc-500">({field.name})</span>
                </Label>
              </div>
              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}

              <div class="space-y-2 max-w-xl">
                <Select
                  bind:value={properties[field.name]}
                  options={formatEnumOptions(field.options)}
                />

                {#if field.options && field.options.length > 0}
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-[10px] text-zinc-500 mr-1 font-medium">Quick Select:</span>
                    {#each field.options as opt}
                      {@const optVal = typeof opt === 'string' ? opt : opt.value}
                      {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                      {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                      {@const isSelected = properties[field.name] === optVal || properties[field.name] === optLabel}
                      <button
                        type="button"
                        onclick={() => (properties[field.name] = optVal)}
                        class={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-950 text-teal-200 border border-teal-600 ring-1 ring-teal-500/60 shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <span>{optLabel}</span>
                        {#if optPower !== undefined}
                          <span class={`text-[9px] font-mono px-1 py-0.2 rounded ${isSelected ? 'bg-teal-900 text-teal-300 font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                            ⚡ {optPower}
                          </span>
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
                {#if targetBp}
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                    {targetBp.blueprintClass === 'SECOND_CLASS' ? '2nd-Class Sub-System' : '1st-Class Entity Link'}
                  </span>
                {/if}
              </div>

              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}

              <!-- If referencing a 2nd-Class Sub-Blueprint, render its nested template fields -->
              {#if targetBp && targetBp.blueprintClass === 'SECOND_CLASS'}
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {#each targetBp.fields as subF}
                    {#if subF.fieldType !== 'FORMULA'}
                      <div class="space-y-1.5 p-3 rounded bg-zinc-900/90 border border-zinc-800">
                        <span class="block text-[11px] font-medium text-zinc-300">
                          {subF.label}
                          {#if subF.unit}<span class="text-zinc-500 font-mono">({subF.unit})</span>{/if}
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
                                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 ring-1 ring-cyan-500/50'
                                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
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
                            class="text-xs font-mono"
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
                    Select an instantiated {targetBp.name} entity instance ({candidateEntities.length} available):
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
                  <span>Live Evaluated:</span>
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
                <Label class="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <Hash class="w-3.5 h-3.5 text-emerald-400" />
                  <span>{field.label}</span>
                  {#if field.unit}<span class="text-zinc-500 font-mono">({field.unit})</span>{/if}
                </Label>
                {#if field.min !== undefined && field.max !== undefined}
                  <span class="text-[10px] font-mono text-zinc-500">Range: [{field.min} to {field.max}]</span>
                {/if}
              </div>

              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}

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
              <span class="block text-xs font-medium text-zinc-200">
                {field.label}
              </span>
              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}
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
      <span>Instantiate {archetypeContext.archetypeLabel}</span>
    </Button>
  </div>
</div>
