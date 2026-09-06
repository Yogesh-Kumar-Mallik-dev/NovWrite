<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Plus, Trash2, Sliders, Shield, TrendingUp, HeartHandshake } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  const systemId = $derived(page.params.id);
  const system = $derived(worldStore.getSystem(systemId));

  let name = $state('');
  let description = $state('');
  let metricName = $state('');
  let stages = $state<string[]>([]);
  let minValue = $state<number>(0);
  let maxValue = $state<number>(100);
  let saveMessage = $state<string | null>(null);

  $effect(() => {
    if (system) {
      name = system.name;
      description = system.description || '';
      metricName = system.tiersOrScale.metricName || '';
      stages = [...(system.tiersOrScale.stages || [])];
      minValue = system.tiersOrScale.minValue ?? 0;
      maxValue = system.tiersOrScale.maxValue ?? 100;
    }
  });

  function addStage() {
    stages.push(`Stage ${stages.length + 1}`);
  }

  function removeStage(idx: number) {
    stages.splice(idx, 1);
  }

  function handleSave() {
    if (!system || !name.trim()) return;

    worldStore.updateSystem(system.id, {
      name: name.trim(),
      description: description.trim(),
      tiersOrScale: {
        stages: system.type === 'PROGRESSION_LADDER' ? stages.filter((s) => s.trim() !== '') : undefined,
        minValue: system.type === 'RELATIONSHIP_SCALE' ? Number(minValue) : undefined,
        maxValue: system.type === 'RELATIONSHIP_SCALE' ? Number(maxValue) : undefined,
        metricName: metricName.trim(),
      },
    });

    saveMessage = 'Custom progression system successfully updated!';
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }

  function handleDelete() {
    if (!system) return;
    if (confirm(`Are you sure you want to permanently delete "${system.name}"?`)) {
      worldStore.deleteSystem(system.id);
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
        <Button size="sm" variant="outline">Return to Systems List</Button>
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-4xl mx-auto space-y-6">
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
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          {#if system.type === 'PROGRESSION_LADDER'}
            <TrendingUp class="w-5 h-5 text-purple-400" />
          {:else}
            <HeartHandshake class="w-5 h-5 text-emerald-400" />
          {/if}
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight text-zinc-100">{system.name}</h2>
          <div class="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-0.5">
            <span>Type: <strong>{system.type.replace('_', ' ')}</strong></span>
            <span>·</span>
            <span>Metric: <strong>{metricName || 'Standard'}</strong></span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a href="/world/systems">
          <Button variant="outline" size="sm">
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Systems List</span>
          </Button>
        </a>
        <Button variant="destructive" size="sm" onclick={handleDelete}>
          <Trash2 class="w-3.5 h-3.5" />
          <span>Delete System</span>
        </Button>
      </div>
    </div>

    {#if saveMessage}
      <div class="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-medium">
        <Check class="w-4 h-4" />
        {saveMessage}
      </div>
    {/if}

    <!-- Form Container -->
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
      <div class="space-y-4">
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">System Configuration</h3>

        <div>
          <label for="system-name" class="block text-xs font-medium text-zinc-400 mb-1">System Name</label>
          <Input id="system-name" bind:value={name} class="text-xs" />
        </div>

        <div>
          <label for="system-metric" class="block text-xs font-medium text-zinc-400 mb-1">Metric Label</label>
          <Input id="system-metric" bind:value={metricName} class="text-xs font-mono" />
        </div>

        <div>
          <label for="system-desc" class="block text-xs font-medium text-zinc-400 mb-1">Description</label>
          <textarea
            id="system-desc"
            bind:value={description}
            rows={2}
            class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
          ></textarea>
        </div>
      </div>

      <!-- Stage Ladder or Bounds -->
      {#if system.type === 'PROGRESSION_LADDER'}
        <div class="space-y-4 pt-4 border-t border-zinc-800">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Advancement Stages ({stages.length})</h3>
            <Button size="sm" variant="outline" onclick={addStage}>
              <Plus class="w-3.5 h-3.5" />
              <span>Add Stage</span>
            </Button>
          </div>

          <div class="space-y-2">
            {#each stages as stage, idx}
              <div class="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                <span class="w-8 text-center text-xs font-mono font-bold text-purple-400">#{idx + 1}</span>
                <Input bind:value={stages[idx]} class="h-8 text-xs flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => removeStage(idx)}
                  disabled={stages.length <= 1}
                  class="h-8 px-2 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </Button>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="space-y-4 pt-4 border-t border-zinc-800">
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Numerical Gauge Bounds</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="scale-min" class="block text-xs font-medium text-zinc-400 mb-1">Minimum Value</label>
              <Input id="scale-min" type="number" bind:value={minValue} class="font-mono text-xs" />
            </div>
            <div>
              <label for="scale-max" class="block text-xs font-medium text-zinc-400 mb-1">Maximum Value</label>
              <Input id="scale-max" type="number" bind:value={maxValue} class="font-mono text-xs" />
            </div>
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
  </div>
{/if}
