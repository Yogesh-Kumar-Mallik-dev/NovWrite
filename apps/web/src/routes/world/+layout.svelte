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
    BookOpen,
    FolderPlus,
  } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { projectStore } from '$lib/stores/projectStore.svelte';

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
    {#if projectStore.isLoaded && !projectStore.activeProject}
      <div class="max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-xl border border-dashed border-border bg-card/50 text-center space-y-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <BookOpen class="w-6 h-6" />
        </div>
        <div class="space-y-1.5">
          <h2 class="text-lg sm:text-xl font-semibold tracking-tight">No Active Project Selected</h2>
          <p class="text-xs sm:text-sm text-muted-foreground">
            World Studio blueprints, entities, and timelines belong strictly to a creative novel project. Create a new project or select an existing one to begin building your world.
          </p>
        </div>
        <div class="pt-2">
          <button
            type="button"
            onclick={() => projectStore.openCreateDialog()}
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs sm:text-sm shadow-sm hover:opacity-90 transition-all min-h-[40px] cursor-pointer"
          >
            <FolderPlus class="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>
    {:else}
      {@render children()}
    {/if}
  </div>
</div>
