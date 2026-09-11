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
    BookOpen,
    FolderPlus,
  } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { projectStore } from '$lib/stores/projectStore.svelte';
  import { worldStore } from '$lib/stores/worldStore.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/world', label: 'Overview / Dashboard', shortLabel: 'Overview', icon: Home, exact: true },
    { href: '/world/entities', label: 'Universe Entities', shortLabel: 'Entities', icon: Users },
    { href: '/world/schemas', label: 'Blueprints & Schemas', shortLabel: 'Blueprints & Schemas', icon: LayoutTemplate },
    { href: '/world/timeline', label: 'Causal Timeline', shortLabel: 'Causal Timeline', icon: Clock },
    { href: '/world/rules', label: 'Invariant Rules', shortLabel: 'Invariant Rules', icon: ShieldCheck },
    { href: '/world/audit', label: 'Continuity Audit', shortLabel: 'Continuity Audit', icon: AlertOctagon },
  ];

  const currentItem = $derived.by(() => {
    // Exact match first
    const exact = navItems.find((item) => item.exact && page.url.pathname === item.href);
    if (exact) return exact;

    // Sub-route match
    const match = navItems.find((item) => !item.exact && page.url.pathname.startsWith(item.href));
    return match || navItems[0];
  });

  const CurrentIcon = $derived(currentItem.icon);

  const selectOptions = navItems.map((n) => ({ value: n.href, label: n.label }));

  function handleSectionChange(newHref: string) {
    if (newHref && newHref !== page.url.pathname) {
      goto(newHref);
    }
  }

  // Reactively reinitialize worldStore when active project changes
  $effect(() => {
    const activeId = projectStore.activeProjectId;
    if (activeId !== worldStore.currentProjectId) {
      worldStore.setProject(activeId);
    }
  });
</script>

<div class="flex-1 flex flex-col bg-background text-foreground transition-colors min-w-0">
  <!-- World Studio Sub-Header with Breadcrumb & Navigation -->
  <div class="border-b border-border bg-card px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 min-w-0">
    <!-- Desktop Sub-Header (≥ 768px / md): Single balanced row -->
    <div class="hidden md:flex items-center justify-between gap-4 min-w-0">
      <Breadcrumb
        items={[
          { label: 'World Studio', href: '/world' },
          { label: currentItem.shortLabel },
        ]}
      />

      <nav class="flex items-center gap-1 shrink-0 overflow-x-auto [scrollbar-width:none]">
        {#each navItems as item}
          {@const Icon = item.icon}
          {@const isActive = item.exact ? page.url.pathname === item.href : page.url.pathname.startsWith(item.href)}
          <a
            href={item.href}
            class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] shrink-0 {isActive
              ? 'bg-secondary text-secondary-foreground border border-border shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          >
            <Icon class="w-3.5 h-3.5 {isActive ? 'text-primary' : 'text-muted-foreground'} shrink-0" />
            <span>{item.shortLabel}</span>
          </a>
        {/each}
      </nav>
    </div>

    <!-- Mobile Sub-Header (< 768px / md): 2 structured, non-competing lines -->
    <div class="flex md:hidden flex-col gap-1.5 min-w-0">
      <!-- Line 1: Breadcrumb Path -->
      <Breadcrumb
        items={[
          { label: 'World Studio', href: '/world' },
          { label: currentItem.shortLabel },
        ]}
        class="text-[11px]"
      />

      <!-- Line 2: Prominent Section Title + Section Switcher -->
      <div class="flex items-center justify-between gap-2.5 pt-0.5 min-w-0">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <CurrentIcon class="w-4 h-4 text-primary shrink-0" />
          <h1 class="text-sm font-bold tracking-tight text-foreground truncate">
            {currentItem.label}
          </h1>
        </div>

        <div class="w-[140px] xs:w-[160px] sm:w-[180px] shrink-0">
          <Select
            options={selectOptions}
            value={currentItem.href}
            onchange={handleSectionChange}
            placeholder="Jump to..."
            class="h-8 text-xs min-h-[32px]"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Workbench Main Content Container -->
  <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 min-w-0">
    {#if projectStore.isLoaded && !projectStore.activeProject}
      <div class="w-full max-w-lg mx-auto my-6 sm:my-10 p-6 sm:p-8 rounded-xl border border-dashed border-border bg-card/60 text-center space-y-4 shadow-xs">
        <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <BookOpen class="w-6 h-6" />
        </div>
        <div class="space-y-1.5">
          <h2 class="text-base sm:text-lg font-bold tracking-tight text-foreground">No Active Project Selected</h2>
          <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            World Studio blueprints, entities, and timelines belong strictly to a creative novel project. Create a new project or select an existing one to begin building your world.
          </p>
        </div>
        <div class="pt-2">
          <button
            type="button"
            onclick={() => projectStore.openCreateDialog()}
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all min-h-[38px] cursor-pointer"
          >
            <FolderPlus class="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>
    {:else}
      {@render children()}
    {/if}
  </main>
</div>
