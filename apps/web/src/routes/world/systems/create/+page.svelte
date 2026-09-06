<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, Check, Plus, Trash2, TrendingUp, HeartHandshake } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let name = $state('');
  let type = $state<'PROGRESSION_LADDER' | 'RELATIONSHIP_SCALE' | 'ALIGNMENT_MATRIX'>('PROGRESSION_LADDER');
  let description = $state('');
  let metricName = $state('Stage');
  let stages = $state<string[]>(['Mortal Apprentice', 'Adept', 'Grandmaster', 'Ascendant']);
  let minValue = $state<number>(-100);
  let maxValue = $state<number>(100);

  const typeOptions = [
    { value: 'PROGRESSION_LADDER', label: 'Power / Realm Progression Ladder' },
    { value: 'RELATIONSHIP_SCALE', label: 'Relationship / Affection Scale' },
    { value: 'ALIGNMENT_MATRIX', label: 'Moral / Faction Alignment Matrix' },
  ];

  function addStage() {
    stages.push(`Stage ${stages.length + 1}`);
  }

  function removeStage(idx: number) {
    stages.splice(idx, 1);
  }

  function handleCreateSystem() {
    if (!name.trim()) {
      alert('System name is required.');
      return;
    }

    worldStore.addSystem({
      name: name.trim(),
      type,
      description: description.trim(),
      tiersOrScale: {
        stages: type === 'PROGRESSION_LADDER' ? stages.filter((s) => s.trim() !== '') : undefined,
        minValue: type === 'RELATIONSHIP_SCALE' ? Number(minValue) : undefined,
        maxValue: type === 'RELATIONSHIP_SCALE' ? Number(maxValue) : undefined,
        metricName: metricName.trim(),
      },
    });

    goto('/world/systems');
  }
</script>

<div class="max-w-3xl mx-auto space-y-6">
  <!-- Breadcrumb -->
  <Breadcrumb
    items={[
      { label: 'World Studio', href: '/world' },
      { label: 'Custom Properties & Systems', href: '/world/systems' },
      { label: 'Define New System' },
    ]}
  />

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-zinc-100">Define Custom Progression System</h2>
      <p class="text-xs text-zinc-400 mt-1">
        Configure stage ladders or continuous relationship/affection measurement gauges.
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
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
    <div class="space-y-4">
      <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">System Specification</h3>

      <div>
        <label for="system-name" class="block text-xs font-medium text-zinc-400 mb-1">System / Scale Name (Required)</label>
        <Input id="system-name" bind:value={name} placeholder="e.g. Magic Circle Ranks, Trust Matrix, Soul Resonance..." />
      </div>

      <div>
        <label for="system-type" class="block text-xs font-medium text-zinc-400 mb-1">System Type</label>
        <Select id="system-type" options={typeOptions} bind:value={type} />
      </div>

      <div>
        <label for="system-metric" class="block text-xs font-medium text-zinc-400 mb-1">Metric Unit / Label</label>
        <Input id="system-metric" bind:value={metricName} placeholder="e.g. Realm, Affection Points, Rank..." />
      </div>

      <div>
        <label for="system-desc" class="block text-xs font-medium text-zinc-400 mb-1">Description</label>
        <textarea
          id="system-desc"
          bind:value={description}
          rows={2}
          placeholder="How this system governs character progression or character relationships..."
          class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
        ></textarea>
      </div>
    </div>

    <!-- Dynamic Stages Builder for Progression Ladder -->
    {#if type === 'PROGRESSION_LADDER'}
      <div class="space-y-4 pt-4 border-t border-zinc-800">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Advancement Stages (Ordered Ascending)</h3>
            <p class="text-[11px] text-zinc-500">Tier 1 is the entry stage, progressing sequentially upward.</p>
          </div>
          <Button size="sm" variant="outline" onclick={addStage}>
            <Plus class="w-3.5 h-3.5" />
            <span>Add Stage</span>
          </Button>
        </div>

        <div class="space-y-2">
          {#each stages as stage, idx}
            <div class="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
              <span class="w-8 text-center text-xs font-mono font-bold text-purple-400">#{idx + 1}</span>
              <Input bind:value={stages[idx]} placeholder="Stage Name..." class="h-8 text-xs flex-1" />
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
      <!-- Min / Max Gauge for Relationship Scales -->
      <div class="space-y-4 pt-4 border-t border-zinc-800">
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Gauge Numerical Bounds</h3>
        
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

    <!-- Actions -->
    <div class="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3">
      <a href="/world/systems">
        <Button variant="outline" size="sm">Cancel</Button>
      </a>
      <Button size="sm" onclick={handleCreateSystem}>
        <Check class="w-3.5 h-3.5" />
        <span>Save Custom System</span>
      </Button>
    </div>
  </div>
</div>
