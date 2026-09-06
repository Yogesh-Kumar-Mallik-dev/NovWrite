<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Plus, Trash2, LayoutTemplate } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore, type DynamicPropertyDefItem } from '$lib/stores/worldStore.svelte';

  let name = $state('');
  let category = $state<'CHARACTER' | 'LOCATION' | 'ARTIFACT' | 'FACTION' | 'WEAPON' | 'TECHNIQUE'>('CHARACTER');
  let description = $state('');
  let properties = $state<Array<{ name: string; propertyType: string; defaultValue: string }>>([
    { name: 'rank', propertyType: 'STRING', defaultValue: 'Novice' },
  ]);

  const categoryOptions = [
    { value: 'CHARACTER', label: 'Character / Cultivator' },
    { value: 'LOCATION', label: 'Location / Domain' },
    { value: 'ARTIFACT', label: 'Artifact / Relic' },
    { value: 'FACTION', label: 'Faction / Sect' },
    { value: 'WEAPON', label: 'Weapon / Armament' },
    { value: 'TECHNIQUE', label: 'Technique / Spell' },
  ];

  const typeOptions = [
    { value: 'STRING', label: 'STRING' },
    { value: 'NUMBER', label: 'NUMBER' },
    { value: 'BOOLEAN', label: 'BOOLEAN' },
    { value: 'ENUM_SINGLE', label: 'ENUM_SINGLE' },
    { value: 'LADDER_TIER', label: 'LADDER_TIER' },
  ];

  function addPropertyRow() {
    properties.push({ name: '', propertyType: 'STRING', defaultValue: '' });
  }

  function removePropertyRow(index: number) {
    properties.splice(index, 1);
  }

  function handleCreateSchema() {
    if (!name.trim()) {
      alert('Schema name is required.');
      return;
    }

    const validProps: DynamicPropertyDefItem[] = properties
      .filter((p) => p.name.trim() !== '')
      .map((p, idx) => ({
        id: `prop-${Date.now()}-${idx}`,
        name: p.name.trim(),
        propertyType: p.propertyType as any,
        defaultValue: p.defaultValue,
      }));

    worldStore.addSchema({
      name: name.trim(),
      category,
      description: description.trim(),
      properties: validProps,
    });

    goto('/world/schemas');
  }
</script>

<div class="max-w-3xl mx-auto space-y-6">
  <!-- Breadcrumb -->
  <Breadcrumb
    items={[
      { label: 'World Studio', href: '/world' },
      { label: 'Entity Schemas', href: '/world/schemas' },
      { label: 'Define New Schema' },
    ]}
  />

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-zinc-100">Define Entity Type Schema</h2>
      <p class="text-xs text-zinc-400 mt-1">
        Create a custom schema blueprint with attached dynamic property definitions.
      </p>
    </div>
    <a href="/world/schemas">
      <Button variant="outline" size="sm">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Schemas</span>
      </Button>
    </a>
  </div>

  <!-- Form -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
    <div class="space-y-4">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Blueprint Overview</h3>

      <div>
        <label for="schema-name" class="block text-xs font-medium text-zinc-400 mb-1">Schema / Type Name (Required)</label>
        <Input id="schema-name" bind:value={name} placeholder="e.g. Spirit Beast, Sovereign Technique, Sacred Array..." />
      </div>

      <div>
        <label for="schema-category" class="block text-xs font-medium text-zinc-400 mb-1">Entity Category</label>
        <Select id="schema-category" options={categoryOptions} bind:value={category} />
      </div>

      <div>
        <label for="schema-desc" class="block text-xs font-medium text-zinc-400 mb-1">Description</label>
        <textarea
          id="schema-desc"
          bind:value={description}
          rows={3}
          placeholder="Purpose and characteristics of entities belonging to this schema..."
          class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
        ></textarea>
      </div>
    </div>

    <!-- Attached Dynamic Properties Builder -->
    <div class="space-y-4 pt-4 border-t border-zinc-800">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Dynamic Property Definitions</h3>
        <Button size="sm" variant="outline" onclick={addPropertyRow}>
          <Plus class="w-3.5 h-3.5" />
          <span>Add Property</span>
        </Button>
      </div>

      <div class="space-y-2.5">
        {#each properties as prop, idx}
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-zinc-950 p-3 rounded border border-zinc-800">
            <div class="sm:col-span-5">
              <label for={`prop-name-${idx}`} class="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Property Key</label>
              <Input id={`prop-name-${idx}`} bind:value={prop.name} placeholder="e.g. affinity, power_level" class="h-8 text-xs font-mono" />
            </div>

            <div class="sm:col-span-3">
              <label for={`prop-type-${idx}`} class="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Type</label>
              <Select id={`prop-type-${idx}`} options={typeOptions} bind:value={prop.propertyType} class="h-8 text-xs" />
            </div>

            <div class="sm:col-span-3">
              <label for={`prop-def-${idx}`} class="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Default</label>
              <Input id={`prop-def-${idx}`} bind:value={prop.defaultValue} placeholder="Default val" class="h-8 text-xs" />
            </div>

            <div class="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
              <Button
                variant="ghost"
                size="sm"
                onclick={() => removePropertyRow(idx)}
                disabled={properties.length <= 1}
                class="h-8 px-2 text-zinc-500 hover:text-red-400"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Actions -->
    <div class="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3">
      <a href="/world/schemas">
        <Button variant="outline" size="sm">Cancel</Button>
      </a>
      <Button size="sm" onclick={handleCreateSchema}>
        <Check class="w-3.5 h-3.5" />
        <span>Save Schema Blueprint</span>
      </Button>
    </div>
  </div>
</div>
