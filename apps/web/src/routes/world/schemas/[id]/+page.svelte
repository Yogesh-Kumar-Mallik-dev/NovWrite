<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import {
    ArrowLeft,
    Check,
    Plus,
    Trash2,
    Boxes,
    Layers,
    Calculator,
    Link2,
    ListFilter,
    Hash,
    Sparkles,
    AlertCircle,
    Play,
    Shield,
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
    type BlueprintDef,
  } from '$lib/stores/worldStore.svelte';
  import {
    evaluateFormula,
    extractFormulaVariables,
    validateFormulaSyntax,
  } from '$lib/engine/formulaEngine';

  const blueprintId = $derived(page.params.id);
  const blueprint = $derived(worldStore.getBlueprint(blueprintId));

  let name = $state('');
  let blueprintClass = $state<BlueprintClass>('FIRST_CLASS');
  let category = $state('');
  let description = $state('');
  let saveMessage = $state<string | null>(null);

  // New field draft state
  let showNewFieldModal = $state(false);
  let newFieldName = $state('');
  let newFieldLabel = $state('');
  let newFieldType = $state<BlueprintFieldType>('STRING');
  let newFieldDesc = $state('');
  let newFieldOptions = $state<Array<{ label: string; value: string; power?: number; numericValue?: number }>>([
    { label: 'Option A', value: 'option_a', power: 100, numericValue: 100 },
    { label: 'Option B', value: 'option_b', power: 500, numericValue: 500 },
  ]);
  let newOptionLabelDraft = $state('');
  let newOptionPowerDraft = $state<number | undefined>(undefined);
  let newFieldTargetBp = $state('');
  let newFieldMin = $state(0);
  let newFieldMax = $state(1000);
  let newFieldStep = $state(1);
  let newFieldUnit = $state('');
  let newFieldDefault = $state('');
  let newFieldFormula = $state('');

  // Inline option adder state for existing fields (keyed by field.id)
  let inlineNewOptionLabels = $state<Record<string, string>>({});
  let inlineNewOptionPowers = $state<Record<string, number | undefined>>({});

  // Sandbox simulation test state
  let testSandboxContext = $state<Record<string, any>>({
    'cultivation.major_realm': 3,
    'cultivation.minor_realm': 5,
    special_Physique: 2.0,
    attack: 1200,
    attack_technique_Mastery: 1.8,
    defence: 800,
    defence_technique_mastery: 1.2,
  });

  const fieldTypeOptions = [
    { value: 'STRING', label: 'Text (String)' },
    { value: 'NUMBER', label: 'Number (Numeric with bounds)' },
    { value: 'BOOLEAN', label: 'Toggle (Boolean)' },
    { value: 'ENUM', label: 'Enum (Standard String Categories)' },
    { value: 'VALUE_TYPE', label: 'Value Type (Options with Power / Numeric Weights)' },
    { value: 'BLUEPRINT_REF', label: 'Blueprint Reference (1st or 2nd Class)' },
    { value: 'FORMULA', label: 'Formula (Mathematical & Logical Computed Math)' },
  ];

  let availableTargetBlueprints = $derived(
    worldStore.blueprints.map((bp: BlueprintDef) => ({
      value: bp.id,
      label: `${bp.name} (${bp.blueprintClass === 'FIRST_CLASS' ? '1st Class' : '2nd Class'} · ${bp.category})`,
    }))
  );

  $effect(() => {
    if (blueprint) {
      name = blueprint.name;
      blueprintClass = blueprint.blueprintClass;
      category = blueprint.category;
      description = blueprint.description || '';
      if (!newFieldTargetBp && availableTargetBlueprints.length > 0) {
        newFieldTargetBp = availableTargetBlueprints[0].value;
      }
    }
  });

  function handleSaveBlueprintOverview() {
    if (!blueprint || !name.trim()) return;

    worldStore.updateBlueprint(blueprint.id, {
      name: name.trim(),
      blueprintClass,
      category: category.trim() || 'General',
      description: description.trim(),
    });

    saveMessage = 'Blueprint details successfully updated!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleAddNewField() {
    if (!blueprint) return;
    const key = (newFieldName.trim() || newFieldLabel.trim().toLowerCase().replace(/\s+/g, '_')).replace(/[^a-zA-Z0-9_\.]/g, '');
    if (!key) {
      alert('Field Key or Label is required.');
      return;
    }

    const fieldDef: Omit<DynamicFieldDef, 'id'> = {
      name: key,
      label: newFieldLabel.trim() || key,
      fieldType: newFieldType,
      description: newFieldDesc.trim(),
    };

    if (newFieldType === 'ENUM') {
      fieldDef.options = newFieldOptions.length > 0
        ? newFieldOptions.map((o: any) => (typeof o === 'string' ? o : o.label || o.value))
        : ['Default'];
      fieldDef.defaultValue = newFieldDefault || (typeof fieldDef.options[0] === 'object' ? fieldDef.options[0].value : fieldDef.options[0]);
    } else if (newFieldType === 'VALUE_TYPE') {
      fieldDef.options = newFieldOptions.length > 0
        ? newFieldOptions.map((o: any) => ({
            label: typeof o === 'string' ? o : o.label,
            value: typeof o === 'string' ? o.toLowerCase().replace(/\s+/g, '_') : (o.value || (o.label ? o.label.toLowerCase().replace(/\s+/g, '_') : '')),
            power: typeof o === 'string' ? 0 : (o.power !== undefined ? Number(o.power) : (o.numericValue !== undefined ? Number(o.numericValue) : 0)),
            numericValue: typeof o === 'string' ? 0 : (o.power !== undefined ? Number(o.power) : (o.numericValue !== undefined ? Number(o.numericValue) : 0)),
          }))
        : [{ label: 'Default', value: 'default', power: 0, numericValue: 0 }];
      const first = fieldDef.options[0];
      fieldDef.defaultValue = newFieldDefault || (typeof first === 'object' ? first.value : first);
    } else if (newFieldType === 'NUMBER') {
      fieldDef.min = newFieldMin;
      fieldDef.max = newFieldMax;
      fieldDef.step = newFieldStep;
      fieldDef.unit = newFieldUnit;
      fieldDef.defaultValue = parseFloat(newFieldDefault) || 0;
    } else if (newFieldType === 'BLUEPRINT_REF') {
      fieldDef.targetBlueprintId = newFieldTargetBp;
      const targetBp = worldStore.getBlueprint(newFieldTargetBp);
      fieldDef.targetBlueprintName = targetBp?.name;
    } else if (newFieldType === 'FORMULA') {
      fieldDef.formulaExpression = newFieldFormula.trim();
      fieldDef.formulaDependencies = extractFormulaVariables(newFieldFormula);
    } else if (newFieldType === 'BOOLEAN') {
      fieldDef.defaultValue = newFieldDefault === 'true';
    } else {
      fieldDef.defaultValue = newFieldDefault;
    }

    worldStore.addFieldToBlueprint(blueprint.id, fieldDef);

    // Reset draft
    newFieldName = '';
    newFieldLabel = '';
    newFieldDesc = '';
    newFieldFormula = '';
    newFieldOptions = [
      { label: 'Option A', value: 'option_a', power: 100, numericValue: 100 },
      { label: 'Option B', value: 'option_b', power: 500, numericValue: 500 },
    ];
    newFieldDefault = '';
    newOptionLabelDraft = '';
    newOptionPowerDraft = undefined;
    showNewFieldModal = false;

    saveMessage = `Dynamic field "${key}" added to blueprint!`;
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleAddOptionToExistingField(fieldId: string) {
    if (!blueprint) return;
    const targetField = blueprint.fields.find((f: DynamicFieldDef) => f.id === fieldId || f.name === fieldId);
    const label = (inlineNewOptionLabels[fieldId] || '').trim();
    if (!label) return;
    const power = inlineNewOptionPowers[fieldId];
    const value = label.toLowerCase().replace(/\s+/g, '_');

    if (targetField?.fieldType === 'ENUM') {
      worldStore.addOptionToField(blueprint.id, fieldId, label);
    } else {
      worldStore.addOptionToField(blueprint.id, fieldId, {
        label,
        value,
        power: power !== undefined ? Number(power) : 0,
        numericValue: power !== undefined ? Number(power) : 0,
      });
    }

    inlineNewOptionLabels[fieldId] = '';
    inlineNewOptionPowers[fieldId] = undefined;
  }

  function handleRemoveOptionFromExistingField(fieldId: string, optionIndex: number) {
    if (!blueprint) return;
    worldStore.removeOptionFromField(blueprint.id, fieldId, optionIndex);
  }

  function handleDeleteField(fieldId: string, fieldName: string) {
    if (!blueprint) return;
    if (confirm(`Remove field "${fieldName}" from blueprint "${blueprint.name}"?`)) {
      worldStore.deleteBlueprintField(blueprint.id, fieldId);
    }
  }

  function handleDeleteBlueprint() {
    if (!blueprint) return;
    if (confirm(`Are you sure you want to permanently delete blueprint "${blueprint.name}"?`)) {
      worldStore.deleteBlueprint(blueprint.id);
      goto('/world/schemas');
    }
  }
</script>

{#if !blueprint}
  <div class="max-w-4xl mx-auto space-y-6">
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Blueprints', href: '/world/schemas' },
        { label: 'Blueprint Not Found' },
      ]}
    />
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center space-y-3">
      <Shield class="w-8 h-8 text-zinc-600 mx-auto" />
      <h2 class="text-base font-bold text-zinc-300">Blueprint Not Found</h2>
      <a href="/world/schemas">
        <Button variant="outline" size="sm">Return to Blueprints Workbench</Button>
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-4xl mx-auto space-y-6 pb-16">
    <!-- Breadcrumb -->
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Blueprints & Schemas', href: '/world/schemas' },
        { label: blueprint.name },
      ]}
    />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          {#if blueprint.blueprintClass === 'FIRST_CLASS'}
            <Boxes class="w-5 h-5 text-teal-400" />
          {:else}
            <Layers class="w-5 h-5 text-cyan-400" />
          {/if}
          <h2 class="text-xl font-bold tracking-tight text-zinc-100">{blueprint.name}</h2>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class={`font-medium ${blueprint.blueprintClass === 'FIRST_CLASS' ? 'text-teal-400' : 'text-cyan-400'}`}>
            {blueprint.blueprintClass === 'FIRST_CLASS' ? '1st-Class Entity Archetype' : '2nd-Class Sub-Schema'}
          </span>
          <span class="text-zinc-600">·</span>
          <span class="text-zinc-400 font-mono">{blueprint.id}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if blueprint.blueprintClass === 'FIRST_CLASS'}
          <a href={`/world/entities/create?blueprintId=${blueprint.id}`}>
            <Button variant="secondary" size="sm">
              <Plus class="w-3.5 h-3.5" />
              <span>Instantiate Entity</span>
            </Button>
          </a>
        {/if}
        <a href="/world/schemas">
          <Button variant="outline" size="sm">
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>All Blueprints</span>
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

    <!-- Meta Details Card -->
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Boxes class="w-4 h-4 text-teal-400" />
        <span>Blueprint Identity & Metadata</span>
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field id="bp-name" label="Blueprint Name">
          <Input id="bp-name" bind:value={name} class="w-full text-xs" />
        </Field>

        <Field id="bp-cat" label="Category">
          <Input id="bp-cat" bind:value={category} class="w-full text-xs" />
        </Field>

        <Field id="bp-tier" label="Blueprint Tier">
          <Select
            id="bp-tier"
            bind:value={blueprintClass}
            options={[
              { value: 'FIRST_CLASS', label: '1st-Class Archetype' },
              { value: 'SECOND_CLASS', label: '2nd-Class Sub-Schema' },
            ]}
          />
        </Field>
      </div>

      <Field id="bp-desc" label="Description">
        <Textarea
          id="bp-desc"
          bind:value={description}
          rows={2}
          class="w-full text-xs"
        />
      </Field>

      <div class="flex justify-end pt-2">
        <Button variant="default" size="sm" onclick={handleSaveBlueprintOverview}>
          <Check class="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>
    </div>

    <!-- Fields & Mathematical Formulas Workbench -->
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-teal-400" />
            <span>Defined Fields & Mathematical Formulas ({blueprint.fields.length})</span>
          </h3>
          <p class="text-xs text-zinc-500 mt-0.5">
            Manage custom field schemas, enum options, target blueprint references, and computed formulas.
          </p>
        </div>

        <Button variant="secondary" size="sm" onclick={() => (showNewFieldModal = !showNewFieldModal)}>
          <Plus class="w-3.5 h-3.5" />
          <span>{showNewFieldModal ? 'Close Form' : 'Attach New Field'}</span>
        </Button>
      </div>

      <!-- Add New Field Form Drawer -->
      {#if showNewFieldModal}
        <div class="p-5 rounded-lg border border-teal-800/60 bg-teal-950/20 space-y-4">
          <div class="flex items-center gap-2 text-xs font-semibold text-teal-300">
            <Plus class="w-4 h-4 text-teal-400" />
            <span>Add New Dynamic Field to Blueprint</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span class="block text-[11px] font-medium text-zinc-400 mb-1">Field Machine Key</span>
              <Input
                bind:value={newFieldName}
                placeholder="e.g. gender, attack, total_power"
                class="font-mono text-xs w-full"
              />
            </div>

            <div>
              <span class="block text-[11px] font-medium text-zinc-400 mb-1">Display Label</span>
              <Input
                bind:value={newFieldLabel}
                placeholder="e.g. Gender, Attack Power"
                class="text-xs w-full"
              />
            </div>

            <div>
              <span class="block text-[11px] font-medium text-zinc-400 mb-1">Field Type</span>
              <Select bind:value={newFieldType} options={fieldTypeOptions} />
            </div>
          </div>

          <!-- ENUM options builder -->
          {#if newFieldType === 'ENUM'}
            <div class="p-3 bg-zinc-900 rounded border border-zinc-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-teal-400">Enum Options (Standard Categorical String Choices)</span>
                <span class="text-[10px] text-zinc-500">e.g. ["Sword", "Saber", "Spear"]</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each newFieldOptions as opt, optIdx}
                  {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-200">
                    <span>{optLabel}</span>
                    <button
                      type="button"
                      onclick={() => newFieldOptions.splice(optIdx, 1)}
                      class="text-zinc-400 hover:text-red-400 ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                {/each}
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <Input
                  bind:value={newOptionLabelDraft}
                  placeholder="Option Label (e.g. Sword, Saber)"
                  class="text-xs sm:col-span-2"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newOptionLabelDraft.trim()) {
                        const lbl = newOptionLabelDraft.trim();
                        newFieldOptions.push({
                          label: lbl,
                          value: lbl.toLowerCase().replace(/\s+/g, '_'),
                          power: 0,
                          numericValue: 0,
                        });
                        newOptionLabelDraft = '';
                        newOptionPowerDraft = undefined;
                      }
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  class="sm:col-span-1"
                  onclick={() => {
                    if (newOptionLabelDraft.trim()) {
                      const lbl = newOptionLabelDraft.trim();
                      newFieldOptions.push({
                        label: lbl,
                        value: lbl.toLowerCase().replace(/\s+/g, '_'),
                        power: 0,
                        numericValue: 0,
                      });
                      newOptionLabelDraft = '';
                      newOptionPowerDraft = undefined;
                    }
                  }}
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </Button>
              </div>
            </div>
          {/if}

          <!-- VALUE_TYPE options builder -->
          {#if newFieldType === 'VALUE_TYPE'}
            <div class="p-3 bg-zinc-900 rounded border border-zinc-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-indigo-400">Value Type Options (With Power / Numeric Weights)</span>
                <span class="text-[10px] text-zinc-500">Attach numeric values for mathematical formulas</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each newFieldOptions as opt, optIdx}
                  {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                  {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-200">
                    <span>{optLabel}</span>
                    {#if optPower !== undefined}
                      <span class="px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px]">
                        Power: {optPower}
                      </span>
                    {/if}
                    <button
                      type="button"
                      onclick={() => newFieldOptions.splice(optIdx, 1)}
                      class="text-zinc-400 hover:text-red-400 ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                {/each}
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <Input
                  bind:value={newOptionLabelDraft}
                  placeholder="Option Name (e.g. Golden Core)"
                  class="text-xs sm:col-span-1"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newOptionLabelDraft.trim()) {
                        const lbl = newOptionLabelDraft.trim();
                        const pwr = newOptionPowerDraft !== undefined ? Number(newOptionPowerDraft) : 0;
                        newFieldOptions.push({
                          label: lbl,
                          value: lbl.toLowerCase().replace(/\s+/g, '_'),
                          power: pwr,
                          numericValue: pwr,
                        });
                        newOptionLabelDraft = '';
                        newOptionPowerDraft = undefined;
                      }
                    }
                  }}
                />
                <Input
                  type="number"
                  bind:value={newOptionPowerDraft}
                  placeholder="Power / Value (e.g. 500)"
                  class="text-xs font-mono sm:col-span-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  class="sm:col-span-1"
                  onclick={() => {
                    if (newOptionLabelDraft.trim()) {
                      const lbl = newOptionLabelDraft.trim();
                      const pwr = newOptionPowerDraft !== undefined ? Number(newOptionPowerDraft) : 0;
                      newFieldOptions.push({
                        label: lbl,
                        value: lbl.toLowerCase().replace(/\s+/g, '_'),
                        power: pwr,
                        numericValue: pwr,
                      });
                      newOptionLabelDraft = '';
                      newOptionPowerDraft = undefined;
                    }
                  }}
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </Button>
              </div>
            </div>
          {/if}

          <!-- Blueprint Ref -->
          {#if newFieldType === 'BLUEPRINT_REF'}
            <div class="p-3 bg-zinc-900 rounded border border-zinc-800 space-y-2">
              <span class="text-xs font-medium text-cyan-400">Target Blueprint</span>
              <Select bind:value={newFieldTargetBp} options={availableTargetBlueprints} />
            </div>
          {/if}

          <!-- Formula -->
          {#if newFieldType === 'FORMULA'}
            <div class="p-3.5 bg-zinc-900 rounded border border-amber-900/50 space-y-2">
              <span class="text-xs font-medium text-amber-400">Mathematical Formula Expression</span>
              <Input
                bind:value={newFieldFormula}
                placeholder="(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery"
                class="font-mono text-xs w-full bg-black/60 border-amber-900/60"
              />
              <div class="flex flex-wrap gap-1">
                {#each blueprint.fields.map((f: DynamicFieldDef) => f.name) as fKey}
                  <button
                    type="button"
                    onclick={() => (newFieldFormula = newFieldFormula ? `${newFieldFormula} ${fKey}` : fKey)}
                    class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 hover:bg-zinc-700 transition"
                  >
                    {fKey}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onclick={() => (showNewFieldModal = false)}>Cancel</Button>
            <Button variant="default" size="sm" onclick={handleAddNewField}>
              <Check class="w-3.5 h-3.5" />
              <span>Attach Field</span>
            </Button>
          </div>
        </div>
      {/if}

      <!-- Current Blueprint Fields List -->
      <div class="space-y-3">
        {#each blueprint.fields as field (field.id)}
          <div class="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 space-y-2.5">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  {#if field.fieldType === 'FORMULA'}
                    <Calculator class="w-4 h-4 text-amber-400" />
                  {:else if field.fieldType === 'ENUM'}
                    <ListFilter class="w-4 h-4 text-teal-400" />
                  {:else if field.fieldType === 'VALUE_TYPE'}
                    <Sparkles class="w-4 h-4 text-indigo-400" />
                  {:else if field.fieldType === 'BLUEPRINT_REF'}
                    <Link2 class="w-4 h-4 text-cyan-400" />
                  {:else if field.fieldType === 'NUMBER'}
                    <Hash class="w-4 h-4 text-emerald-400" />
                  {:else}
                    <Boxes class="w-4 h-4 text-zinc-400" />
                  {/if}
                  <span class="text-sm font-semibold text-zinc-100">{field.label}</span>
                  <span class="text-xs font-mono text-zinc-500">({field.name})</span>
                </div>
                {#if field.description}
                  <p class="text-xs text-zinc-400">{field.description}</p>
                {/if}
              </div>

              <div class="flex items-center gap-3">
                <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {field.fieldType}
                </span>
                <button
                  type="button"
                  onclick={() => handleDeleteField(field.id, field.name)}
                  class="text-zinc-600 hover:text-red-400 p-1 transition"
                  title="Remove Field"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Enum Details & Options Management (Pure Categorical Strings) -->
            {#if field.fieldType === 'ENUM' && field.options}
              <div class="space-y-2 pt-2 border-t border-zinc-900">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-teal-400 font-medium">Enum Categorical Options:</span>
                  <span class="text-[10px] text-zinc-500 font-mono">{field.options.length} options</span>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  {#each field.options as opt, optIdx}
                    {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                      <span>{optLabel}</span>
                      <button
                        type="button"
                        onclick={() => handleRemoveOptionFromExistingField(field.id, optIdx)}
                        class="text-zinc-500 hover:text-red-400 transition ml-0.5"
                        title="Delete Option"
                      >
                        &times;
                      </button>
                    </span>
                  {/each}
                </div>

                <!-- Inline Enum Option Adder -->
                <div class="flex items-center gap-2 max-w-md pt-1">
                  <Input
                    bind:value={inlineNewOptionLabels[field.id]}
                    placeholder="New Option (e.g. Demonic Path)"
                    class="text-xs h-7 flex-1"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOptionToExistingField(field.id);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    class="h-7 px-2.5 text-xs shrink-0"
                    onclick={() => handleAddOptionToExistingField(field.id)}
                  >
                    <Plus class="w-3 h-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            {/if}

            <!-- Value Type Details & Options Management (With Numeric Weights / Power) -->
            {#if field.fieldType === 'VALUE_TYPE' && field.options}
              <div class="space-y-2 pt-2 border-t border-zinc-900">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-indigo-400 font-medium">Value Type Options & Formula Power Values:</span>
                  <span class="text-[10px] text-zinc-500 font-mono">{field.options.length} options defined</span>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  {#each field.options as opt, optIdx}
                    {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                    {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                      <span>{optLabel}</span>
                      {#if optPower !== undefined}
                        <span class="px-1 py-0.2 rounded bg-indigo-950/80 text-indigo-300 font-mono text-[10px]">
                          Power: {optPower}
                        </span>
                      {/if}
                      <button
                        type="button"
                        onclick={() => handleRemoveOptionFromExistingField(field.id, optIdx)}
                        class="text-zinc-500 hover:text-red-400 transition ml-0.5"
                        title="Delete Option"
                      >
                        &times;
                      </button>
                    </span>
                  {/each}
                </div>

                <!-- Inline Value Type Option Adder -->
                <div class="flex items-center gap-2 max-w-md pt-1">
                  <Input
                    bind:value={inlineNewOptionLabels[field.id]}
                    placeholder="New Option (e.g. Tribulation Realm)"
                    class="text-xs h-7"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOptionToExistingField(field.id);
                      }
                    }}
                  />
                  <Input
                    type="number"
                    bind:value={inlineNewOptionPowers[field.id]}
                    placeholder="Power"
                    class="text-xs font-mono h-7 w-24"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOptionToExistingField(field.id);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    class="h-7 px-2.5 text-xs shrink-0"
                    onclick={() => handleAddOptionToExistingField(field.id)}
                  >
                    <Plus class="w-3 h-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            {/if}

            <!-- Blueprint Ref Details -->
            {#if field.fieldType === 'BLUEPRINT_REF'}
              <div class="flex items-center gap-2 text-xs pt-1 text-cyan-400 font-medium">
                <Link2 class="w-3.5 h-3.5" />
                <span>Referenced Blueprint: {field.targetBlueprintName || field.targetBlueprintId}</span>
              </div>
            {/if}

            <!-- Formula Details & Live Evaluation preview -->
            {#if field.fieldType === 'FORMULA' && field.formulaExpression}
              {@const evalRes = evaluateFormula(field.formulaExpression, testSandboxContext)}
              <div class="p-3 bg-zinc-900 rounded border border-amber-950/60 space-y-2 mt-2">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5 text-amber-400 font-mono">
                    <Calculator class="w-3.5 h-3.5" />
                    <span>Formula: {field.formulaExpression}</span>
                  </div>
                  {#if evalRes.success}
                    <div class="inline-flex items-center gap-1 text-emerald-400 font-bold font-mono">
                      <span>Evaluated Result: {evalRes.formattedValue}</span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-zinc-900 rounded-lg border border-red-950/40 p-5 flex items-center justify-between">
      <div>
        <h4 class="text-xs font-bold text-red-400 uppercase tracking-wider">Delete Blueprint</h4>
        <p class="text-xs text-zinc-500 mt-0.5">
          Permanently remove this blueprint from the world schema registry.
        </p>
      </div>
      <Button variant="outline" size="sm" onclick={handleDeleteBlueprint} class="text-red-400 hover:bg-red-950/50 hover:border-red-800">
        <Trash2 class="w-3.5 h-3.5" />
        <span>Delete Blueprint</span>
      </Button>
    </div>
  </div>
{/if}
