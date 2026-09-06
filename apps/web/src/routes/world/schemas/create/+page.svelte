<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    ArrowLeft,
    Check,
    Plus,
    Trash2,
    Layers,
    Boxes,
    Calculator,
    Link2,
    ListFilter,
    Hash,
    Sparkles,
    AlertCircle,
  } from 'lucide-svelte';
  import {
    Button,
    Input,
    Select,
    Field,
    Textarea,
    Breadcrumb,
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
    type BlueprintClass,
    type BlueprintFieldType,
    type DynamicFieldDef,
    type BlueprintDef,
  } from '$lib/stores/worldStore.svelte';
  import {
    extractFormulaVariables,
    validateFormulaSyntax,
  } from '$lib/engine/formulaEngine';

  let name = $state('');
  let blueprintClass = $state<BlueprintClass>('FIRST_CLASS');
  let category = $state('Characters');
  let description = $state('');

  // Draft fields list
  let fields = $state<Array<{
    id: string;
    name: string;
    label: string;
    fieldType: BlueprintFieldType;
    description: string;
    options: Array<{ label: string; value: string; power?: number; numericValue?: number }>;
    newOptionLabel: string;
    newOptionPower: number | undefined;
    targetBlueprintId: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    defaultValue: string;
    formulaExpression: string;
  }>>([
    {
      id: 'f-1',
      name: 'gender',
      label: 'Gender Identity',
      fieldType: 'ENUM',
      description: 'Biological / spiritual gender category',
      options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Dual-Yin-Yang', value: 'Dual-Yin-Yang' },
        { label: 'Celestial / Genderless', value: 'Celestial / Genderless' },
      ],
      newOptionLabel: '',
      newOptionPower: undefined,
      targetBlueprintId: '',
      min: 0,
      max: 100,
      step: 1,
      unit: '',
      defaultValue: 'Male',
      formulaExpression: '',
    },
  ]);

  // Quick categories
  const suggestedCategories = [
    'Characters',
    'Relics & Armaments',
    'Cosmology & Geography',
    'Sects & Factions',
    'Systems & Affection',
    'Power Systems',
  ];

  const fieldTypeOptions = [
    { value: 'STRING', label: 'Text (String)' },
    { value: 'NUMBER', label: 'Number (Numeric with bounds)' },
    { value: 'BOOLEAN', label: 'Toggle (Boolean)' },
    { value: 'ENUM', label: 'Enum (Standard String Categories)' },
    { value: 'VALUE_TYPE', label: 'Value Type (Options with Power / Numeric Weights)' },
    { value: 'BLUEPRINT_REF', label: 'Blueprint Reference (1st or 2nd Class)' },
    { value: 'FORMULA', label: 'Formula (Mathematical & Logical Computed Math)' },
  ];

  // Available blueprints for referencing
  let availableTargetBlueprints = $derived(
    worldStore.blueprints.map((bp: BlueprintDef) => ({
      value: bp.id,
      label: `${bp.name} (${bp.blueprintClass === 'FIRST_CLASS' ? '1st Class' : '2nd Class'} · ${bp.category})`,
    }))
  );

  function addField() {
    fields.push({
      id: `draft-f-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
      name: '',
      label: '',
      fieldType: 'STRING',
      description: '',
      options: [],
      newOptionLabel: '',
      newOptionPower: undefined,
      targetBlueprintId: availableTargetBlueprints[0]?.value || '',
      min: 0,
      max: 100000,
      step: 1,
      unit: '',
      defaultValue: '',
      formulaExpression: '',
    });
  }

  function removeField(index: number) {
    fields.splice(index, 1);
  }

  function addOptionToField(fieldIndex: number) {
    const label = fields[fieldIndex].newOptionLabel.trim();
    if (!label) return;
    const power = fields[fieldIndex].newOptionPower;
    const value = label.toLowerCase().replace(/\s+/g, '_');
    
    fields[fieldIndex].options.push({
      label,
      value,
      power: power !== undefined ? Number(power) : 0,
      numericValue: power !== undefined ? Number(power) : 0,
    });

    if (!fields[fieldIndex].defaultValue) {
      fields[fieldIndex].defaultValue = value;
    }

    fields[fieldIndex].newOptionLabel = '';
    fields[fieldIndex].newOptionPower = undefined;
  }

  function removeOptionFromField(fieldIndex: number, optionIndex: number) {
    fields[fieldIndex].options.splice(optionIndex, 1);
  }

  function insertTokenIntoFormula(fieldIndex: number, token: string) {
    const current = fields[fieldIndex].formulaExpression;
    fields[fieldIndex].formulaExpression = current ? `${current} ${token}` : token;
  }

  // Live formula test evaluation
  function getFormulaValidation(expr: string) {
    if (!expr) return { valid: false, error: 'Empty formula expression' };
    return validateFormulaSyntax(expr);
  }

  function handleCreateBlueprint() {
    if (!name.trim()) {
      toast.error('Validation Error', 'Blueprint name is required.');
      return;
    }

    // Build valid DynamicFieldDef items
    const validFields: DynamicFieldDef[] = fields
      .filter((f) => f.name.trim() !== '' || f.label.trim() !== '')
      .map((f, idx) => {
        const fieldKey = (f.name.trim() || f.label.trim().toLowerCase().replace(/\s+/g, '_')).replace(/[^a-zA-Z0-9_\.]/g, '');
        const def: DynamicFieldDef = {
          id: `f-${Date.now()}-${idx}`,
          name: fieldKey,
          label: f.label.trim() || fieldKey,
          fieldType: f.fieldType,
          description: f.description.trim(),
        };

        if (f.fieldType === 'ENUM') {
          def.options = f.options.length > 0
            ? f.options.map((o: any) => (typeof o === 'string' ? o : o.label || o.value))
            : ['Default'];
          def.defaultValue = f.defaultValue || def.options[0];
        } else if (f.fieldType === 'VALUE_TYPE') {
          def.options = f.options.length > 0
            ? f.options.map((o: any) => ({
                label: typeof o === 'string' ? o : o.label,
                value: typeof o === 'string' ? o.toLowerCase().replace(/\s+/g, '_') : (o.value || (o.label ? o.label.toLowerCase().replace(/\s+/g, '_') : '')),
                power: typeof o === 'string' ? 0 : (o.power !== undefined ? Number(o.power) : (o.numericValue !== undefined ? Number(o.numericValue) : 0)),
                numericValue: typeof o === 'string' ? 0 : (o.power !== undefined ? Number(o.power) : (o.numericValue !== undefined ? Number(o.numericValue) : 0)),
              }))
            : [{ label: 'Default', value: 'default', power: 0, numericValue: 0 }];
          const first = def.options[0];
          def.defaultValue = f.defaultValue || (typeof first === 'object' ? first.value : first);
        } else if (f.fieldType === 'NUMBER') {
          def.min = f.min;
          def.max = f.max;
          def.step = f.step;
          def.unit = f.unit;
          def.defaultValue = parseFloat(f.defaultValue) || 0;
        } else if (f.fieldType === 'BLUEPRINT_REF') {
          def.targetBlueprintId = f.targetBlueprintId;
          const targetBp = worldStore.getBlueprint(f.targetBlueprintId);
          def.targetBlueprintName = targetBp?.name;
        } else if (f.fieldType === 'FORMULA') {
          def.formulaExpression = f.formulaExpression.trim();
          def.formulaDependencies = extractFormulaVariables(f.formulaExpression);
        } else if (f.fieldType === 'BOOLEAN') {
          def.defaultValue = f.defaultValue === 'true';
        } else {
          def.defaultValue = f.defaultValue;
        }

        return def;
      });

    worldStore.addBlueprint({
      name: name.trim(),
      blueprintClass,
      category: category.trim() || 'General',
      description: description.trim(),
      fields: validFields,
    });

    toast.success('Blueprint Created', `Blueprint "${name.trim()}" has been initialized.`);
    goto('/world/schemas');
  }
</script>

<div class="max-w-4xl mx-auto space-y-6 pb-16">
  <!-- Breadcrumb -->
  <Breadcrumb
    items={[
      { label: 'World Studio', href: '/world' },
      { label: 'Blueprints & Schemas', href: '/world/schemas' },
      { label: 'Create Blueprint from Scratch' },
    ]}
  />

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-border pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
        <Boxes class="w-5 h-5 text-primary" />
        <span>Create Blueprint from Scratch</span>
      </h2>
      <p class="text-xs text-muted-foreground mt-1">
        Define custom 1st-Class Entity archetypes or 2nd-Class sub-blueprints with dynamic enums, blueprint references, and mathematical formulas.
      </p>
    </div>
    <a href="/world/schemas">
      <Button variant="outline" size="sm">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Blueprints</span>
      </Button>
    </a>
  </div>

  <!-- Blueprint Meta Config -->
  <Card class="p-6 space-y-5 border-border bg-card">
    <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
      <Layers class="w-4 h-4 text-primary" />
      <span>Blueprint Classification & Category</span>
    </h3>

    <!-- Blueprint Class Selector -->
    <div>
      <span class="block text-xs font-medium text-muted-foreground mb-2">Blueprint Tier / Class</span>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onclick={() => (blueprintClass = 'FIRST_CLASS')}
          class={`p-4 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
            blueprintClass === 'FIRST_CLASS'
              ? 'border-primary bg-secondary/80 ring-1 ring-ring shadow-xs'
              : 'border-border bg-card/60 hover:border-border/80 hover:bg-muted/50'
          }`}
        >
          <div>
            <div class="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Boxes class="w-4 h-4 text-primary" />
              <span>1st-Class Blueprint (Primary Entity Archetype)</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Instantiates tangible universe entities (e.g. Cultivator Characters, Divine Relics, Factions, Sects, Realms) with timeline lifecycles and causal mutations.
            </p>
          </div>
          <div class="mt-3 text-[11px] text-primary font-medium">Instantiable in Universe Timeline</div>
        </button>

        <button
          type="button"
          onclick={() => (blueprintClass = 'SECOND_CLASS')}
          class={`p-4 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
            blueprintClass === 'SECOND_CLASS'
              ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30 shadow-xs'
              : 'border-border bg-card/60 hover:border-border/80 hover:bg-muted/50'
          }`}
        >
          <div>
            <div class="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Layers class="w-4 h-4 text-cyan-500" />
              <span>2nd-Class Blueprint (Sub-Schema & Value Object)</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Reusable nested sub-schemas, gauges, or matrices (e.g. Romantic Affection Scale, Cultivation Mastery Matrix, Elemental Roots) referenced inside 1st-Class blueprints.
            </p>
          </div>
          <div class="mt-3 text-[11px] text-cyan-500 font-medium">Embeddable & Referenceable Schema</div>
        </button>
      </div>
    </div>

    <!-- Name & Freeform Category -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field id="bp-name" label="Blueprint Name" required>
        <Input
          id="bp-name"
          bind:value={name}
          placeholder="e.g. Divine Beast, Sect Patriarch, Romantic Affection Scale"
          class="w-full"
        />
      </Field>

      <Field id="bp-cat" label="Category / Domain (Free-form)">
        <Input
          id="bp-cat"
          bind:value={category}
          placeholder="e.g. Characters, Relics, Systems & Affection"
          class="w-full"
        />
        <!-- Quick Suggestions -->
        <div class="flex flex-wrap gap-1.5 mt-2">
          {#each suggestedCategories as sug}
            <button
              type="button"
              onclick={() => (category = sug)}
              class="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
            >
              {sug}
            </button>
          {/each}
        </div>
      </Field>
    </div>

    <Field id="bp-desc" label="Description & Lore Scope">
      <Textarea
        id="bp-desc"
        bind:value={description}
        rows={2}
        placeholder="Describe the archetypal purpose and mechanics governed by this blueprint..."
        class="w-full text-xs"
      />
    </Field>
  </Card>

  <!-- Dynamic Field Builder -->
  <Card class="p-6 space-y-6 border-border bg-card">
    <div class="flex items-center justify-between border-b border-border pb-3">
      <div>
        <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-primary" />
          <span>Dynamic Fields & Mathematical Formulas</span>
        </h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          Build fields with user-defined enum categories, blueprint references, and multi-variable mathematical formulas.
        </p>
      </div>

      <Button variant="secondary" size="sm" onclick={addField}>
        <Plus class="w-3.5 h-3.5" />
        <span>Add Field</span>
      </Button>
    </div>

    <!-- Fields List -->
    <div class="space-y-4">
      {#if fields.length === 0}
        <EmptyState
          icon={Boxes}
          title="No Dynamic Fields Configured"
          description="Add dynamic fields, enums, values with power ratings, relations, or formulas to define this schema."
          actionText="+ Add First Field"
          onAction={addField}
          compact={true}
        />
      {/if}

      {#each fields as field, index (field.id)}
        <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-4 relative group">
          <!-- Field Header & Primary Definition -->
          <div class="flex items-start justify-between gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1">
              <!-- Field Machine Name / Key -->
              <div class="sm:col-span-4">
                <span class="block text-[11px] font-medium text-muted-foreground mb-1">Field Key (Machine Name)</span>
                <Input
                  bind:value={field.name}
                  placeholder="e.g. gender, attack, total_power"
                  class="font-mono text-xs w-full"
                />
              </div>

              <!-- Field Display Label -->
              <div class="sm:col-span-4">
                <span class="block text-[11px] font-medium text-muted-foreground mb-1">Display Label</span>
                <Input
                  bind:value={field.label}
                  placeholder="e.g. Gender, Base Attack, Combat Power"
                  class="text-xs w-full"
                />
              </div>

              <!-- Field Type Selector -->
              <div class="sm:col-span-4">
                <span class="block text-[11px] font-medium text-muted-foreground mb-1">Field Type</span>
                <Select
                  bind:value={field.fieldType}
                  options={fieldTypeOptions}
                />
              </div>
            </div>

            <!-- Delete Field Button -->
            <button
              type="button"
              onclick={() => removeField(index)}
              title="Delete Field"
              class="text-muted-foreground hover:text-destructive p-1.5 rounded transition mt-5 cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Type-Specific Specialized Configurator -->

          <!-- 1. ENUM BUILDER (PURE STRING CHOICES) -->
          {#if field.fieldType === 'ENUM'}
            <div class="p-3.5 bg-card rounded-lg border border-border space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <ListFilter class="w-3.5 h-3.5" />
                  <span>Enum Options (Standard Categorical String Choices)</span>
                </div>
                <span class="text-[10px] text-muted-foreground font-mono">e.g. ["Sword", "Saber", "Spear"]</span>
              </div>

              <!-- Options Tags -->
              <div class="space-y-2">
                {#if field.options.length === 0}
                  <p class="text-xs text-muted-foreground italic">No enum options defined yet. Add option labels below.</p>
                {/if}

                <div class="flex flex-wrap gap-2">
                  {#each field.options as opt, optIdx}
                    {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-xs text-foreground">
                      <span class="font-medium">{optLabel}</span>
                      <button
                        type="button"
                        onclick={() => removeOptionFromField(index, optIdx)}
                        class="text-muted-foreground hover:text-destructive transition ml-1 cursor-pointer"
                        title="Remove Option"
                      >
                        &times;
                      </button>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Add Enum Option Input -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <div class="sm:col-span-10">
                  <Input
                    bind:value={field.newOptionLabel}
                    placeholder="Option Label (e.g. Sword, Saber, Spear, Righteous Dao)"
                    class="text-xs"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOptionToField(index);
                      }
                    }}
                  />
                </div>
                <div class="sm:col-span-2">
                  <Button variant="secondary" size="sm" class="w-full h-9" onclick={() => addOptionToField(index)}>
                    <Plus class="w-3 h-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            </div>
          {/if}

          <!-- 2. VALUE_TYPE BUILDER (OPTIONS WITH POWER / NUMERIC WEIGHTS) -->
          {#if field.fieldType === 'VALUE_TYPE'}
            <div class="p-3.5 bg-card rounded-lg border border-border space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>Value Type Categories (Options with Power / Numeric Weights for Formulas)</span>
                </div>
                <span class="text-[10px] text-muted-foreground font-mono">e.g. &#123; divine : 1000 &#125;</span>
              </div>

              <!-- Options Tags -->
              <div class="space-y-2">
                {#if field.options.length === 0}
                  <p class="text-xs text-muted-foreground italic">No value types defined yet. Add an option label and numeric power below.</p>
                {/if}

                <div class="flex flex-wrap gap-2">
                  {#each field.options as opt, optIdx}
                    {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                    {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-xs text-foreground">
                      <span class="font-medium">{optLabel}</span>
                      {#if optPower !== undefined}
                        <span class="text-[11px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Power: {optPower}
                        </span>
                      {/if}
                      <button
                        type="button"
                        onclick={() => removeOptionFromField(index, optIdx)}
                        class="text-muted-foreground hover:text-destructive transition ml-1 cursor-pointer"
                        title="Remove Option"
                      >
                        &times;
                      </button>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Add Value Type Option Inputs -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <div class="sm:col-span-6">
                  <Input
                    bind:value={field.newOptionLabel}
                    placeholder="Option Name (e.g. Qi Refining, Foundation, Divine)"
                    class="text-xs"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOptionToField(index);
                      }
                    }}
                  />
                </div>
                <div class="sm:col-span-4">
                  <Input
                    type="number"
                    bind:value={field.newOptionPower}
                    placeholder="Power / Numeric Value (e.g. 100)"
                    class="text-xs font-mono"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOptionToField(index);
                      }
                    }}
                  />
                </div>
                <div class="sm:col-span-2">
                  <Button variant="secondary" size="sm" class="w-full h-9" onclick={() => addOptionToField(index)}>
                    <Plus class="w-3 h-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            </div>
          {/if}

          <!-- 2. BLUEPRINT REFERENCE BUILDER -->
          {#if field.fieldType === 'BLUEPRINT_REF'}
            <div class="p-3 bg-card rounded border border-border space-y-2.5">
              <div class="flex items-center gap-1.5 text-xs text-cyan-500 font-medium">
                <Link2 class="w-3.5 h-3.5" />
                <span>Target Referenced Blueprint (1st-Class or 2nd-Class)</span>
              </div>
              <p class="text-[11px] text-muted-foreground">
                Allows this field to embed or reference properties from another blueprint (e.g. "Romantic Affection Scale" or "Cultivation Rank").
              </p>
              <div class="max-w-md">
                <Select
                  bind:value={field.targetBlueprintId}
                  options={availableTargetBlueprints}
                />
              </div>
            </div>
          {/if}

          <!-- 3. MATHEMATICAL & LOGICAL FORMULA BUILDER -->
          {#if field.fieldType === 'FORMULA'}
            <div class="p-3.5 bg-card rounded border border-amber-500/40 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  <Calculator class="w-4 h-4" />
                  <span>Logical & Mathematical Formula Expression</span>
                </div>
                {#if field.formulaExpression}
                  {@const validation = getFormulaValidation(field.formulaExpression)}
                  {#if validation.valid}
                    <div class="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check class="w-3.5 h-3.5" />
                      <span>Valid Syntax</span>
                    </div>
                  {:else}
                    <div class="inline-flex items-center gap-1 text-[11px] text-destructive">
                      <AlertCircle class="w-3.5 h-3.5" />
                      <span>{validation.error}</span>
                    </div>
                  {/if}
                {/if}
              </div>

              <!-- Formula Expression Text Input -->
              <div>
                <Input
                  bind:value={field.formulaExpression}
                  placeholder="(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery"
                  class="font-mono text-xs w-full bg-muted/40 border-amber-500/40"
                />
              </div>

              <!-- Variable & Operator Quick Insertion Bar -->
              <div class="space-y-2 pt-1">
                <!-- Available Sibling Fields to Insert -->
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-[11px] text-muted-foreground mr-1">Insert Field:</span>
                  {#each fields.filter((f) => f.name && f.id !== field.id) as sibling}
                    <button
                      type="button"
                      onclick={() => insertTokenIntoFormula(index, sibling.name)}
                      class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-amber-600 dark:text-amber-300 hover:bg-muted/80 border border-border transition cursor-pointer"
                    >
                      {sibling.name}
                    </button>
                  {/each}

                  <!-- Common Dot-Notation Examples -->
                  <button
                    type="button"
                    onclick={() => insertTokenIntoFormula(index, 'cultivation.major_realm')}
                    class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-primary hover:bg-muted/80 border border-border transition cursor-pointer"
                  >
                    cultivation.major_realm
                  </button>
                  <button
                    type="button"
                    onclick={() => insertTokenIntoFormula(index, 'cultivation.minor_realm')}
                    class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-primary hover:bg-muted/80 border border-border transition cursor-pointer"
                  >
                    cultivation.minor_realm
                  </button>
                </div>

                <!-- Math Operators Bar -->
                <div class="flex flex-wrap items-center gap-1">
                  <span class="text-[11px] text-muted-foreground mr-1">Operators:</span>
                  {#each ['+', '-', '*', '/', '^', '%', '(', ')', 'IF(', 'CLAMP(', 'MIN(', 'MAX(', 'SQRT('] as op}
                    <button
                      type="button"
                      onclick={() => insertTokenIntoFormula(index, op)}
                      class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-foreground hover:bg-muted/80 transition cursor-pointer"
                    >
                      {op}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- 4. NUMBER BOUNDS & UNIT -->
          {#if field.fieldType === 'NUMBER'}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-card rounded border border-border">
              <div>
                <span class="block text-[10px] text-muted-foreground mb-1">Min Value</span>
                <Input type="number" bind:value={field.min} class="text-xs" />
              </div>
              <div>
                <span class="block text-[10px] text-muted-foreground mb-1">Max Value</span>
                <Input type="number" bind:value={field.max} class="text-xs" />
              </div>
              <div>
                <span class="block text-[10px] text-muted-foreground mb-1">Step</span>
                <Input type="number" bind:value={field.step} class="text-xs" />
              </div>
              <div>
                <span class="block text-[10px] text-muted-foreground mb-1">Metric Unit (e.g. Pts, Atk)</span>
                <Input bind:value={field.unit} placeholder="e.g. Pts" class="text-xs" />
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </Card>

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
    <a href="/world/schemas">
      <Button variant="outline" size="sm">Cancel</Button>
    </a>
    <Button variant="default" size="sm" onclick={handleCreateBlueprint}>
      <Check class="w-3.5 h-3.5" />
      <span>Save Blueprint Definition</span>
    </Button>
  </div>
</div>

