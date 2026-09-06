<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Trash2, User, MapPin, Sparkles, Shield, Clock } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  const entityId = $derived(page.params.id);
  const entity = $derived(worldStore.getEntity(entityId));
  const schema = $derived(entity ? worldStore.getSchema(entity.entityTypeId) : undefined);

  let name = $state('');
  let description = $state('');
  let dynamicValues = $state<Record<string, any>>({});
  let saveMessage = $state<string | null>(null);

  $effect(() => {
    if (entity) {
      name = entity.name;
      description = entity.description || '';
      dynamicValues = { ...entity.properties };
    }
  });

  function handleSave() {
    if (!entity || !name.trim()) return;

    worldStore.updateEntity(entity.id, {
      name: name.trim(),
      description: description.trim(),
      properties: { ...dynamicValues },
    });

    saveMessage = 'Entity properties successfully updated and saved!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleDelete() {
    if (!entity) return;
    if (confirm(`Are you sure you want to permanently delete "${entity.name}"?`)) {
      worldStore.deleteEntity(entity.id);
      goto('/world/entities');
    }
  }
</script>

{#if !entity}
  <div class="max-w-3xl mx-auto space-y-6">
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Entities', href: '/world/entities' },
        { label: 'Entity Not Found' },
      ]}
    />
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center space-y-3">
      <Shield class="w-8 h-8 text-zinc-600 mx-auto" />
      <h2 class="text-base font-bold text-zinc-300">Entity Not Found</h2>
      <p class="text-xs text-zinc-500 max-w-sm mx-auto">
        The requested entity with ID <code class="font-mono text-purple-400">{entityId}</code> could not be located.
      </p>
      <a href="/world/entities">
        <Button size="sm" variant="outline">Return to Entities List</Button>
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Breadcrumb -->
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Entities', href: '/world/entities' },
        { label: entity.name },
      ]}
    />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          {#if entity.category === 'CHARACTER'}
            <User class="w-5 h-5 text-purple-400" />
          {:else if entity.category === 'LOCATION'}
            <MapPin class="w-5 h-5 text-emerald-400" />
          {:else}
            <Sparkles class="w-5 h-5 text-amber-400" />
          {/if}
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight text-zinc-100">{entity.name}</h2>
          <div class="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-0.5">
            <span>Category: <strong>{entity.category}</strong></span>
            <span>·</span>
            <span>Last Mutated: <strong>Seq #{entity.lastMutatedSeqNumber}</strong></span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a href="/world/entities">
          <Button variant="outline" size="sm">
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Entities List</span>
          </Button>
        </a>
        <Button variant="destructive" size="sm" onclick={handleDelete}>
          <Trash2 class="w-3.5 h-3.5" />
          <span>Delete</span>
        </Button>
      </div>
    </div>

    {#if saveMessage}
      <div class="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-medium">
        <Check class="w-4 h-4" />
        {saveMessage}
      </div>
    {/if}

    <!-- Edit Form Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <!-- Main Form (2 cols) -->
      <div class="md:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
        <div class="space-y-4">
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Entity Details</h3>

          <div>
            <label for="entity-name-input" class="block text-xs font-medium text-zinc-400 mb-1">Name</label>
            <Input id="entity-name-input" bind:value={name} class="text-xs" />
          </div>

          <div>
            <label for="entity-desc-input" class="block text-xs font-medium text-zinc-400 mb-1">Description</label>
            <textarea
              id="entity-desc-input"
              bind:value={description}
              rows={3}
              class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            ></textarea>
          </div>
        </div>

        <!-- Dynamic Properties Form -->
        {#if schema}
          <div class="space-y-4 pt-4 border-t border-zinc-800">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Dynamic Property Values</h3>
              <span class="text-[11px] text-zinc-400 font-mono">Schema: {schema.name}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {#each schema.properties as prop}
                <div>
                  <label for={`edit-prop-${prop.name}`} class="block text-xs font-medium text-zinc-400 mb-1">
                    {prop.name}
                    <span class="text-zinc-500 font-mono text-[10px]">({prop.propertyType})</span>
                  </label>

                  {#if prop.propertyType === 'ENUM_SINGLE' && prop.validation?.allowedValues}
                    <Select
                      id={`edit-prop-${prop.name}`}
                      options={prop.validation.allowedValues.map((v: string) => ({ value: v, label: v }))}
                      bind:value={dynamicValues[prop.name]}
                    />
                  {:else if prop.propertyType === 'NUMBER'}
                    <Input
                      id={`edit-prop-${prop.name}`}
                      type="number"
                      bind:value={dynamicValues[prop.name]}
                      class="font-mono text-xs"
                    />
                  {:else}
                    <Input
                      id={`edit-prop-${prop.name}`}
                      bind:value={dynamicValues[prop.name]}
                      class="text-xs"
                    />
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="pt-4 border-t border-zinc-800 flex justify-end">
          <Button size="sm" onclick={handleSave}>
            <Check class="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      <!-- Side Metadata Card -->
      <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4 text-xs font-mono">
        <h4 class="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">System Metadata</h4>
        
        <div class="space-y-2.5 text-zinc-400">
          <div>
            <span class="text-zinc-500 block text-[10px]">ENTITY UUID</span>
            <span class="text-zinc-200 break-all">{entity.id}</span>
          </div>

          <div>
            <span class="text-zinc-500 block text-[10px]">SCHEMA BINDING</span>
            <span class="text-zinc-200">{schema?.name || entity.entityTypeId}</span>
          </div>

          <div>
            <span class="text-zinc-500 block text-[10px]">LAST TIMELINE MUTATION</span>
            <span class="text-purple-400 font-bold">Sequence #{entity.lastMutatedSeqNumber}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
