<script lang="ts">
  import { page } from '$app/state';
  import { Users, LayoutTemplate, Clock, ShieldCheck, AlertOctagon } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/world/entities', label: 'Entities', icon: Users },
    { href: '/world/schemas', label: 'Blueprints & Schemas', icon: LayoutTemplate },
    { href: '/world/timeline', label: 'Causal Timeline', icon: Clock },
    { href: '/world/rules', label: 'Invariant Rules', icon: ShieldCheck },
    { href: '/world/audit', label: 'Continuity Audit', icon: AlertOctagon },
  ];

  const currentSection = $derived(
    navItems.find((item) => page.url.pathname.startsWith(item.href))?.label || 'Overview'
  );
</script>

<div class="flex-1 flex flex-col bg-background text-foreground transition-colors">
  <!-- World Studio Sub-Header with Breadcrumb -->
  <div class="border-b border-border bg-card/70 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 backdrop-blur min-w-0">
    <div class="flex items-center gap-3 min-w-0">
      <Breadcrumb
        items={[
          { label: 'World Studio', href: '/world' },
          { label: currentSection },
        ]}
      />
    </div>

    <!-- Sub-Navigation Action Buttons -->
    <nav class="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {#each navItems as item}
        {@const Icon = item.icon}
        {@const isActive = page.url.pathname.startsWith(item.href)}
        <a
          href={item.href}
          class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] shrink-0 {isActive ? 'bg-secondary text-secondary-foreground border border-border shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        >
          <Icon class="w-3.5 h-3.5 {isActive ? 'text-red-400' : 'text-muted-foreground'} shrink-0" />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
  </div>

  <!-- Workbench Content -->
  <div class="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
    {@render children()}
  </div>
</div>
