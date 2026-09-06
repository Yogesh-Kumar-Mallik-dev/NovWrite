<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Plus, Shield } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let name = $state('');
  let description = $state('');
  let selectedSchemaId = $state('schema-character');
  let dynamicValues = $state<Record<string, any>>({
    status: 'ALIVE',
    cultivation_realm: 'Foundation',
    mana_capacity: 500,
    faction: 'Neutral Sect',
  });

  const schemaOptions = $derived(
    worldStore.schemas.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.category})`,
    }))
  );

  const activeSchema = $derived(
    worldStore.getSchema(selectedSchemaId) || worldStore.schemas[0]
  );

  function handleSchemaChange(schemaId: string) {
    selectedSchemaId = schemaId;
    const schema = worldStore.getSchema(schemaId);
    if (schema) {
      const initialProps: Record<string, any> = {};
      for (const prop of schema.properties) {
        initialProps[prop.name] = prop.defaultValue ?? '';
      }
      dynamicValues = initialProps;
    }
  }

  function handleCreateEntity() {
    if (!name.trim()) {
      alert('Entity name is required.');
      return;
    }

    worldStore.addEntity({
      name: name.trim(),
      entityTypeId: selectedSchemaId,
      category: activeSchema.category,
      description: description.trim(),
      properties: { ...dynamicValues },
    });

    goto('/world/entities');
  }
</script>

<div class="max-w-3xl mx-auto space-y-6">
  <!-- Breadcrumb Navigation -->
  <Breadcrumb
    items={[
      { label: 'World Studio', href: '/world' },
      { label: 'Entities', href: '/world/entities' },
      { label: 'Create New Entity' },
    ]}
  />

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-zinc-100">Create Universe Entity</h2>
      <p class="text-xs text-zinc-400 mt-1">
        Instantiate a new character, location, or artifact adhering to its schema definition.
      </p>
    </div>
    <a href="/world/entities">
      <Button variant="outline" size="sm">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Entities</span>
      </Button>
    </a>
  </div>

  <!-- Form Container -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
    <!-- Schema Type Selection -->
    <div>
      <label for="schema-select" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
        Entity Type Definition (Schema)
      </label>
      <Select
        id="schema-select"
        options={schemaOptions}
        bind:value={selectedSchemaId}
        onchange={handleSchemaChange}
      />
      <p class="text-[11px] text-zinc-400 mt-1.5">{activeSchema.description}</p>
    </div>

    <!-- Base Identity -->
    <div class="space-y-4 pt-4 border-t border-zinc-800">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Base Identity</h3>
      
      <div>
        <label for="entity-name" class="block text-xs font-medium text-zinc-400 mb-1">Entity Name (Required)</label>
        <Input id="entity-name" bind:value={name} placeholder="e.g. Master Zhang, Astral Citadel..." />
      </div>

      <div>
        <label for="entity-desc" class="block text-xs font-medium text-zinc-400 mb-1">Lore Description</label>
        <textarea
          id="entity-desc"
          bind:value={description}
          rows={3}
          placeholder="Brief background lore, significance, or role in the narrative..."
          class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
        ></textarea>
      </div>
    </div>

    <!-- Dynamic Property Values from Schema -->
    <div class="space-y-4 pt-4 border-t border-zinc-800">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Schema-Defined Properties</h3>
        <span class="text-[11px] text-zinc-400 font-mono">{activeSchema.properties.length} dynamic fields</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {#each activeSchema.properties as prop}
          <div>
            <label for={`prop-${prop.name}`} class="block text-xs font-medium text-zinc-400 mb-1">
              {prop.name}
              <span class="text-zinc-500 font-mono text-[10px]">({prop.propertyType})</span>
            </label>

            {#if prop.propertyType === 'ENUM_SINGLE' && prop.validation?.allowedValues}
              <Select
                id={`prop-${prop.name}`}
                options={prop.validation.allowedValues.map((v: string) => ({ value: v, label: v }))}
                bind:value={dynamicValues[prop.name]}
              />
            {:else if prop.propertyType === 'NUMBER'}
              <Input
                id={`prop-${prop.name}`}
                type="number"
                bind:value={dynamicValues[prop.name]}
                class="font-mono text-xs"
              />
            {:else}
              <Input
                id={`prop-${prop.name}`}
                bind:value={dynamicValues[prop.name]}
                class="text-xs"
              />
            {/if}

            {#if prop.description}
              <p class="text-[10px] text-zinc-400 mt-1">{prop.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Actions -->
    <div class="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3">
      <a href="/world/entities">
        <Button variant="outline" size="sm">Cancel</Button>
      </a>
      <Button size="sm" onclick={handleCreateEntity}>
        <Check class="w-3.5 h-3.5" />
        <span>Save Entity</span>
      </Button>
    </div>
  </div>
</div>
