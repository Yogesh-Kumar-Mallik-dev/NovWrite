<script lang="ts">
  import { page } from '$app/state';
  import { Users, LayoutTemplate, Sliders, Clock, ShieldCheck, AlertOctagon } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/world/entities', label: 'Entities', icon: Users },
    { href: '/world/schemas', label: 'Entity Schemas', icon: LayoutTemplate },
    { href: '/world/systems', label: 'Custom Properties & Systems', icon: Sliders },
    { href: '/world/timeline', label: 'Causal Timeline', icon: Clock },
    { href: '/world/rules', label: 'Invariant Rules', icon: ShieldCheck },
    { href: '/world/audit', label: 'Continuity Audit', icon: AlertOctagon },
  ];

  const currentSection = $derived(
    navItems.find((item) => page.url.pathname.startsWith(item.href))?.label || 'Overview'
  );
</script>

<div class="flex-1 flex flex-col bg-zinc-950 text-zinc-100">
  <!-- World Studio Sub-Header with Breadcrumb -->
  <div class="border-b border-zinc-800 bg-zinc-900/50 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <Breadcrumb
        items={[
          { label: 'World Studio', href: '/world' },
          { label: currentSection },
        ]}
      />
    </div>

    <!-- Sub-Navigation Action Buttons -->
    <nav class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 max-w-full">
      {#each navItems as item}
        {@const Icon = item.icon}
        {@const isActive = page.url.pathname.startsWith(item.href)}
        <a
          href={item.href}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] {isActive ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'}"
        >
          <Icon class="w-3.5 h-3.5 {isActive ? 'text-red-400' : 'text-zinc-500'}" />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
  </div>

  <!-- Workbench Content -->
  <div class="flex-1 p-4 md:p-6 overflow-y-auto">
    {@render children()}
  </div>
</div>
