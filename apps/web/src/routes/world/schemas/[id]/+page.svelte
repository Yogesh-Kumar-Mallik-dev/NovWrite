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
    Shield,
  } from 'lucide-svelte';
  import {
    Button,
    Input,
    Select,
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
    type BlueprintClass,
    type BlueprintFieldType,
    type DynamicFieldDef,
    type BlueprintDef,
  } from '$lib/stores/worldStore.svelte';
  import {
    evaluateFormula,
    extractFormulaVariables,
  } from '$lib/engine/formulaEngine';

  const blueprintId = $derived(page.params.id);
  const blueprint = $derived(worldStore.getBlueprint(blueprintId));

  const initialBp = worldStore.getBlueprint(page.params.id);

  // Confirmation States
  let fieldToDelete = $state<{ id: string; name: string } | null>(null);
  let deleteBpConfirmOpen = $state(false);

  let loadedBpId = $state<string | null>(initialBp?.id || null);
  let name = $state(initialBp?.name || '');
  let blueprintClass = $state<BlueprintClass>(initialBp?.blueprintClass || 'FIRST_CLASS');
  let category = $state(initialBp?.category || '');
  let description = $state(initialBp?.description || '');
  let saveMessage = $state<string | null>(null);

  // Sync state if blueprint changes or loads from localStorage on refresh
  $effect(() => {
    if (blueprint && blueprint.id !== loadedBpId) {
      loadedBpId = blueprint.id;
      name = blueprint.name;
      blueprintClass = blueprint.blueprintClass;
      category = blueprint.category;
      description = blueprint.description;
    }
  });

  // New field draft state
  let showNewFieldModal = $state(false);
  let newFieldName = $state('');
  let newFieldLabel = $state('');
  let newFieldType = $state<BlueprintFieldType>('STRING');
  let newFieldDesc = $state('');
  let newFieldOptions = $state<Array<{ label: string; value: string; power?: number; numericValue?: number }>>([]);
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
    { value: 'ARRAY', label: 'Array / Tag List (e.g. Titles, Techniques)' },
    { value: 'BLUEPRINT_REF', label: 'Blueprint Reference (Single 1st or 2nd Class)' },
    { value: 'ARRAY_REF', label: 'Array Reference (Multiple Blueprint Refs)' },
    { value: 'FORMULA', label: 'Formula (Mathematical & Logical Computed Math)' },
  ];

  let availableTargetBlueprints = $derived(
    worldStore.blueprints.map((bp: BlueprintDef) => ({
      value: bp.id,
      label: `${bp.name} (${bp.blueprintClass === 'FIRST_CLASS' ? '1st Class' : '2nd Class'} · ${bp.category})`,
    }))
  );

  $effect(() => {
    const currentId = blueprintId;
    const bp = worldStore.getBlueprint(currentId);
    if (bp && bp.id !== loadedBpId) {
      loadedBpId = bp.id;
      name = bp.name;
      blueprintClass = bp.blueprintClass;
      category = bp.category;
      description = bp.description || '';
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

    toast.success("Blueprint Saved", `Blueprint "${name.trim()}" overview updated.`);
    saveMessage = 'Blueprint details successfully updated!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleAddNewField() {
    if (!blueprint) return;
    const key = (newFieldName.trim() || newFieldLabel.trim().toLowerCase().replace(/\s+/g, '_')).replace(/[^a-zA-Z0-9_\.]/g, '');
    if (!key) {
      toast.error('Validation Error', 'Field Key or Label is required.');
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
    } else if (newFieldType === 'BLUEPRINT_REF' || newFieldType === 'ARRAY_REF') {
      fieldDef.targetBlueprintId = newFieldTargetBp;
      const targetBp = worldStore.getBlueprint(newFieldTargetBp);
      fieldDef.targetBlueprintName = targetBp?.name;
      if (newFieldType === 'ARRAY_REF') {
        fieldDef.referenceCardinality = 'MANY';
      }
    } else if (newFieldType === 'ARRAY') {
      fieldDef.defaultValue = [];
    } else if (newFieldType === 'FORMULA') {
      fieldDef.formulaExpression = newFieldFormula.trim();
      fieldDef.formulaDependencies = extractFormulaVariables(newFieldFormula);
    } else if (newFieldType === 'BOOLEAN') {
      fieldDef.defaultValue = newFieldDefault === 'true';
    } else {
      fieldDef.defaultValue = newFieldDefault;
    }

    worldStore.addFieldToBlueprint(blueprint.id, fieldDef);
    toast.success("Dynamic Field Added", `Field "${fieldDef.label || key}" attached to blueprint.`);

    // Reset draft
    newFieldName = '';
    newFieldLabel = '';
    newFieldDesc = '';
    newFieldFormula = '';
    newFieldOptions = [];
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

    toast.success("Option Added", `Option "${label}" added to field.`);
    inlineNewOptionLabels[fieldId] = '';
    inlineNewOptionPowers[fieldId] = undefined;
  }

  function handleRemoveOptionFromExistingField(fieldId: string, optionIndex: number) {
    if (!blueprint) return;
    worldStore.removeOptionFromField(blueprint.id, fieldId, optionIndex);
    toast.info("Option Removed", "Option deleted from field.");
  }

  function handleDeleteField(fieldId: string, fieldName: string) {
    fieldToDelete = { id: fieldId, name: fieldName };
  }

  function confirmDeleteField() {
    if (blueprint && fieldToDelete) {
      worldStore.deleteBlueprintField(blueprint.id, fieldToDelete.id);
      toast.success("Field Deleted", `Field "${fieldToDelete.name}" was removed.`);
      fieldToDelete = null;
    }
  }

  function confirmDeleteBlueprint() {
    if (!blueprint) return;
    const bpName = blueprint.name;
    worldStore.deleteBlueprint(blueprint.id);
    toast.success("Blueprint Deleted", `Blueprint "${bpName}" was permanently removed.`);
    deleteBpConfirmOpen = false;
    goto('/world/schemas');
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
    <EmptyState
      icon={Shield}
      title="Blueprint Not Found"
      description="The requested blueprint schema does not exist or has been deleted from the universe registry."
      actionText="Return to Blueprints Workbench"
      actionHref="/world/schemas"
    />
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          {#if blueprint.blueprintClass === 'FIRST_CLASS'}
            <Boxes class="w-5 h-5 text-primary" />
          {:else}
            <Layers class="w-5 h-5 text-cyan-500" />
          {/if}
          <h2 class="text-xl font-bold tracking-tight text-foreground">{blueprint.name}</h2>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class={`font-medium ${blueprint.blueprintClass === 'FIRST_CLASS' ? 'text-primary' : 'text-cyan-500'}`}>
            {blueprint.blueprintClass === 'FIRST_CLASS' ? '1st-Class Entity Archetype' : '2nd-Class Sub-Schema'}
          </span>
          <span class="text-muted-foreground/60">·</span>
          <span class="text-muted-foreground font-mono">{blueprint.id}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if blueprint.blueprintClass === 'FIRST_CLASS'}
          <Button href={`/world/entities/create?blueprintId=${blueprint.id}`} variant="secondary" size="sm">
            <Plus class="w-3.5 h-3.5" />
            <span>Instantiate Entity</span>
          </Button>
        {/if}
        <Button href="/world/schemas" variant="outline" size="sm">
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>All Blueprints</span>
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

    <!-- Meta Details Card -->
    <Card class="p-6 space-y-4 border-border bg-card">
      <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
        <Boxes class="w-4 h-4 text-primary" />
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
    </Card>

    <!-- Fields & Mathematical Formulas Workbench -->
    <Card class="p-6 space-y-6 border-border bg-card">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-primary" />
            <span>Defined Fields & Mathematical Formulas ({blueprint.fields.length})</span>
          </h3>
          <p class="text-xs text-muted-foreground mt-0.5">
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
        <div class="p-5 rounded-lg border border-border bg-muted/40 space-y-4">
          <div class="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Plus class="w-4 h-4 text-primary" />
            <span>Add New Dynamic Field to Blueprint</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span class="block text-[11px] font-medium text-muted-foreground mb-1">Field Machine Key</span>
              <Input
                bind:value={newFieldName}
                placeholder="e.g. gender, attack, total_power"
                class="font-mono text-xs w-full"
              />
            </div>

            <div>
              <span class="block text-[11px] font-medium text-muted-foreground mb-1">Display Label</span>
              <Input
                bind:value={newFieldLabel}
                placeholder="e.g. Gender, Attack Power"
                class="text-xs w-full"
              />
            </div>

            <div>
              <span class="block text-[11px] font-medium text-muted-foreground mb-1">Field Type</span>
              <Select bind:value={newFieldType} options={fieldTypeOptions} />
            </div>
          </div>

          <!-- ENUM options builder -->
          {#if newFieldType === 'ENUM'}
            <div class="p-3 bg-card rounded border border-border space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-primary">Enum Options (Standard Categorical String Choices)</span>
                <span class="text-[10px] text-muted-foreground">e.g. ["Sword", "Saber", "Spear"]</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each newFieldOptions as opt, optIdx}
                  {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-border text-xs text-foreground">
                    <span>{optLabel}</span>
                    <button
                      type="button"
                      onclick={() => newFieldOptions.splice(optIdx, 1)}
                      class="text-muted-foreground hover:text-destructive ml-0.5 cursor-pointer"
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
            <div class="p-3 bg-card rounded border border-border space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-primary">Value Type Options (With Power / Numeric Weights)</span>
                <span class="text-[10px] text-muted-foreground">Attach numeric values for mathematical formulas</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each newFieldOptions as opt, optIdx}
                  {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                  {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-border text-xs text-foreground">
                    <span>{optLabel}</span>
                    {#if optPower !== undefined}
                      <span class="px-1 py-0.2 rounded bg-primary/20 text-primary font-mono text-[10px]">
                        Power: {optPower}
                      </span>
                    {/if}
                    <button
                      type="button"
                      onclick={() => newFieldOptions.splice(optIdx, 1)}
                      class="text-muted-foreground hover:text-destructive ml-0.5 cursor-pointer"
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

          <!-- Array Tag List Info -->
          {#if newFieldType === 'ARRAY'}
            <div class="p-3 bg-card rounded border border-border space-y-1.5">
              <span class="text-xs font-medium text-indigo-500 flex items-center gap-1.5">
                <ListFilter class="w-3.5 h-3.5" />
                <span>Array / Tag List Field</span>
              </span>
              <p class="text-[11px] text-muted-foreground">
                Allows entities of this blueprint to hold multiple string tags/items (e.g. Titles, Attack Techniques, Aliases).
              </p>
            </div>
          {/if}

          <!-- Blueprint Ref & Array Ref -->
          {#if newFieldType === 'BLUEPRINT_REF' || newFieldType === 'ARRAY_REF'}
            <div class="p-3 bg-card rounded border border-border space-y-2">
              <span class="text-xs font-medium text-cyan-500 flex items-center gap-1.5">
                <Link2 class="w-3.5 h-3.5" />
                <span>{newFieldType === 'ARRAY_REF' ? 'Target Referenced Blueprint (Multi-Select Reference)' : 'Target Referenced Blueprint'}</span>
              </span>
              <Select bind:value={newFieldTargetBp} options={availableTargetBlueprints} placeholder="Select target blueprint..." />
            </div>
          {/if}

          <!-- Formula -->
          {#if newFieldType === 'FORMULA'}
            <div class="p-3.5 bg-card rounded border border-amber-500/40 space-y-2">
              <span class="text-xs font-medium text-amber-600 dark:text-amber-400">Mathematical Formula Expression</span>
              <Input
                bind:value={newFieldFormula}
                placeholder="(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery"
                class="font-mono text-xs w-full bg-muted/40 border-amber-500/40"
              />
              <div class="flex flex-wrap gap-1">
                {#each blueprint.fields.map((f: DynamicFieldDef) => f.name) as fKey}
                  <button
                    type="button"
                    onclick={() => (newFieldFormula = newFieldFormula ? `${newFieldFormula} ${fKey}` : fKey)}
                    class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-amber-600 dark:text-amber-300 hover:bg-muted/80 transition cursor-pointer"
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
        {#if blueprint.fields.length === 0}
          <EmptyState
            icon={Boxes}
            title="No Dynamic Fields Defined"
            description="Add custom properties, categorical enums, entity relations, or live mathematical formulas to architect this blueprint."
            actionText="+ Add Dynamic Field"
            onAction={() => (showNewFieldModal = true)}
            compact={true}
          />
        {:else}
          {#each blueprint.fields as field (field.id)}
          <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  {#if field.fieldType === 'FORMULA'}
                    <Calculator class="w-4 h-4 text-amber-500" />
                  {:else if field.fieldType === 'ENUM'}
                    <ListFilter class="w-4 h-4 text-primary" />
                  {:else if field.fieldType === 'VALUE_TYPE'}
                    <Sparkles class="w-4 h-4 text-primary" />
                  {:else if field.fieldType === 'ARRAY'}
                    <ListFilter class="w-4 h-4 text-indigo-500" />
                  {:else if field.fieldType === 'BLUEPRINT_REF'}
                    <Link2 class="w-4 h-4 text-cyan-500" />
                  {:else if field.fieldType === 'ARRAY_REF'}
                    <Link2 class="w-4 h-4 text-cyan-400" />
                  {:else if field.fieldType === 'NUMBER'}
                    <Hash class="w-4 h-4 text-emerald-500" />
                  {:else}
                    <Boxes class="w-4 h-4 text-muted-foreground" />
                  {/if}
                  <span class="text-sm font-semibold text-foreground">{field.label}</span>
                  <span class="text-xs font-mono text-muted-foreground">({field.name})</span>
                </div>
                {#if field.description}
                  <p class="text-xs text-muted-foreground">{field.description}</p>
                {/if}
              </div>

              <div class="flex items-center gap-3">
                <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                  {field.fieldType}
                </span>
                <button
                  type="button"
                  onclick={() => handleDeleteField(field.id, field.name)}
                  class="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                  title="Remove Field"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Enum Details & Options Management (Pure Categorical Strings) -->
            {#if field.fieldType === 'ENUM' && field.options}
              <div class="space-y-2 pt-2 border-t border-border">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-primary font-medium">Enum Categorical Options:</span>
                  <span class="text-[10px] text-muted-foreground font-mono">{field.options.length} options</span>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  {#each field.options as opt, optIdx}
                    {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-border text-[11px] text-foreground">
                      <span>{optLabel}</span>
                      <button
                        type="button"
                        onclick={() => handleRemoveOptionFromExistingField(field.id, optIdx)}
                        class="text-muted-foreground hover:text-destructive transition ml-0.5 cursor-pointer"
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
              <div class="space-y-2 pt-2 border-t border-border">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-primary font-medium">Value Type Options & Formula Power Values:</span>
                  <span class="text-[10px] text-muted-foreground font-mono">{field.options.length} options defined</span>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  {#each field.options as opt, optIdx}
                    {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                    {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-border text-[11px] text-foreground">
                      <span>{optLabel}</span>
                      {#if optPower !== undefined}
                        <span class="px-1 py-0.2 rounded bg-primary/20 text-primary font-mono text-[10px]">
                          Power: {optPower}
                        </span>
                      {/if}
                      <button
                        type="button"
                        onclick={() => handleRemoveOptionFromExistingField(field.id, optIdx)}
                        class="text-muted-foreground hover:text-destructive transition ml-0.5 cursor-pointer"
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

            <!-- Blueprint Ref & Array Ref Details -->
            {#if field.fieldType === 'BLUEPRINT_REF' || field.fieldType === 'ARRAY_REF'}
              <div class="flex items-center gap-2 text-xs pt-1 text-cyan-500 font-medium">
                <Link2 class="w-3.5 h-3.5" />
                <span>{field.fieldType === 'ARRAY_REF' ? 'Multi-Referenced Blueprint' : 'Referenced Blueprint'}: {field.targetBlueprintName || field.targetBlueprintId}</span>
              </div>
            {/if}

            {#if field.fieldType === 'ARRAY'}
              <div class="flex items-center gap-2 text-xs pt-1 text-indigo-500 font-medium">
                <ListFilter class="w-3.5 h-3.5" />
                <span>Array / Tag List Container (e.g. Titles, Techniques)</span>
              </div>
            {/if}

            <!-- Formula Details & Live Evaluation preview -->
            {#if field.fieldType === 'FORMULA' && field.formulaExpression}
              {@const evalRes = evaluateFormula(field.formulaExpression, testSandboxContext)}
              <div class="p-3 bg-card rounded border border-amber-500/30 space-y-2 mt-2">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono">
                    <Calculator class="w-3.5 h-3.5" />
                    <span>Formula: {field.formulaExpression}</span>
                  </div>
                  {#if evalRes.success}
                    <div class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      <span>Evaluated Result: {evalRes.formattedValue}</span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
        {/if}
      </div>
    </Card>

    <!-- Danger Zone -->
    <Card class="border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between">
      <div>
        <h4 class="text-xs font-bold text-destructive uppercase tracking-wider">Delete Blueprint</h4>
        <p class="text-xs text-muted-foreground mt-0.5">
          Permanently remove this blueprint from the world schema registry.
        </p>
      </div>
      <Button variant="outline" size="sm" onclick={() => (deleteBpConfirmOpen = true)} class="text-destructive hover:bg-destructive/10 hover:border-destructive/30">
        <Trash2 class="w-3.5 h-3.5" />
        <span>Delete Blueprint</span>
      </Button>
    </Card>
  </div>
{/if}

<!-- Confirmation Dialogs -->
<ConfirmDialog
  open={fieldToDelete !== null}
  title="Delete Dynamic Field"
  description={`Are you sure you want to remove the field "${fieldToDelete?.name}"? Any entity instances relying on this field schema may lose data.`}
  confirmText="Delete Field"
  variant="destructive"
  onConfirm={confirmDeleteField}
  onCancel={() => (fieldToDelete = null)}
/>

<ConfirmDialog
  open={deleteBpConfirmOpen}
  title="Delete Blueprint Schema"
  description={`Are you sure you want to permanently delete "${blueprint?.name}"? All associated instances will lose their schema validation.`}
  confirmText="Delete Blueprint"
  variant="destructive"
  onConfirm={confirmDeleteBlueprint}
  onCancel={() => (deleteBpConfirmOpen = false)}
/>

