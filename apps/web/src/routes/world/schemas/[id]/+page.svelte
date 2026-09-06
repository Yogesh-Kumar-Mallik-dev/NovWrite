<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Plus, Trash2, LayoutTemplate, Shield, Layers } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore, type DynamicPropertyDefItem } from '$lib/stores/worldStore.svelte';

  const schemaId = $derived(page.params.id);
  const schema = $derived(worldStore.getSchema(schemaId));

  let name = $state('');
  let description = $state('');
  let category = $state<'CHARACTER' | 'LOCATION' | 'ARTIFACT' | 'FACTION' | 'WEAPON' | 'TECHNIQUE'>('CHARACTER');
  let newPropName = $state('');
  let newPropType = $state<'STRING' | 'NUMBER' | 'BOOLEAN' | 'ENUM_SINGLE' | 'LADDER_TIER'>('STRING');
  let newPropDefault = $state('');
  let saveMessage = $state<string | null>(null);

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

  $effect(() => {
    if (schema) {
      name = schema.name;
      description = schema.description || '';
      category = schema.category;
    }
  });

  function handleSaveSchema() {
    if (!schema || !name.trim()) return;

    worldStore.updateSchema(schema.id, {
      name: name.trim(),
      description: description.trim(),
      category,
    });

    saveMessage = 'Schema definition successfully updated!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleAddProperty() {
    if (!schema || !newPropName.trim()) return;

    worldStore.addPropertyToSchema(schema.id, {
      name: newPropName.trim(),
      propertyType: newPropType as any,
      defaultValue: newPropDefault,
    });

    newPropName = '';
    newPropDefault = '';
    saveMessage = 'New dynamic property attached to schema!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleDeleteSchema() {
    if (!schema) return;
    if (confirm(`Are you sure you want to delete schema "${schema.name}"?`)) {
      worldStore.deleteSchema(schema.id);
      goto('/world/schemas');
    }
  }
</script>

{#if !schema}
  <div class="max-w-3xl mx-auto space-y-6">
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Entity Schemas', href: '/world/schemas' },
        { label: 'Schema Not Found' },
      ]}
    />
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center space-y-3">
      <Shield class="w-8 h-8 text-zinc-600 mx-auto" />
      <h2 class="text-base font-bold text-zinc-300">Schema Not Found</h2>
      <a href="/world/schemas">
        <Button size="sm" variant="outline">Return to Schemas List</Button>
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Breadcrumb -->
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Entity Schemas', href: '/world/schemas' },
        { label: schema.name },
      ]}
    />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <LayoutTemplate class="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight text-zinc-100">{schema.name}</h2>
          <div class="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-0.5">
            <span>Category: <strong>{schema.category}</strong></span>
            <span>·</span>
            <span>Properties: <strong>{schema.properties.length} defined</strong></span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a href="/world/schemas">
          <Button variant="outline" size="sm">
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Schemas List</span>
          </Button>
        </a>
        <Button variant="destructive" size="sm" onclick={handleDeleteSchema}>
          <Trash2 class="w-3.5 h-3.5" />
          <span>Delete Schema</span>
        </Button>
      </div>
    </div>

    {#if saveMessage}
      <div class="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-medium">
        <Check class="w-4 h-4" />
        {saveMessage}
      </div>
    {/if}

    <!-- Edit Schema Form & Property Definitions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <!-- Main Blueprint (2 cols) -->
      <div class="md:col-span-2 space-y-6">
        <!-- Blueprint Settings -->
        <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Blueprint Configuration</h3>

          <div>
            <label for="schema-name" class="block text-xs font-medium text-zinc-400 mb-1">Schema Name</label>
            <Input id="schema-name" bind:value={name} class="text-xs" />
          </div>

          <div>
            <label for="schema-category" class="block text-xs font-medium text-zinc-400 mb-1">Category</label>
            <Select id="schema-category" options={categoryOptions} bind:value={category} />
          </div>

          <div>
            <label for="schema-desc" class="block text-xs font-medium text-zinc-400 mb-1">Description</label>
            <textarea
              id="schema-desc"
              bind:value={description}
              rows={2}
              class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            ></textarea>
          </div>

          <div class="flex justify-end pt-2">
            <Button size="sm" onclick={handleSaveSchema}>
              <Check class="w-3.5 h-3.5" />
              <span>Save Schema Info</span>
            </Button>
          </div>
        </div>

        <!-- Attached Properties Table -->
        <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Attached Dynamic Properties</h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-zinc-950 text-zinc-500 font-mono uppercase tracking-wider">
                <tr>
                  <th class="px-3 py-2">Property Name</th>
                  <th class="px-3 py-2">Type</th>
                  <th class="px-3 py-2">Default Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                {#each schema.properties as prop}
                  <tr>
                    <td class="px-3 py-2.5 font-mono text-zinc-200 font-semibold">{prop.name}</td>
                    <td class="px-3 py-2.5 font-mono text-purple-300">{prop.propertyType}</td>
                    <td class="px-3 py-2.5 font-mono text-zinc-400">{JSON.stringify(prop.defaultValue ?? '')}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add Property Sidebar -->
      <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        <h4 class="font-semibold text-zinc-200 uppercase tracking-wider text-xs">Attach New Property</h4>
        
        <div class="space-y-3 text-xs">
          <div>
            <label for="new-prop-name" class="block text-zinc-400 mb-1 font-medium">Property Key</label>
            <Input id="new-prop-name" bind:value={newPropName} placeholder="e.g. soul_affinity, weight" class="h-8 text-xs font-mono" />
          </div>

          <div>
            <label for="new-prop-type" class="block text-zinc-400 mb-1 font-medium">Data Type</label>
            <Select id="new-prop-type" options={typeOptions} bind:value={newPropType} />
          </div>

          <div>
            <label for="new-prop-def" class="block text-zinc-400 mb-1 font-medium">Default Value</label>
            <Input id="new-prop-def" bind:value={newPropDefault} placeholder="Default value..." class="h-8 text-xs" />
          </div>

          <div class="pt-2">
            <Button size="sm" class="w-full" onclick={handleAddProperty} disabled={!newPropName.trim()}>
              <Plus class="w-3.5 h-3.5" />
              <span>Attach Property</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
