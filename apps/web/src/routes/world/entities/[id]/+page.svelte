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
    User,
    Sword,
    MapPin,
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
          'Lore summary, background origins, and narrative significance...',
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
          'Character origins, personality traits, martial dao pursuit, spiritual bloodline, and narrative role...',
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
      nameLower.includes('sanctuary') ||
      nameLower.includes('realm') ||
      nameLower.includes('location') ||
      nameLower.includes('peak')
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

  let archetypeContext = $derived(getArchetypeContext(blueprint));
  let ArchetypeIcon = $derived(getArchetypeIcon(blueprint));

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

  // Real-time live computed formulas for the entity being inspected
  let liveComputedFormulas = $derived.by(() => {
    if (!blueprint || !entity) return {};
    const dummyEntity = {
      ...entity,
      properties: $state.snapshot(properties),
    };
    const results = worldStore.evaluateEntityFormulas(dummyEntity, blueprint);
    const computed: Record<
      string,
      { value: number; formatted: string; expr: string; label: string }
    > = {};

    for (const field of blueprint.fields) {
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

  // Calculate live formula for a sub-blueprint
  function getSubBlueprintComputedFormula(
    targetBp: BlueprintDef,
    subFieldName: string,
    subPropValues: Record<string, any>
  ): { label: string; formatted: string; expr: string } | null {
    const formulaField = targetBp.fields.find((f) => f.fieldType === 'FORMULA' && f.formulaExpression);
    if (!formulaField || !formulaField.formulaExpression) return null;

    try {
      const res = evaluateFormula(formulaField.formulaExpression, subPropValues || {});
      if (!res.success || res.value === undefined) return null;
      const val = res.value;
      return {
        label: formulaField.label || formulaField.name,
        formatted: Number.isInteger(val) ? String(val) : val.toFixed(2),
        expr: formulaField.formulaExpression,
      };
    } catch {
      return null;
    }
  }

  const directFields = $derived(
    blueprint
      ? blueprint.fields.filter(
          (f) => f.fieldType !== 'BLUEPRINT_REF' && f.fieldType !== 'FORMULA'
        )
      : []
  );

  const subBlueprintRefFields = $derived(
    blueprint
      ? blueprint.fields.filter((f) => {
          if (f.fieldType !== 'BLUEPRINT_REF') return false;
          const target = worldStore.getBlueprint(f.targetBlueprintId);
          return target && target.blueprintClass === 'SECOND_CLASS';
        })
      : []
  );

  const relationalEntityRefFields = $derived(
    blueprint
      ? blueprint.fields.filter((f) => {
          if (f.fieldType !== 'BLUEPRINT_REF') return false;
          const target = worldStore.getBlueprint(f.targetBlueprintId);
          return !target || target.blueprintClass === 'FIRST_CLASS';
        })
      : []
  );

  function handleSaveEntity() {
    if (!entity || !name.trim()) return;

    worldStore.updateEntity(entity.id, {
      name: name.trim(),
      description: description.trim(),
      properties: JSON.parse(JSON.stringify(properties)),
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
  <div class="max-w-4xl mx-auto space-y-7 pb-20">
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
          <div class="p-1.5 rounded bg-teal-950/60 border border-teal-800 text-teal-400">
            <ArchetypeIcon class="w-5 h-5" />
          </div>
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
        {#if blueprint}
          <a href={`/world/schemas/${blueprint.id}`} target="_blank">
            <Button variant="outline" size="sm" class="text-xs">
              <Edit3 class="w-3.5 h-3.5 text-teal-400" />
              <span>Edit Blueprint Schema</span>
            </Button>
          </a>
        {/if}
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

    <!-- Primary Entity Overview -->
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <ArchetypeIcon class="w-4 h-4 text-teal-400" />
          <span>{archetypeContext.archetypeLabel} Identity</span>
        </h3>
        <span class="text-[11px] text-teal-400 font-medium px-2.5 py-0.5 rounded bg-teal-950/70 border border-teal-800/60">
          Archetype: {entity.blueprintName}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field id="entity-name" label={archetypeContext.nameLabel} required>
          <Input
            id="entity-name"
            bind:value={name}
            placeholder={archetypeContext.namePlaceholder}
            class="w-full text-xs font-medium"
          />
        </Field>

        <Field id="entity-bp" label="Blueprint Archetype">
          <Input id="entity-bp" value={entity.blueprintName} disabled class="w-full text-xs opacity-70 cursor-not-allowed" />
        </Field>
      </div>

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

    <!-- Dynamic Template Attributes (Direct Fields) -->
    {#if blueprint && directFields.length > 0}
      <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
        <div class="border-b border-zinc-800 pb-3">
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-teal-400" />
            <span>Dynamic Template Attributes ({blueprint.name})</span>
          </h3>
          <p class="text-xs text-zinc-500 mt-0.5">
            Modify state values to trigger real-time formula updates and causal state folds.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each directFields as field}
          <!-- ENUM / VALUE_TYPE FIELD -->
          {#if field.fieldType === 'ENUM' || field.fieldType === 'VALUE_TYPE'}
            <div class="p-4 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-2.5 col-span-1 md:col-span-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  {#if field.fieldType === 'VALUE_TYPE'}
                    <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
                  {:else}
                    <ListFilter class="w-3.5 h-3.5 text-teal-400" />
                  {/if}
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-zinc-500">({field.name})</span>
                </Label>
              </div>

              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}

              <div class="space-y-2">
                <div class="max-w-md">
                  <Select
                    bind:value={properties[field.name]}
                    options={formatEnumOptions(field.options)}
                  />
                </div>

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
                            ? field.fieldType === 'VALUE_TYPE'
                              ? 'bg-indigo-950 text-indigo-200 border border-indigo-600 ring-1 ring-indigo-500/60 shadow-sm'
                              : 'bg-teal-950 text-teal-200 border border-teal-600 ring-1 ring-teal-500/60 shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <span>{optLabel}</span>
                        {#if field.fieldType === 'VALUE_TYPE' && optPower !== undefined}
                          <span class={`text-[9px] font-mono px-1 py-0.2 rounded ${isSelected ? 'bg-indigo-900 text-indigo-300 font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                            ⚡ {optPower}
                          </span>
                        {/if}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

            <!-- NUMBER FIELD -->
            {:else if field.fieldType === 'NUMBER'}
              <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-1.5">
                <div class="flex items-center justify-between">
                  <Label class="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                    <Hash class="w-3.5 h-3.5 text-emerald-400" />
                    <span>{field.label}</span>
                    {#if field.unit}<span class="text-zinc-500 font-mono">({field.unit})</span>{/if}
                  </Label>
                  {#if field.min !== undefined && field.max !== undefined}
                    <span class="text-[10px] font-mono text-zinc-500">[{field.min} - {field.max}]</span>
                  {/if}
                </div>

                {#if field.description}
                  <p class="text-[10px] text-zinc-400">{field.description}</p>
                {/if}

                <Input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step || 1}
                  bind:value={properties[field.name]}
                  class="text-xs font-mono"
                />
              </div>

            <!-- BOOLEAN FIELD -->
            {:else if field.fieldType === 'BOOLEAN'}
              <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-1.5">
                <span class="block text-xs font-medium text-zinc-200">{field.label}</span>
                <Select
                  bind:value={properties[field.name]}
                  options={[
                    { value: 'true', label: 'True / Enabled' },
                    { value: 'false', label: 'False / Disabled' },
                  ]}
                />
              </div>

            <!-- STRING FIELD -->
            {:else}
              <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-1.5">
                <span class="block text-xs font-medium text-zinc-200">{field.label}</span>
                {#if field.description}
                  <p class="text-[10px] text-zinc-400">{field.description}</p>
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

    <!-- Sub-Blueprint Systems & Scales (2nd-Class Schemas) -->
    {#if subBlueprintRefFields.length > 0}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Layers class="w-4 h-4 text-cyan-400" />
            <span>Sub-Blueprint Systems & Scales (2nd-Class Schemas)</span>
          </h3>
          <span class="text-[11px] text-cyan-400/80 font-mono">Nested Sub-Systems</span>
        </div>

        {#each subBlueprintRefFields as field}
          {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
          {#if targetBp}
            {@const subFormula = properties[field.name] ? getSubBlueprintComputedFormula(targetBp, field.name, properties[field.name]) : null}
            <div class="p-5 rounded-lg border border-cyan-900/60 bg-gradient-to-br from-cyan-950/20 via-zinc-900 to-zinc-900 space-y-4 shadow-sm shadow-cyan-950/30">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Link2 class="w-4 h-4 text-cyan-400" />
                    <span>{field.label}</span>
                    <span class="text-zinc-500 font-mono">({field.name})</span>
                  </div>
                  <p class="text-[11px] text-zinc-400">{targetBp.description}</p>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                    Sub-Blueprint: {targetBp.name}
                  </span>
                  <a href={`/world/schemas/${targetBp.id}`} target="_blank">
                    <Button variant="outline" size="sm" class="h-6 text-[10px] px-2 text-cyan-300 border-cyan-800 hover:bg-cyan-950/50">
                      <Edit3 class="w-2.5 h-2.5" />
                      <span>Schema</span>
                    </Button>
                  </a>
                </div>
              </div>

              {#if properties[field.name]}
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {#each targetBp.fields as subF}
                    {#if subF.fieldType !== 'FORMULA'}
                      <div class="space-y-2 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
                        <div class="flex items-center justify-between">
                          <span class="block text-[11px] font-medium text-zinc-200">
                            {subF.label}
                            {#if subF.unit}<span class="text-zinc-500 font-mono">({subF.unit})</span>{/if}
                          </span>
                          {#if subF.min !== undefined && subF.max !== undefined}
                            <span class="text-[9px] font-mono text-zinc-500">[{subF.min}-{subF.max}]</span>
                          {/if}
                        </div>

                        {#if subF.fieldType === 'ENUM' || subF.fieldType === 'VALUE_TYPE'}
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
                                    class={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
                                      isSelected
                                        ? subF.fieldType === 'VALUE_TYPE'
                                          ? 'bg-indigo-950 text-indigo-200 border border-indigo-600 ring-1 ring-indigo-500/50'
                                          : 'bg-cyan-950 text-cyan-200 border border-cyan-600 ring-1 ring-cyan-500/50'
                                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  >
                                    <span>{optLabel}</span>
                                    {#if subF.fieldType === 'VALUE_TYPE' && optPower !== undefined}
                                      <span class="text-[8px] font-mono opacity-90">⚡{optPower}</span>
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

                {#if subFormula}
                  <div class="p-2.5 rounded bg-cyan-950/40 border border-cyan-900/50 flex items-center justify-between text-xs">
                    <span class="text-cyan-300 font-medium">{subFormula.label}:</span>
                    <div class="flex items-center gap-2 font-mono">
                      <span class="text-[10px] text-cyan-400/70">{subFormula.expr}</span>
                      <span class="px-2 py-0.5 rounded bg-cyan-900/60 font-bold text-cyan-200">{subFormula.formatted}</span>
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- 1st-Class Relational Entity Links -->
    {#if relationalEntityRefFields.length > 0}
      <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Link2 class="w-4 h-4 text-purple-400" />
              <span>1st-Class Relational Entity Connections</span>
            </h3>
            <p class="text-xs text-zinc-500 mt-0.5">
              Connect this entity to other 1st-class entity objects (e.g. character owning a weapon, belonging to a faction).
            </p>
          </div>
          <span class="text-[11px] text-purple-400/80 font-mono">1st-Class Links</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each relationalEntityRefFields as field}
            {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
            {@const candidateEntities = targetBp ? worldStore.entities.filter((e) => e.blueprintId === targetBp.id && e.id !== entity.id) : worldStore.entities.filter((e) => e.id !== entity.id)}
            <div class="p-4 rounded-lg border border-purple-950/70 bg-purple-950/15 space-y-2.5">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-purple-200 flex items-center gap-1.5">
                  <Link2 class="w-3.5 h-3.5 text-purple-400" />
                  <span>{field.label}</span>
                </Label>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                  Target: {targetBp ? targetBp.name : '1st-Class Entity'}
                </span>
              </div>

              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}

              <div class="space-y-2">
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

                {#if candidateEntities.length > 0}
                  <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span class="text-[10px] text-zinc-500 mr-1">Quick Link:</span>
                    <button
                      type="button"
                      onclick={() => (properties[field.name] = '')}
                      class={`px-2 py-0.5 rounded text-[10px] transition ${
                        !properties[field.name]
                          ? 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700'
                          : 'bg-zinc-950 text-zinc-500 border border-zinc-850 hover:text-zinc-300'
                      }`}
                    >
                      None
                    </button>
                    {#each candidateEntities as cand}
                      <button
                        type="button"
                        onclick={() => (properties[field.name] = cand.id)}
                        class={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
                          properties[field.name] === cand.id
                            ? 'bg-purple-950 text-purple-200 border border-purple-600 ring-1 ring-purple-500/50'
                            : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <span>{cand.name}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Live Evaluated Mathematical Formulas Banner -->
    {#if Object.keys(liveComputedFormulas).length > 0}
      <div class="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 rounded-lg border border-amber-900/50 p-6 space-y-4 shadow-md shadow-amber-950/20">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Calculator class="w-4 h-4 text-amber-400" />
            <span>Live Evaluated Mathematical Formulas</span>
          </h3>
          <span class="text-[10px] text-amber-400/90 font-mono bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-800/70">
            Auto-evaluates instantly as you adjust any option above
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {#each Object.entries(liveComputedFormulas) as [fKey, fData]}
            <div class="p-4 rounded-lg bg-black/60 border border-amber-900/70 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-zinc-100">{fData.label}</span>
                <div class="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950 border border-amber-600 text-amber-300 font-mono text-base font-bold shadow-sm">
                  <span>{fData.formatted}</span>
                </div>
              </div>
              <div class="text-[11px] font-mono text-amber-400/80 pt-1" title={fData.expr}>
                Formula: {fData.expr}
              </div>
            </div>
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
        <span>Save {archetypeContext.archetypeLabel} State</span>
      </Button>
    </div>
  </div>
{/if}
