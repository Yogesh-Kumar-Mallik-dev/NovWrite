<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Plus, Trash2, Layers, Shield, Edit3 } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  const systemId = $derived(page.params.id);
  const system = $derived(worldStore.getBlueprint(systemId));

  let name = $state('');
  let description = $state('');
  let category = $state('');
  let saveMessage = $state<string | null>(null);

  $effect(() => {
    if (system) {
      name = system.name;
      description = system.description || '';
      category = system.category;
    }
  });

  function handleSave() {
    if (!system || !name.trim()) return;

    worldStore.updateBlueprint(system.id, {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
    });

    saveMessage = '2nd-Class sub-blueprint successfully updated!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleDelete() {
    if (!system) return;
    if (confirm(`Are you sure you want to permanently delete "${system.name}"?`)) {
      worldStore.deleteBlueprint(system.id);
      goto('/world/systems');
    }
  }
</script>

{#if !system}
  <div class="max-w-3xl mx-auto space-y-6">
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Custom Properties & Systems', href: '/world/systems' },
        { label: 'System Not Found' },
      ]}
    />
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center space-y-3">
      <Shield class="w-8 h-8 text-zinc-600 mx-auto" />
      <h2 class="text-base font-bold text-zinc-300">System Not Found</h2>
      <a href="/world/systems">
        <Button variant="outline" size="sm">Return to Systems</Button>
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-3xl mx-auto space-y-6 pb-16">
    <!-- Breadcrumb -->
    <Breadcrumb
      items={[
        { label: 'World Studio', href: '/world' },
        { label: 'Custom Properties & Systems', href: '/world/systems' },
        { label: system.name },
      ]}
    />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div>
        <div class="flex items-center gap-2">
          <Layers class="w-5 h-5 text-cyan-400" />
          <h2 class="text-xl font-bold tracking-tight text-zinc-100">{system.name}</h2>
        </div>
        <p class="text-xs text-zinc-400 mt-0.5">
          2nd-Class Sub-Blueprint · Category: <span class="font-mono text-cyan-400">{system.category}</span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <a href={`/world/schemas/${system.id}`}>
          <Button variant="secondary" size="sm">
            <Edit3 class="w-3.5 h-3.5" />
            <span>Open Advanced Field Editor</span>
          </Button>
        </a>
        <a href="/world/systems">
          <Button variant="outline" size="sm">
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Back to Systems</span>
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

    <!-- Specification Form -->
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Sub-Blueprint Identity</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="sys-name" class="block text-xs font-medium text-zinc-400 mb-1">Name</label>
          <Input id="sys-name" bind:value={name} class="w-full text-xs" />
        </div>
        <div>
          <label for="sys-cat" class="block text-xs font-medium text-zinc-400 mb-1">Category</label>
          <Input id="sys-cat" bind:value={category} class="w-full text-xs" />
        </div>
      </div>

      <div>
        <label for="sys-desc" class="block text-xs font-medium text-zinc-400 mb-1">Description & Lore Mechanics</label>
        <textarea
          id="sys-desc"
          bind:value={description}
          rows={3}
          class="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        ></textarea>
      </div>

      <!-- Attributes list -->
      <div class="pt-3 border-t border-zinc-800 space-y-2">
        <span class="text-xs font-semibold text-zinc-300 block">Defined Dynamic Attributes ({system.fields.length}):</span>
        <div class="flex flex-wrap gap-2">
          {#each system.fields as field}
            <span class="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
              {field.label} ({field.fieldType})
            </span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-zinc-800">
      <Button variant="outline" size="sm" onclick={handleDelete} class="text-red-400 hover:bg-red-950/50">
        <Trash2 class="w-3.5 h-3.5" />
        <span>Delete Sub-Blueprint</span>
      </Button>

      <Button variant="default" size="sm" onclick={handleSave}>
        <Check class="w-3.5 h-3.5" />
        <span>Save Changes</span>
      </Button>
    </div>
  </div>
{/if}
