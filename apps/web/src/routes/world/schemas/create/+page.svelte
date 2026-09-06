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
    Type,
    ToggleLeft,
    Sparkles,
    AlertCircle,
    Info,
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
    type BlueprintClass,
    type BlueprintFieldType,
    type DynamicFieldDef,
  } from '$lib/stores/worldStore.svelte';
  import {
    evaluateFormula,
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
    options: string[];
    newOptionInput: string;
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
      label: 'Gender',
      fieldType: 'ENUM',
      description: 'Biological / physical identity',
      options: ['Male', 'Female'],
      newOptionInput: '',
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
    { value: 'ENUM', label: 'Enum / Custom Categories (Options)' },
    { value: 'BLUEPRINT_REF', label: 'Blueprint Reference (1st or 2nd Class)' },
    { value: 'FORMULA', label: 'Formula (Mathematical & Logical Computed Math)' },
    { value: 'BOOLEAN', label: 'Toggle (Boolean)' },
  ];

  // Available blueprints for referencing
  let availableTargetBlueprints = $derived(
    worldStore.blueprints.map((bp) => ({
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
      newOptionInput: '',
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
    const input = fields[fieldIndex].newOptionInput.trim();
    if (!input) return;
    if (!fields[fieldIndex].options.includes(input)) {
      fields[fieldIndex].options.push(input);
      if (!fields[fieldIndex].defaultValue) {
        fields[fieldIndex].defaultValue = input;
      }
    }
    fields[fieldIndex].newOptionInput = '';
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
      alert('Blueprint name is required.');
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
          def.options = f.options.length > 0 ? [...f.options] : ['Default'];
          def.defaultValue = f.defaultValue || def.options[0];
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
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Boxes class="w-5 h-5 text-teal-400" />
        <span>Create Blueprint from Scratch</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-1">
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
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
    <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
      <Layers class="w-4 h-4 text-teal-400" />
      <span>Blueprint Classification & Category</span>
    </h3>

    <!-- Blueprint Class Selector -->
    <div>
      <span class="block text-xs font-medium text-zinc-400 mb-2">Blueprint Tier / Class</span>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onclick={() => (blueprintClass = 'FIRST_CLASS')}
          class={`p-4 rounded-lg border text-left transition flex flex-col justify-between ${
            blueprintClass === 'FIRST_CLASS'
              ? 'border-teal-500 bg-teal-950/30 ring-1 ring-teal-500/50'
              : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
          }`}
        >
          <div>
            <div class="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <Boxes class="w-4 h-4 text-teal-400" />
              <span>1st-Class Blueprint (Primary Entity Archetype)</span>
            </div>
            <p class="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Instantiates tangible universe entities (e.g. Cultivator Characters, Divine Relics, Factions, Sects, Realms) with timeline lifecycles and causal mutations.
            </p>
          </div>
          <div class="mt-3 text-[11px] text-teal-400 font-medium">Instantiable in Universe Timeline</div>
        </button>

        <button
          type="button"
          onclick={() => (blueprintClass = 'SECOND_CLASS')}
          class={`p-4 rounded-lg border text-left transition flex flex-col justify-between ${
            blueprintClass === 'SECOND_CLASS'
              ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50'
              : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
          }`}
        >
          <div>
            <div class="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <Layers class="w-4 h-4 text-cyan-400" />
              <span>2nd-Class Blueprint (Sub-Schema & Value Object)</span>
            </div>
            <p class="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Reusable nested sub-schemas, gauges, or matrices (e.g. Romantic Affection Scale, Cultivation Mastery Matrix, Elemental Roots) referenced inside 1st-Class blueprints.
            </p>
          </div>
          <div class="mt-3 text-[11px] text-cyan-400 font-medium">Embeddable & Referenceable Schema</div>
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
              class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition"
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
  </div>

  <!-- Dynamic Field Builder -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
    <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
      <div>
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-teal-400" />
          <span>Dynamic Fields & Mathematical Formulas</span>
        </h3>
        <p class="text-xs text-zinc-500 mt-0.5">
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
        <div class="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
          <p class="text-xs text-zinc-500">No fields defined yet. Click below to add your first field.</p>
          <Button variant="outline" size="sm" class="mt-3" onclick={addField}>
            <Plus class="w-3.5 h-3.5" />
            <span>Add Field</span>
          </Button>
        </div>
      {/if}

      {#each fields as field, index (field.id)}
        <div class="p-4 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-4 relative group">
          <!-- Field Header & Primary Definition -->
          <div class="flex items-start justify-between gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1">
              <!-- Field Machine Name / Key -->
              <div class="sm:col-span-4">
                <span class="block text-[11px] font-medium text-zinc-400 mb-1">Field Key (Machine Name)</span>
                <Input
                  bind:value={field.name}
                  placeholder="e.g. gender, attack, total_power"
                  class="font-mono text-xs w-full"
                />
              </div>

              <!-- Field Display Label -->
              <div class="sm:col-span-4">
                <span class="block text-[11px] font-medium text-zinc-400 mb-1">Display Label</span>
                <Input
                  bind:value={field.label}
                  placeholder="e.g. Gender, Base Attack, Combat Power"
                  class="text-xs w-full"
                />
              </div>

              <!-- Field Type Selector -->
              <div class="sm:col-span-4">
                <span class="block text-[11px] font-medium text-zinc-400 mb-1">Field Type</span>
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
              class="text-zinc-600 hover:text-red-400 p-1.5 rounded transition mt-5"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Type-Specific Specialized Configurator -->

          <!-- 1. ENUM / CATEGORY BUILDER -->
          {#if field.fieldType === 'ENUM'}
            <div class="p-3 bg-zinc-900/90 rounded border border-zinc-800/80 space-y-2.5">
              <div class="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                <ListFilter class="w-3.5 h-3.5" />
                <span>Enum Categories & Allowed Options (e.g. "Male", "Female", "Genderless")</span>
              </div>

              <!-- Current Options Tags -->
              <div class="flex flex-wrap gap-2 items-center min-h-[32px]">
                {#if field.options.length === 0}
                  <span class="text-xs text-zinc-500 italic">No options added yet. Type below and press Enter.</span>
                {/if}

                {#each field.options as opt, optIdx}
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-200">
                    <span>{opt}</span>
                    <button
                      type="button"
                      onclick={() => removeOptionFromField(index, optIdx)}
                      class="text-zinc-400 hover:text-red-400 transition ml-0.5"
                    >
                      &times;
                    </button>
                  </div>
                {/each}
              </div>

              <!-- Add Option Input -->
              <div class="flex items-center gap-2 max-w-sm">
                <Input
                  bind:value={field.newOptionInput}
                  placeholder="Type option name (e.g. Male) and click Add"
                  class="text-xs"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOptionToField(index);
                    }
                  }}
                />
                <Button variant="secondary" size="sm" onclick={() => addOptionToField(index)}>
                  <Plus class="w-3 h-3" />
                  <span>Add Option</span>
                </Button>
              </div>
            </div>
          {/if}

          <!-- 2. BLUEPRINT REFERENCE BUILDER -->
          {#if field.fieldType === 'BLUEPRINT_REF'}
            <div class="p-3 bg-zinc-900/90 rounded border border-zinc-800/80 space-y-2.5">
              <div class="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                <Link2 class="w-3.5 h-3.5" />
                <span>Target Referenced Blueprint (1st-Class or 2nd-Class)</span>
              </div>
              <p class="text-[11px] text-zinc-400">
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
            <div class="p-3.5 bg-zinc-900 rounded border border-amber-900/40 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <Calculator class="w-4 h-4" />
                  <span>Logical & Mathematical Formula Expression</span>
                </div>
                {#if field.formulaExpression}
                  {@const validation = getFormulaValidation(field.formulaExpression)}
                  {#if validation.valid}
                    <div class="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <Check class="w-3.5 h-3.5" />
                      <span>Valid Syntax</span>
                    </div>
                  {:else}
                    <div class="inline-flex items-center gap-1 text-[11px] text-red-400">
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
                  class="font-mono text-xs w-full bg-black/60 border-amber-900/60 focus:ring-amber-500"
                />
              </div>

              <!-- Variable & Operator Quick Insertion Bar -->
              <div class="space-y-2 pt-1">
                <!-- Available Sibling Fields to Insert -->
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-[11px] text-zinc-500 mr-1">Insert Field:</span>
                  {#each fields.filter((f) => f.name && f.id !== field.id) as sibling}
                    <button
                      type="button"
                      onclick={() => insertTokenIntoFormula(index, sibling.name)}
                      class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 hover:bg-zinc-700 hover:text-amber-200 border border-zinc-700 transition"
                    >
                      {sibling.name}
                    </button>
                  {/each}

                  <!-- Common Dot-Notation Examples -->
                  <button
                    type="button"
                    onclick={() => insertTokenIntoFormula(index, 'cultivation.major_realm')}
                    class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-teal-300 hover:bg-zinc-700 border border-zinc-700 transition"
                  >
                    cultivation.major_realm
                  </button>
                  <button
                    type="button"
                    onclick={() => insertTokenIntoFormula(index, 'cultivation.minor_realm')}
                    class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-teal-300 hover:bg-zinc-700 border border-zinc-700 transition"
                  >
                    cultivation.minor_realm
                  </button>
                </div>

                <!-- Math Operators Bar -->
                <div class="flex flex-wrap items-center gap-1">
                  <span class="text-[11px] text-zinc-500 mr-1">Operators:</span>
                  {#each ['+', '-', '*', '/', '^', '%', '(', ')', 'IF(', 'CLAMP(', 'MIN(', 'MAX(', 'SQRT('] as op}
                    <button
                      type="button"
                      onclick={() => insertTokenIntoFormula(index, op)}
                      class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 transition"
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
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-zinc-900/80 rounded border border-zinc-800">
              <div>
                <span class="block text-[10px] text-zinc-400 mb-1">Min Value</span>
                <Input type="number" bind:value={field.min} class="text-xs" />
              </div>
              <div>
                <span class="block text-[10px] text-zinc-400 mb-1">Max Value</span>
                <Input type="number" bind:value={field.max} class="text-xs" />
              </div>
              <div>
                <span class="block text-[10px] text-zinc-400 mb-1">Step</span>
                <Input type="number" bind:value={field.step} class="text-xs" />
              </div>
              <div>
                <span class="block text-[10px] text-zinc-400 mb-1">Metric Unit (e.g. Pts, Atk)</span>
                <Input bind:value={field.unit} placeholder="e.g. Pts" class="text-xs" />
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
    <a href="/world/schemas">
      <Button variant="outline" size="sm">Cancel</Button>
    </a>
    <Button variant="default" size="sm" onclick={handleCreateBlueprint}>
      <Check class="w-3.5 h-3.5" />
      <span>Save Blueprint Definition</span>
    </Button>
  </div>
</div>
