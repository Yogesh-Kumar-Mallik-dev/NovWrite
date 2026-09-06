<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Plus, Trash2, Layers, Heart, TrendingUp } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import Field from '$lib/components/ui/field.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore, type DynamicFieldDef } from '$lib/stores/worldStore.svelte';

  let name = $state('');
  let systemType = $state<'AFFINITY' | 'LADDER' | 'MATRIX'>('AFFINITY');
  let category = $state('Systems & Affection');
  let description = $state('');
  let stages = $state<string[]>(['Mortal', 'Adept', 'Grandmaster', 'Ascendant']);
  let newStageDraft = $state('');
  let minVal = $state(-100);
  let maxVal = $state(1000);
  let metricUnit = $state('pts');

  function addStage() {
    if (newStageDraft.trim()) {
      stages.push(newStageDraft.trim());
      newStageDraft = '';
    }
  }

  function removeStage(idx: number) {
    stages.splice(idx, 1);
  }

  function handleCreateSystem() {
    if (!name.trim()) {
      alert('System name is required.');
      return;
    }

    const fields: DynamicFieldDef[] = [];

    if (systemType === 'AFFINITY') {
      fields.push(
        {
          id: `f-stage-${Date.now()}`,
          name: 'relationship_stage',
          label: 'Relationship Stage',
          fieldType: 'ENUM',
          options: ['Stranger', 'Acquaintance', 'Friend', 'Confidant', 'Romantic Interest', 'Soulmate', 'Nemesis'],
          defaultValue: 'Acquaintance',
        },
        {
          id: `f-aff-${Date.now()}`,
          name: 'affection_level',
          label: 'Affection Points',
          fieldType: 'NUMBER',
          min: minVal,
          max: maxVal,
          unit: metricUnit,
          defaultValue: 0,
        },
        {
          id: `f-trust-${Date.now()}`,
          name: 'trust_score',
          label: 'Trust Score',
          fieldType: 'NUMBER',
          min: 0,
          max: 100,
          unit: '%',
          defaultValue: 50,
        },
        {
          id: `f-buff-${Date.now()}`,
          name: 'bond_buff_multiplier',
          label: 'Bond Buff Multiplier',
          fieldType: 'FORMULA',
          formulaExpression: `1 + (affection_level / ${maxVal || 1000}) * 0.5`,
        }
      );
    } else if (systemType === 'LADDER') {
      fields.push(
        {
          id: `f-realm-${Date.now()}`,
          name: 'realm_name',
          label: 'Realm Name',
          fieldType: 'ENUM',
          options: stages.length > 0 ? [...stages] : ['Stage 1', 'Stage 2'],
          defaultValue: stages[0] || 'Stage 1',
        },
        {
          id: `f-major-${Date.now()}`,
          name: 'major_realm',
          label: 'Major Realm Tier',
          fieldType: 'NUMBER',
          min: 1,
          max: stages.length || 9,
          unit: 'Tier',
          defaultValue: 1,
        },
        {
          id: `f-minor-${Date.now()}`,
          name: 'minor_realm',
          label: 'Minor Sub-Realm Grade',
          fieldType: 'NUMBER',
          min: 1,
          max: 9,
          unit: 'Stage',
          defaultValue: 1,
        }
      );
    } else {
      fields.push(
        {
          id: `f-score-${Date.now()}`,
          name: 'metric_score',
          label: 'Metric Score',
          fieldType: 'NUMBER',
          min: minVal,
          max: maxVal,
          unit: metricUnit,
          defaultValue: 0,
        }
      );
    }

    worldStore.addBlueprint({
      name: name.trim(),
      blueprintClass: 'SECOND_CLASS',
      category: category.trim() || 'Systems',
      description: description.trim(),
      fields,
    });

    goto('/world/systems');
  }
</script>

<div class="max-w-3xl mx-auto space-y-6 pb-16">
  <!-- Breadcrumb -->
  <Breadcrumb
    items={[
      { label: 'World Studio', href: '/world' },
      { label: 'Custom Properties & Systems', href: '/world/systems' },
      { label: 'Define New 2nd-Class System' },
    ]}
  />

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Layers class="w-5 h-5 text-cyan-400" />
        <span>Define 2nd-Class Sub-Blueprint & System</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-1">
        Configure reusable multi-tier progression ladders or continuous relationship/affection measurement gauges.
      </p>
    </div>
    <a href="/world/systems">
      <Button variant="outline" size="sm">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Systems</span>
      </Button>
    </a>
  </div>

  <!-- Form -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
    <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">System Archetype Configuration</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field id="system-name" label="System / Scale Name" required>
        <Input id="system-name" bind:value={name} placeholder="e.g. Soul Resonance Scale, Martial Stages..." class="w-full text-xs" />
      </Field>

      <Field id="system-type" label="System Category">
        <Select
          id="system-type"
          bind:value={systemType}
          options={[
            { value: 'AFFINITY', label: 'Interpersonal / Romantic Affection Scale' },
            { value: 'LADDER', label: 'Multi-Stage Progression Ladder (Realms)' },
            { value: 'MATRIX', label: 'Continuous Numeric Alignment / Gauge' },
          ]}
        />
      </Field>
    </div>

    <Field id="system-cat" label="Category Tag">
      <Input id="system-cat" bind:value={category} placeholder="e.g. Systems & Affection, Power Systems" class="w-full text-xs" />
    </Field>

    <Field id="system-desc" label="Description & Lore Mechanics">
      <Textarea
        id="system-desc"
        bind:value={description}
        rows={2}
        placeholder="Lore description of how this system measures entity progression or interpersonal dynamics..."
        class="w-full text-xs"
      />
    </Field>

    {#if systemType === 'LADDER'}
      <!-- Ladder Stages Editor -->
      <div class="p-4 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-3">
        <span class="text-xs font-semibold text-zinc-200 block">Progression Stages</span>
        <div class="flex flex-wrap gap-2">
          {#each stages as stage, sIdx}
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-200">
              <span class="text-cyan-400 font-bold">{sIdx + 1}.</span> {stage}
              <button type="button" onclick={() => removeStage(sIdx)} class="text-zinc-400 hover:text-red-400 ml-1">
                &times;
              </button>
            </span>
          {/each}
        </div>
        <div class="flex items-center gap-2 max-w-sm">
          <Input
            bind:value={newStageDraft}
            placeholder="Type new realm/stage and click Add"
            class="text-xs"
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addStage();
              }
            }}
          />
          <Button variant="secondary" size="sm" onclick={addStage}>Add</Button>
        </div>
      </div>
    {:else}
      <!-- Scale Range bounds -->
      <div class="grid grid-cols-3 gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-950/60">
        <Field id="min-val" label="Min Value">
          <Input id="min-val" type="number" bind:value={minVal} class="text-xs" />
        </Field>
        <Field id="max-val" label="Max Value">
          <Input id="max-val" type="number" bind:value={maxVal} class="text-xs" />
        </Field>
        <Field id="unit-val" label="Metric Unit">
          <Input id="unit-val" bind:value={metricUnit} class="text-xs" />
        </Field>
      </div>
    {/if}
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
    <a href="/world/systems">
      <Button variant="outline" size="sm">Cancel</Button>
    </a>
    <Button variant="default" size="sm" onclick={handleCreateSystem}>
      <Check class="w-3.5 h-3.5" />
      <span>Create 2nd-Class System</span>
    </Button>
  </div>
</div>
