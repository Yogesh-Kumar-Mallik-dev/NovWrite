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
    Link2,
    ListFilter,
    Shield,
    Hash,
    Layers,
    User,
    Sword,
    MapPin,
    Edit3,
  } from 'lucide-svelte';
  import {
    Button,
    Input,
    Select,
    Label,
    Field,
    Textarea,
    Breadcrumb,
    ConfirmDialog,
    EmptyState,
  } from '$lib/components/ui';
  import { toast } from '$lib/stores/toastStore.svelte';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card';
  import {
    worldStore,
    type BlueprintDef,
    type DynamicFieldDef,
  } from '$lib/stores/worldStore.svelte';
  import { evaluateFormula } from '$lib/engine/formulaEngine';

  const entityId = $derived(page.params.id);
  const entity = $derived(worldStore.getEntity(entityId));
  let deleteConfirmOpen = $state(false);
  const blueprint = $derived(
    entity ? worldStore.getBlueprint(entity.blueprintId) : undefined
  );

  let name = $state('');
  let category = $state('');
  let description = $state('');
  let properties = $state<Record<string, any>>({});
  let saveMessage = $state<string | null>(null);

  $effect(() => {
    if (entity) {
      name = entity.name;
      category = entity.category || '';
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
          (f: DynamicFieldDef) => f.fieldType !== 'BLUEPRINT_REF' && f.fieldType !== 'FORMULA'
        )
      : []
  );

  const subBlueprintRefFields = $derived(
    blueprint
      ? blueprint.fields.filter((f: DynamicFieldDef) => {
          if (f.fieldType !== 'BLUEPRINT_REF') return false;
          const target = worldStore.getBlueprint(f.targetBlueprintId);
          return target && target.blueprintClass === 'SECOND_CLASS';
        })
      : []
  );

  const relationalEntityRefFields = $derived(
    blueprint
      ? blueprint.fields.filter((f: DynamicFieldDef) => {
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
      category: category.trim() || entity.category,
      description: description.trim(),
      properties: JSON.parse(JSON.stringify(properties)),
    });

    toast.success("Entity Updated", `Properties & live formulas for "${name.trim()}" saved.`);
    saveMessage = 'Entity state & formulas successfully updated!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function confirmDeleteAction() {
    if (!entity) return;
    const entName = entity.name;
    worldStore.deleteEntity(entity.id);
    toast.success("Entity Deleted", `Entity "${entName}" was removed.`);
    deleteConfirmOpen = false;
    goto('/world/entities');
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
    <EmptyState
      icon={Shield}
      title="Entity Not Found"
      description="The requested story entity does not exist or has been deleted from the active world state."
      actionText="Return to Entities Workbench"
      actionHref="/world/entities"
    />
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary">
            <ArchetypeIcon class="w-5 h-5" />
          </div>
          <h2 class="text-xl font-bold tracking-tight text-foreground">{entity.name}</h2>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-primary font-medium">{entity.blueprintName}</span>
          <span class="text-muted-foreground/60">·</span>
          <span class="text-muted-foreground">{entity.category}</span>
          <span class="text-muted-foreground/60">·</span>
          <span class="text-muted-foreground font-mono">Seq #{entity.lastMutatedSeqNumber}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="default" size="sm" onclick={handleSaveEntity} class="gap-1.5 shadow-xs">
          <Check class="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
        {#if blueprint}
          <Button href={`/world/schemas/${blueprint.id}`} target="_blank" variant="outline" size="sm" class="text-xs">
            <Edit3 class="w-3.5 h-3.5 text-primary" />
            <span>Edit Blueprint Schema</span>
          </Button>
        {/if}
        <Button href="/world/entities" variant="outline" size="sm">
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>All Entities</span>
        </Button>
      </div>
    </div>

    <!-- Notification Alert -->
    {#if saveMessage}
      <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
        <Check class="w-4 h-4 text-emerald-500 shrink-0" />
        <span>{saveMessage}</span>
      </div>
    {/if}

    <!-- Primary Entity Overview -->
    <Card class="p-6 space-y-4 border-border bg-card">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <ArchetypeIcon class="w-4 h-4 text-primary" />
          <span>{archetypeContext.archetypeLabel} Identity</span>
        </h3>
        <span class="text-[11px] text-primary font-medium px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20">
          Archetype: {entity.blueprintName}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field id="entity-name" label={archetypeContext.nameLabel} required>
          <Input
            id="entity-name"
            bind:value={name}
            placeholder={archetypeContext.namePlaceholder}
            class="w-full text-xs font-medium"
          />
        </Field>

        <Field id="entity-cat" label="Category / Faction">
          <Input
            id="entity-cat"
            bind:value={category}
            placeholder="e.g. Characters, Protagonists, Silver Vanguard..."
            class="w-full text-xs"
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
    </Card>

    <!-- Dynamic Template Attributes (Direct Fields) -->
    {#if blueprint && directFields.length > 0}
      <Card class="p-6 space-y-5 border-border bg-card">
        <div class="border-b border-border pb-3">
          <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-primary" />
            <span>Dynamic Template Attributes ({blueprint.name})</span>
          </h3>
          <p class="text-xs text-muted-foreground mt-0.5">
            Modify state values to trigger real-time formula updates and causal state folds.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each directFields as field}
          <!-- ENUM / VALUE_TYPE FIELD -->
          {#if field.fieldType === 'ENUM' || field.fieldType === 'VALUE_TYPE'}
            <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5 col-span-1 md:col-span-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                  {#if field.fieldType === 'VALUE_TYPE'}
                    <Sparkles class="w-3.5 h-3.5 text-primary" />
                  {:else}
                    <ListFilter class="w-3.5 h-3.5 text-primary" />
                  {/if}
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-muted-foreground">({field.name})</span>
                </Label>
              </div>

              {#if field.description}
                <p class="text-[11px] text-muted-foreground">{field.description}</p>
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
                    <span class="text-[10px] text-muted-foreground mr-1 font-medium">Quick Select:</span>
                    {#each field.options as opt}
                      {@const optVal = typeof opt === 'string' ? opt : opt.value}
                      {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                      {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                      {@const isSelected = properties[field.name] === optVal || properties[field.name] === optLabel}
                      <button
                        type="button"
                        onclick={() => (properties[field.name] = optVal)}
                        class={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-secondary text-secondary-foreground border border-border ring-1 ring-ring shadow-xs'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{optLabel}</span>
                        {#if field.fieldType === 'VALUE_TYPE' && optPower !== undefined}
                          <span class={`text-[9px] font-mono px-1 py-0.2 rounded ${isSelected ? 'bg-primary/20 text-primary font-bold' : 'bg-muted text-muted-foreground'}`}>
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
              <div class="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                <div class="flex items-center justify-between">
                  <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Hash class="w-3.5 h-3.5 text-emerald-500" />
                    <span>{field.label}</span>
                    {#if field.unit}<span class="text-muted-foreground font-mono">({field.unit})</span>{/if}
                  </Label>
                  {#if field.min !== undefined && field.max !== undefined}
                    <span class="text-[10px] font-mono text-muted-foreground">[{field.min} - {field.max}]</span>
                  {/if}
                </div>

                {#if field.description}
                  <p class="text-[10px] text-muted-foreground">{field.description}</p>
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
              <div class="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                <span class="block text-xs font-medium text-foreground">{field.label}</span>
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
              <div class="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                <span class="block text-xs font-medium text-foreground">{field.label}</span>
                {#if field.description}
                  <p class="text-[10px] text-muted-foreground">{field.description}</p>
                {/if}
                <Input
                  bind:value={properties[field.name]}
                  class="text-xs"
                />
              </div>
            {/if}
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Sub-Blueprint Systems & Scales (2nd-Class Schemas) -->
    {#if subBlueprintRefFields.length > 0}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Layers class="w-4 h-4 text-cyan-500" />
            <span>Sub-Blueprint Systems & Scales (2nd-Class Schemas)</span>
          </h3>
          <span class="text-[11px] text-cyan-500 font-mono">Nested Sub-Systems</span>
        </div>

        {#each subBlueprintRefFields as field}
          {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
          {#if targetBp}
            {@const subFormula = properties[field.name] ? getSubBlueprintComputedFormula(targetBp, field.name, properties[field.name]) : null}
            <Card class="p-5 border-cyan-500/30 bg-card space-y-4 shadow-xs">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    <Link2 class="w-4 h-4 text-cyan-500" />
                    <span>{field.label}</span>
                    <span class="text-muted-foreground font-mono">({field.name})</span>
                  </div>
                  <p class="text-[11px] text-muted-foreground">{targetBp.description}</p>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                    Sub-Blueprint: {targetBp.name}
                  </span>
                  <a href={`/world/schemas/${targetBp.id}`} target="_blank">
                    <Button variant="outline" size="sm" class="h-6 text-[10px] px-2 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10">
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
                      <div class="space-y-2 p-3 rounded-lg bg-muted/40 border border-border">
                        <div class="flex items-center justify-between">
                          <span class="block text-[11px] font-medium text-foreground">
                            {subF.label}
                            {#if subF.unit}<span class="text-muted-foreground font-mono">({subF.unit})</span>{/if}
                          </span>
                          {#if subF.min !== undefined && subF.max !== undefined}
                            <span class="text-[9px] font-mono text-muted-foreground">[{subF.min}-{subF.max}]</span>
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
                                    class={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                                      isSelected
                                        ? 'bg-secondary text-secondary-foreground border border-border ring-1 ring-ring'
                                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
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
                  <div class="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs">
                    <span class="text-cyan-600 dark:text-cyan-300 font-medium">{subFormula.label}:</span>
                    <div class="flex items-center gap-2 font-mono">
                      <span class="text-[10px] text-cyan-600/80 dark:text-cyan-400/80">{subFormula.expr}</span>
                      <span class="px-2 py-0.5 rounded bg-cyan-500/20 font-bold text-cyan-700 dark:text-cyan-200">{subFormula.formatted}</span>
                    </div>
                  </div>
                {/if}
              {/if}
            </Card>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- 1st-Class Relational Entity Links -->
    {#if relationalEntityRefFields.length > 0}
      <Card class="p-6 space-y-4 border-border bg-card">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Link2 class="w-4 h-4 text-primary" />
              <span>1st-Class Relational Entity Connections</span>
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              Connect this entity to other 1st-class entity objects (e.g. character owning a weapon, belonging to a faction).
            </p>
          </div>
          <span class="text-[11px] text-primary font-mono">1st-Class Links</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each relationalEntityRefFields as field}
            {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
            {@const candidateEntities = targetBp ? worldStore.entities.filter((e: any) => e.blueprintId === targetBp.id && e.id !== entity.id) : worldStore.entities.filter((e: any) => e.id !== entity.id)}
            <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Link2 class="w-3.5 h-3.5 text-primary" />
                  <span>{field.label}</span>
                </Label>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                  Target: {targetBp ? targetBp.name : '1st-Class Entity'}
                </span>
              </div>

              {#if field.description}
                <p class="text-[11px] text-muted-foreground">{field.description}</p>
              {/if}

              <div class="space-y-2">
                <Select
                  bind:value={properties[field.name]}
                  options={[
                    { value: '', label: 'None (Unassigned)' },
                    ...candidateEntities.map((e: any) => ({
                      value: e.id,
                      label: `${e.name} (${e.category})`,
                    })),
                  ]}
                />

                {#if candidateEntities.length > 0}
                  <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span class="text-[10px] text-muted-foreground mr-1">Quick Link:</span>
                    <button
                      type="button"
                      onclick={() => (properties[field.name] = '')}
                      class={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                        !properties[field.name]
                          ? 'bg-secondary text-secondary-foreground font-bold border border-border'
                          : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                      }`}
                    >
                      None
                    </button>
                    {#each candidateEntities as cand}
                      <button
                        type="button"
                        onclick={() => (properties[field.name] = cand.id)}
                        class={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                          properties[field.name] === cand.id
                            ? 'bg-secondary text-secondary-foreground border border-border ring-1 ring-ring'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground'
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
      </Card>
    {/if}

    <!-- Live Evaluated Mathematical Formulas Banner -->
    {#if Object.keys(liveComputedFormulas).length > 0}
      <Card class="p-6 space-y-4 border-amber-500/40 bg-card shadow-xs">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Calculator class="w-4 h-4 text-amber-500" />
            <span>Live Evaluated Mathematical Formulas</span>
          </h3>
          <span class="text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
            Auto-evaluates instantly as you adjust any option above
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {#each Object.entries(liveComputedFormulas) as [fKey, fData]}
            <div class="p-4 rounded-lg bg-muted/50 border border-amber-500/30 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-foreground">{fData.label}</span>
                <div class="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-mono text-base font-bold shadow-xs">
                  <span>{fData.formatted}</span>
                </div>
              </div>
              <div class="text-[11px] font-mono text-muted-foreground pt-1" title={fData.expr}>
                Formula: {fData.expr}
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Save Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-border">
      <Button variant="outline" size="sm" onclick={() => (deleteConfirmOpen = true)} class="text-destructive hover:bg-destructive/10 hover:border-destructive/30">
        <Trash2 class="w-3.5 h-3.5" />
        <span>Delete Entity</span>
      </Button>

      <Button variant="default" size="sm" onclick={handleSaveEntity}>
        <Check class="w-3.5 h-3.5" />
        <span>Save {archetypeContext.archetypeLabel} State</span>
      </Button>
    </div>
  </div>

  <!-- Delete Entity Confirmation Dialog -->
  <ConfirmDialog
    open={deleteConfirmOpen}
    title="Delete Entity"
    description={`Are you sure you want to delete "${entity.name}"? This entity will be permanently removed from the universe along with all assigned properties.`}
    confirmText="Delete Entity"
    onConfirm={confirmDeleteAction}
    onCancel={() => (deleteConfirmOpen = false)}
  />
{/if}

