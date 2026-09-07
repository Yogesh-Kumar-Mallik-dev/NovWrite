<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import {
    Users,
    LayoutTemplate,
    Clock,
    ShieldCheck,
    AlertOctagon,
    Home,
    Layers,
  } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import Select from '$lib/components/ui/select.svelte';

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

  const activeHref = $derived(
    navItems.find((item) => page.url.pathname.startsWith(item.href))?.href || '/world'
  );

  const selectOptions = [
    { value: '/world', label: 'Overview / Dashboard' },
    ...navItems.map((n) => ({ value: n.href, label: n.label })),
  ];

  function handleSectionChange(newHref: string) {
    if (newHref && newHref !== page.url.pathname) {
      goto(newHref);
    }
  }
</script>

<div class="flex-1 flex flex-col bg-background text-foreground transition-colors">
  <!-- World Studio Sub-Header with Breadcrumb & Mobile Navigation -->
  <div class="border-b border-border bg-card/70 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 backdrop-blur min-w-0">
    <!-- Breadcrumb -->
    <div class="flex items-center justify-between gap-3 min-w-0">
      <Breadcrumb
        items={[
          { label: 'World Studio', href: '/world' },
          { label: currentSection },
        ]}
      />

      <!-- Mobile Jump Selector (< 768px) -->
      <div class="md:hidden w-40 shrink-0">
        <Select
          options={selectOptions}
          value={activeHref}
          onchange={handleSectionChange}
          placeholder="Jump to..."
          class="h-8 text-xs"
        />
      </div>
    </div>

    <!-- Desktop Sub-Navigation Action Buttons (≥ 768px) -->
    <nav class="hidden md:flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {#each navItems as item}
        {@const Icon = item.icon}
        {@const isActive = page.url.pathname.startsWith(item.href)}
        <a
          href={item.href}
          class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] shrink-0 {isActive ? 'bg-secondary text-secondary-foreground border border-border shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        >
          <Icon class="w-3.5 h-3.5 {isActive ? 'text-primary' : 'text-muted-foreground'} shrink-0" />
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
