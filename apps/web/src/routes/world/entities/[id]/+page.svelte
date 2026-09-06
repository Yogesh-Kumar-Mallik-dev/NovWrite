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
    Code,
    Sliders,
    Plus,
    X,
    RotateCcw,
    Eye,
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
    type EntityItem,
  } from '$lib/stores/worldStore.svelte';
  import { evaluateFormula } from '$lib/engine/formulaEngine';

  const entityId = $derived(page.params.id);
  const entity = $derived(worldStore.getEntity(entityId));
  const blueprint = $derived(
    entity ? worldStore.getBlueprint(entity.blueprintId) : undefined
  );

  function ensureAllPropertiesExist(
    rawProps: Record<string, any>,
    bp?: BlueprintDef
  ): Record<string, any> {
    const result: Record<string, any> = JSON.parse(JSON.stringify(rawProps || {}));
    if (!bp) return result;

    for (const field of bp.fields) {
      if (field.fieldType === 'BLUEPRINT_REF') {
        const target = worldStore.getBlueprint(field.targetBlueprintId);
        if (target && target.blueprintClass === 'SECOND_CLASS') {
          if (!result[field.name] || typeof result[field.name] !== 'object') {
            result[field.name] = {};
          }
          for (const subF of target.fields) {
            if (result[field.name][subF.name] === undefined) {
              if (subF.defaultValue !== undefined) {
                result[field.name][subF.name] = subF.defaultValue;
              } else if (subF.fieldType === 'NUMBER') {
                result[field.name][subF.name] = subF.min ?? 0;
              } else if (
                (subF.fieldType === 'ENUM' || subF.fieldType === 'VALUE_TYPE') &&
                subF.options &&
                subF.options.length > 0
              ) {
                const first = subF.options[0];
                result[field.name][subF.name] =
                  typeof first === 'object' ? first.value : first;
              } else if (subF.fieldType === 'BOOLEAN') {
                result[field.name][subF.name] = 'false';
              } else {
                result[field.name][subF.name] = '';
              }
            }
          }
        } else {
          if (result[field.name] === undefined) {
            result[field.name] = field.defaultValue || '';
          }
        }
      } else if (result[field.name] === undefined) {
        if (field.defaultValue !== undefined) {
          result[field.name] = field.defaultValue;
        } else if (field.fieldType === 'NUMBER') {
          result[field.name] = field.min ?? 0;
        } else if (
          (field.fieldType === 'ENUM' || field.fieldType === 'VALUE_TYPE') &&
          field.options &&
          field.options.length > 0
        ) {
          const first = field.options[0];
          result[field.name] = typeof first === 'object' ? first.value : first;
        } else if (field.fieldType === 'BOOLEAN') {
          result[field.name] = 'false';
        } else if (field.fieldType !== 'FORMULA') {
          result[field.name] = '';
        }
      }
    }

    return result;
  }

  function getInitialEntityState(id?: string) {
    if (!id) {
      return {
        loadedId: null,
        name: '',
        category: 'General',
        description: '',
        properties: {},
        jsonContent: '{}',
      };
    }
    const ent = worldStore.getEntity(id);
    const bp = ent ? worldStore.getBlueprint(ent.blueprintId) : undefined;
    const initialProps = ent ? ensureAllPropertiesExist(ent.properties || {}, bp) : {};
    return {
      loadedId: ent?.id || null,
      name: ent?.name || '',
      category: ent?.category || (bp ? bp.category : 'General'),
      description: ent?.description || '',
      properties: initialProps,
      jsonContent: JSON.stringify(initialProps, null, 2),
    };
  }

  const initialData = getInitialEntityState(page.params.id);

  let deleteConfirmOpen = $state(false);
  let editorMode = $state<'form' | 'json'>('form');

  // Local Editable State
  let loadedEntityId = $state<string | null>(initialData.loadedId);
  let name = $state(initialData.name);
  let category = $state(initialData.category);
  let description = $state(initialData.description);
  let properties = $state<Record<string, any>>(initialData.properties);
  let jsonEditorContent = $state(initialData.jsonContent);
  let jsonParseError = $state<string | null>(null);
  let saveMessage = $state<string | null>(null);

  // New Custom Property Drafter (for arbitrary object properties)
  let showAddCustomPropModal = $state(false);
  let newPropKey = $state('');
  let newPropType = $state<'string' | 'number' | 'boolean' | 'json'>('string');
  let newPropValue = $state('');

  // Synchronize state when entity changes or on route param change
  $effect(() => {
    const currentId = entityId;
    const ent = worldStore.getEntity(currentId);
    const bp = ent ? worldStore.getBlueprint(ent.blueprintId) : undefined;
    if (ent && ent.id !== loadedEntityId) {
      loadedEntityId = ent.id;
      name = ent.name;
      category = ent.category || (bp ? bp.category : 'General');
      description = ent.description || '';
      properties = ensureAllPropertiesExist(ent.properties || {}, bp);
      jsonEditorContent = JSON.stringify(properties, null, 2);
      jsonParseError = null;
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
    const formulaField = targetBp.fields.find(
      (f) => f.fieldType === 'FORMULA' && f.formulaExpression
    );
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
          (f: DynamicFieldDef) =>
            f.fieldType !== 'BLUEPRINT_REF' && f.fieldType !== 'FORMULA'
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

  // Identify any custom properties present in properties that are not in the blueprint definition
  const customPropertyKeys = $derived.by(() => {
    if (!properties) return [];
    const schemaFieldNames = new Set<string>();
    if (blueprint) {
      for (const f of blueprint.fields) {
        schemaFieldNames.add(f.name);
      }
    }
    return Object.keys(properties).filter((k) => !schemaFieldNames.has(k));
  });

  // Switch to JSON editor mode and format JSON
  function switchToJsonMode() {
    jsonEditorContent = JSON.stringify(properties, null, 2);
    jsonParseError = null;
    editorMode = 'json';
  }

  // Switch back to visual form mode after validating JSON
  function switchToFormMode() {
    try {
      const parsed = JSON.parse(jsonEditorContent);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Properties must be a valid JSON object');
      }
      properties = parsed;
      jsonParseError = null;
      editorMode = 'form';
    } catch (e: any) {
      jsonParseError = e.message || 'Invalid JSON syntax';
      toast.error('JSON Parse Error', jsonParseError ?? undefined);
    }
  }

  function handleJsonTextareaChange(val: string) {
    jsonEditorContent = val;
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        properties = parsed;
        jsonParseError = null;
      }
    } catch (e: any) {
      jsonParseError = e.message || 'Syntax error in JSON';
    }
  }

  function handleAddCustomProperty() {
    const key = newPropKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!key) {
      toast.error('Validation Error', 'Property key is required.');
      return;
    }
    if (properties[key] !== undefined) {
      toast.error('Validation Error', `Property "${key}" already exists.`);
      return;
    }

    let parsedVal: any = newPropValue;
    if (newPropType === 'number') {
      parsedVal = Number(newPropValue) || 0;
    } else if (newPropType === 'boolean') {
      parsedVal = newPropValue === 'true';
    } else if (newPropType === 'json') {
      try {
        parsedVal = JSON.parse(newPropValue || '{}');
      } catch {
        parsedVal = {};
      }
    }

    properties[key] = parsedVal;
    jsonEditorContent = JSON.stringify(properties, null, 2);
    toast.success('Property Added', `Custom property "${key}" attached to entity.`);

    newPropKey = '';
    newPropValue = '';
    newPropType = 'string';
    showAddCustomPropModal = false;
  }

  function handleRemoveCustomProperty(key: string) {
    delete properties[key];
    jsonEditorContent = JSON.stringify(properties, null, 2);
    toast.info('Property Removed', `Custom property "${key}" deleted.`);
  }

  function handleSaveEntity() {
    if (!entity || !name.trim()) {
      toast.error('Validation Error', 'Entity name is required.');
      return;
    }

    if (editorMode === 'json') {
      try {
        const parsed = JSON.parse(jsonEditorContent);
        properties = parsed;
        jsonParseError = null;
      } catch (e: any) {
        toast.error('Cannot Save', 'Fix the JSON syntax error before saving.');
        return;
      }
    }

    worldStore.updateEntity(entity.id, {
      name: name.trim(),
      category: category.trim() || entity.category,
      description: description.trim(),
      properties: JSON.parse(JSON.stringify(properties)),
    });

    toast.success(
      'Entity Updated',
      `Properties & live formulas for "${name.trim()}" successfully saved.`
    );
    goto('/world/entities');
  }

  function confirmDeleteAction() {
    if (!entity) return;
    const entName = entity.name;
    worldStore.deleteEntity(entity.id);
    toast.success('Entity Deleted', `Entity "${entName}" was removed.`);
    deleteConfirmOpen = false;
    goto('/world/entities');
  }

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveEntity();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

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

    <!-- Header & Mode Switcher -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4"
    >
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
          <span class="text-muted-foreground font-mono"
            >Seq #{entity.lastMutatedSeqNumber}</span
          >
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- View / Editor Mode Switcher -->
        <div class="inline-flex rounded-lg bg-muted p-0.5 border border-border text-xs">
          <button
            type="button"
            onclick={() => {
              if (editorMode === 'json') switchToFormMode();
            }}
            class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition cursor-pointer {editorMode ===
            'form'
              ? 'bg-background text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'}"
          >
            <Sliders class="w-3.5 h-3.5" />
            <span>Visual Form</span>
          </button>
          <button
            type="button"
            onclick={() => {
              if (editorMode === 'form') switchToJsonMode();
            }}
            class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition cursor-pointer {editorMode ===
            'json'
              ? 'bg-background text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'}"
          >
            <Code class="w-3.5 h-3.5 text-primary" />
            <span>Raw JSON</span>
          </button>
        </div>

        <Button
          variant="default"
          size="sm"
          onclick={handleSaveEntity}
          class="gap-1.5 shadow-xs"
        >
          <Check class="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>

        {#if blueprint}
          <Button
            href={`/world/schemas/${blueprint.id}`}
            target="_blank"
            variant="outline"
            size="sm"
            class="text-xs"
          >
            <Edit3 class="w-3.5 h-3.5 text-primary" />
            <span>Schema</span>
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
      <div
        class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shadow-xs"
      >
        <Check class="w-4 h-4 text-emerald-500 shrink-0" />
        <span>{saveMessage}</span>
      </div>
    {/if}

    <!-- PRIMARY IDENTITY CARD (COMMON TO BOTH MODES) -->
    <Card class="p-6 space-y-4 border-border bg-card">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h3
          class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"
        >
          <ArchetypeIcon class="w-4 h-4 text-primary" />
          <span>{archetypeContext.archetypeLabel} Core Identity</span>
        </h3>
        <span
          class="text-[11px] text-primary font-medium px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20"
        >
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
          <Input
            id="entity-bp"
            value={entity.blueprintName}
            disabled
            class="w-full text-xs opacity-70 cursor-not-allowed"
          />
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

    <!-- MODE 1: RAW JSON OBJECT INSPECTOR & EDITOR -->
    {#if editorMode === 'json'}
      <Card class="p-6 space-y-4 border-primary/40 bg-card shadow-sm">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center gap-2">
            <Code class="w-4 h-4 text-primary" />
            <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider">
              Raw Object Properties (JSON Schema)
            </h3>
          </div>
          <div class="flex items-center gap-2">
            {#if jsonParseError}
              <span
                class="text-[11px] font-mono px-2 py-0.5 rounded bg-destructive/15 border border-destructive/30 text-destructive font-semibold"
              >
                JSON Syntax Error
              </span>
            {:else}
              <span
                class="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                Valid Object Structure
              </span>
            {/if}
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs"
              onclick={() => {
                try {
                  const p = JSON.parse(jsonEditorContent);
                  jsonEditorContent = JSON.stringify(p, null, 2);
                  jsonParseError = null;
                } catch (e: any) {
                  jsonParseError = e.message;
                }
              }}
            >
              <RotateCcw class="w-3 h-3" />
              <span>Format JSON</span>
            </Button>
          </div>
        </div>

        <p class="text-xs text-muted-foreground">
          Directly inspect and mutate any previous properties, nested arrays, or sub-keys on
          this entity. Changes synchronize live to formula engines.
        </p>

        <textarea
          class="w-full h-96 font-mono text-xs p-4 rounded-lg bg-muted/40 border {jsonParseError
            ? 'border-destructive'
            : 'border-border'} text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
          value={jsonEditorContent}
          oninput={(e) => handleJsonTextareaChange(e.currentTarget.value)}
        ></textarea>

        {#if jsonParseError}
          <div
            class="p-3 rounded bg-destructive/10 border border-destructive/30 text-xs font-mono text-destructive"
          >
            {jsonParseError}
          </div>
        {/if}
      </Card>
    {:else}
      <!-- MODE 2: VISUAL FORM OBJECT INSPECTOR -->

      <!-- Dynamic Template Attributes (Direct Fields from Blueprint) -->
      {#if blueprint && directFields.length > 0}
        <Card class="p-6 space-y-5 border-border bg-card">
          <div class="border-b border-border pb-3">
            <h3
              class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"
            >
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
                <div
                  class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5 col-span-1 md:col-span-2"
                >
                  <div class="flex items-center justify-between">
                    <Label
                      class="text-xs font-medium text-foreground flex items-center gap-1.5"
                    >
                      {#if field.fieldType === 'VALUE_TYPE'}
                        <Sparkles class="w-3.5 h-3.5 text-primary" />
                      {:else}
                        <ListFilter class="w-3.5 h-3.5 text-primary" />
                      {/if}
                      <span>{field.label}</span>
                      <span class="text-[10px] font-mono text-muted-foreground"
                        >({field.name})</span
                      >
                    </Label>
                    <span class="text-[10px] font-mono text-muted-foreground">
                      Current Value: <strong class="text-foreground"
                        >{properties[field.name] ?? '—'}</strong
                      >
                    </span>
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
                        <span class="text-[10px] text-muted-foreground mr-1 font-medium"
                          >Quick Select:</span
                        >
                        {#each field.options as opt}
                          {@const optVal = typeof opt === 'string' ? opt : opt.value}
                          {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                          {@const optPower =
                            typeof opt === 'string'
                              ? undefined
                              : (opt.power ?? opt.numericValue)}
                          {@const isSelected =
                            properties[field.name] === optVal ||
                            properties[field.name] === optLabel}
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
                              <span
                                class={`text-[9px] font-mono px-1 py-0.2 rounded ${
                                  isSelected
                                    ? 'bg-primary/20 text-primary font-bold'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
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
                    <Label
                      class="text-xs font-medium text-foreground flex items-center gap-1.5"
                    >
                      <Hash class="w-3.5 h-3.5 text-emerald-500" />
                      <span>{field.label}</span>
                      {#if field.unit}<span class="text-muted-foreground font-mono"
                          >({field.unit})</span
                        >{/if}
                    </Label>
                    {#if field.min !== undefined && field.max !== undefined}
                      <span class="text-[10px] font-mono text-muted-foreground"
                        >[{field.min} - {field.max}]</span
                      >
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
                  <span class="block text-xs font-medium text-foreground">{field.label}</span
                  >
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
                  <span class="block text-xs font-medium text-foreground">{field.label}</span
                  >
                  {#if field.description}
                    <p class="text-[10px] text-muted-foreground">{field.description}</p>
                  {/if}
                  <Input bind:value={properties[field.name]} class="text-xs" />
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
            <h3
              class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"
            >
              <Layers class="w-4 h-4 text-cyan-500" />
              <span>Sub-Blueprint Systems & Scales (2nd-Class Schemas)</span>
            </h3>
            <span class="text-[11px] text-cyan-500 font-mono">Nested Sub-Systems</span>
          </div>

          {#each subBlueprintRefFields as field}
            {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
            {#if targetBp}
              {@const subFormula = properties[field.name]
                ? getSubBlueprintComputedFormula(
                    targetBp,
                    field.name,
                    properties[field.name]
                  )
                : null}
              <Card class="p-5 border-cyan-500/30 bg-card space-y-4 shadow-xs">
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3"
                >
                  <div class="space-y-0.5">
                    <div
                      class="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400"
                    >
                      <Link2 class="w-4 h-4 text-cyan-500" />
                      <span>{field.label}</span>
                      <span class="text-muted-foreground font-mono">({field.name})</span>
                    </div>
                    <p class="text-[11px] text-muted-foreground">{targetBp.description}</p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span
                      class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
                    >
                      Sub-Blueprint: {targetBp.name}
                    </span>
                    <Button
                      href={`/world/schemas/${targetBp.id}`}
                      target="_blank"
                      variant="outline"
                      size="sm"
                      class="h-6 text-[10px] px-2 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10"
                    >
                      <Edit3 class="w-2.5 h-2.5" />
                      <span>Schema</span>
                    </Button>
                  </div>
                </div>

                <!-- Nested Fields Form -->
                {#if !properties[field.name]}
                  <div class="p-3 rounded bg-muted/40 text-xs text-muted-foreground">
                    Sub-system not initialized. Click below to initialize with defaults.
                    <Button
                      size="sm"
                      variant="outline"
                      class="mt-2 text-xs"
                      onclick={() => (properties[field.name] = {})}
                    >
                      Initialize {field.label}
                    </Button>
                  </div>
                {:else}
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {#each targetBp.fields as subF}
                      {#if subF.fieldType !== 'FORMULA'}
                        <div
                          class="space-y-2 p-3 rounded-lg bg-muted/40 border border-border"
                        >
                          <div class="flex items-center justify-between">
                            <span class="block text-[11px] font-medium text-foreground">
                              {subF.label}
                              {#if subF.unit}<span
                                  class="text-muted-foreground font-mono"
                                  >({subF.unit})</span
                                >{/if}
                            </span>
                            {#if subF.min !== undefined && subF.max !== undefined}
                              <span class="text-[9px] font-mono text-muted-foreground"
                                >[{subF.min}-{subF.max}]</span
                              >
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
                                    {@const optVal =
                                      typeof opt === 'string' ? opt : opt.value}
                                    {@const optLabel =
                                      typeof opt === 'string' ? opt : opt.label}
                                    {@const optPower =
                                      typeof opt === 'string'
                                        ? undefined
                                        : (opt.power ?? opt.numericValue)}
                                    {@const isSelected =
                                      properties[field.name][subF.name] === optVal ||
                                      properties[field.name][subF.name] === optLabel}
                                    <button
                                      type="button"
                                      onclick={() =>
                                        (properties[field.name][subF.name] = optVal)}
                                      class={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                                        isSelected
                                          ? 'bg-secondary text-secondary-foreground border border-border ring-1 ring-ring'
                                          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <span>{optLabel}</span>
                                      {#if subF.fieldType === 'VALUE_TYPE' && optPower !== undefined}
                                        <span class="text-[8px] font-mono opacity-90"
                                          >⚡{optPower}</span
                                        >
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
                    <div
                      class="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs"
                    >
                      <span class="text-cyan-600 dark:text-cyan-300 font-medium"
                        >{subFormula.label}:</span
                      >
                      <div class="flex items-center gap-2 font-mono">
                        <span class="text-[10px] text-cyan-600/80 dark:text-cyan-400/80"
                          >{subFormula.expr}</span
                        >
                        <span
                          class="px-2 py-0.5 rounded bg-cyan-500/20 font-bold text-cyan-700 dark:text-cyan-200"
                          >{subFormula.formatted}</span
                        >
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
              <h3
                class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"
              >
                <Link2 class="w-4 h-4 text-primary" />
                <span>1st-Class Relational Entity Connections</span>
              </h3>
              <p class="text-xs text-muted-foreground mt-0.5">
                Connect this entity to other 1st-class entity objects (e.g. character owning a
                weapon, belonging to a faction).
              </p>
            </div>
            <span class="text-[11px] text-primary font-mono">1st-Class Links</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each relationalEntityRefFields as field}
              {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
              {@const candidateEntities = targetBp
                ? worldStore.entities.filter(
                    (e: any) => e.blueprintId === targetBp.id && e.id !== entity.id
                  )
                : worldStore.entities.filter((e: any) => e.id !== entity.id)}
              <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5">
                <div class="flex items-center justify-between">
                  <Label
                    class="text-xs font-medium text-foreground flex items-center gap-1.5"
                  >
                    <Link2 class="w-3.5 h-3.5 text-primary" />
                    <span>{field.label}</span>
                  </Label>
                  <span
                    class="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary"
                  >
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
                      <span class="text-[10px] text-muted-foreground mr-1"
                        >Quick Link:</span
                      >
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

      <!-- Custom / Extended Properties Section -->
      {#if customPropertyKeys.length > 0 || !blueprint}
        <Card class="p-6 space-y-4 border-border bg-card">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3
                class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"
              >
                <Sliders class="w-4 h-4 text-primary" />
                <span>Custom & Extended Object Properties</span>
              </h3>
              <p class="text-xs text-muted-foreground mt-0.5">
                Instance-specific properties and data keys attached to this entity.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onclick={() => (showAddCustomPropModal = true)}
              class="h-7 text-xs flex items-center gap-1"
            >
              <Plus class="w-3 h-3" />
              <span>Add Property</span>
            </Button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {#each customPropertyKeys as propKey}
              {@const propVal = properties[propKey]}
              <div
                class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 relative group"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono font-bold text-foreground"
                    >{propKey}</span
                  >
                  <button
                    type="button"
                    onclick={() => handleRemoveCustomProperty(propKey)}
                    class="text-muted-foreground hover:text-destructive transition p-1 cursor-pointer"
                    title="Delete Property"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>

                {#if typeof propVal === 'number'}
                  <Input
                    type="number"
                    bind:value={properties[propKey]}
                    class="text-xs font-mono"
                  />
                {:else if typeof propVal === 'boolean'}
                  <Select
                    bind:value={properties[propKey]}
                    options={[
                      { value: 'true', label: 'True / Enabled' },
                      { value: 'false', label: 'False / Disabled' },
                    ]}
                  />
                {:else if typeof propVal === 'object' && propVal !== null}
                  <Textarea
                    rows={3}
                    value={JSON.stringify(properties[propKey], null, 2)}
                    class="text-xs font-mono leading-tight"
                    oninput={(e) => {
                      try {
                        properties[propKey] = JSON.parse(e.currentTarget.value);
                      } catch {}
                    }}
                  />
                {:else}
                  <Input bind:value={properties[propKey]} class="text-xs" />
                {/if}
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      <!-- Live Evaluated Mathematical Formulas Banner -->
      {#if Object.keys(liveComputedFormulas).length > 0}
        <Card class="p-6 space-y-4 border-amber-500/40 bg-card shadow-xs">
          <div class="flex items-center justify-between">
            <h3
              class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2"
            >
              <Calculator class="w-4 h-4 text-amber-500" />
              <span>Live Evaluated Mathematical Formulas</span>
            </h3>
            <span
              class="text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20"
            >
              Auto-evaluates instantly as you adjust any option above
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {#each Object.entries(liveComputedFormulas) as [fKey, fData]}
              <div
                class="p-4 rounded-lg bg-muted/50 border border-amber-500/30 space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-foreground">{fData.label}</span>
                  <div
                    class="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-mono text-base font-bold shadow-xs"
                  >
                    <span>{fData.formatted}</span>
                  </div>
                </div>
                <div
                  class="text-[11px] font-mono text-muted-foreground pt-1"
                  title={fData.expr}
                >
                  Formula: {fData.expr}
                </div>
              </div>
            {/each}
          </div>
        </Card>
      {/if}
    {/if}

    <!-- Bottom Save & Delete Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-border">
      <Button
        variant="outline"
        size="sm"
        onclick={() => (deleteConfirmOpen = true)}
        class="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
      >
        <Trash2 class="w-3.5 h-3.5" />
        <span>Delete Entity</span>
      </Button>

      <div class="flex items-center gap-2">
        <Button variant="default" size="sm" onclick={handleSaveEntity}>
          <Check class="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>
    </div>
  </div>

  <!-- Delete Entity Confirmation Dialog -->
  <ConfirmDialog
    open={deleteConfirmOpen}
    title="Delete Entity"
    description={`Are you sure you want to permanently delete "${entity.name}"? This entity will be removed from the active universe state.`}
    confirmText="Delete Entity"
    variant="destructive"
    onConfirm={confirmDeleteAction}
    onCancel={() => (deleteConfirmOpen = false)}
  />

  <!-- Add Custom Property Modal -->
  {#if showAddCustomPropModal}
    <div
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <Card class="border-border bg-card max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center gap-2 text-primary font-bold">
            <Plus class="w-4 h-4" />
            <span>Add Custom Object Property</span>
          </div>
          <button
            type="button"
            onclick={() => (showAddCustomPropModal = false)}
            class="text-muted-foreground hover:text-foreground"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3">
          <Field id="custom-prop-key" label="Property Key (Identifier)" required>
            <Input
              id="custom-prop-key"
              bind:value={newPropKey}
              placeholder="e.g. soul_mark, aura_level, elemental_mastery"
              class="font-mono text-xs"
            />
          </Field>

          <Field id="custom-prop-type" label="Value Type">
            <Select
              bind:value={newPropType}
              options={[
                { value: 'string', label: 'Text (String)' },
                { value: 'number', label: 'Number' },
                { value: 'boolean', label: 'Boolean (Toggle)' },
                { value: 'json', label: 'JSON Object / Array' },
              ]}
            />
          </Field>

          <Field id="custom-prop-val" label="Initial Value">
            {#if newPropType === 'number'}
              <Input
                id="custom-prop-val"
                type="number"
                bind:value={newPropValue}
                placeholder="0"
                class="font-mono text-xs"
              />
            {:else if newPropType === 'boolean'}
              <Select
                bind:value={newPropValue}
                options={[
                  { value: 'true', label: 'True' },
                  { value: 'false', label: 'False' },
                ]}
              />
            {:else if newPropType === 'json'}
              <Textarea
                id="custom-prop-val"
                rows={3}
                bind:value={newPropValue}
                placeholder={'{"level": 1}'}
                class="font-mono text-xs"
              />
            {:else}
              <Input
                id="custom-prop-val"
                bind:value={newPropValue}
                placeholder="Initial text value..."
                class="text-xs"
              />
            {/if}
          </Field>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onclick={() => (showAddCustomPropModal = false)}
          >
            Cancel
          </Button>
          <Button size="sm" onclick={handleAddCustomProperty}>
            <Check class="w-3.5 h-3.5" />
            <span>Add Property</span>
          </Button>
        </div>
      </Card>
    </div>
  {/if}
{/if}
