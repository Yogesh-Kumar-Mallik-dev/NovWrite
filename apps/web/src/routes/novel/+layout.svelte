<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import {
    BookOpen,
    Edit3,
    ListTree,
    BarChart3,
    FolderPlus,
    FileText,
  } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { projectStore } from '$lib/stores/projectStore.svelte';
  import { proseStore } from '$lib/stores/proseStore.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/novel', label: 'Manuscript Overview', shortLabel: 'Overview', icon: BookOpen, exact: true },
    { href: '/novel/editor', label: 'Canvas Editor', shortLabel: 'Editor', icon: Edit3 },
    { href: '/novel/outline', label: 'Manuscript Outline', shortLabel: 'Outline', icon: ListTree },
    { href: '/novel/stats', label: 'Writing Telemetry', shortLabel: 'Stats', icon: BarChart3 },
  ];

  const currentItem = $derived.by(() => {
    const exact = navItems.find((item) => item.exact && page.url.pathname === item.href);
    if (exact) return exact;
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

  // Reactively reinitialize proseStore when active project changes
  $effect(() => {
    const activeId = projectStore.activeProjectId;
    if (activeId) {
      proseStore.initForCurrentProject();
    }
  });
</script>

<div class="flex-1 flex flex-col bg-background text-foreground transition-colors min-w-0">
  <!-- Prose Studio Sub-Header with Breadcrumb & Navigation -->
  <div class="border-b border-border bg-card px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 min-w-0">
    <!-- Desktop Sub-Header (≥ 768px / md): Single balanced row -->
    <div class="hidden md:flex items-center justify-between gap-4 min-w-0">
      <Breadcrumb
        items={[
          { label: 'Prose Studio', href: '/novel' },
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

    <!-- Mobile Sub-Header (< 768px / md): 2 structured lines -->
    <div class="flex md:hidden flex-col gap-1.5 min-w-0">
      <!-- Line 1: Breadcrumb Path -->
      <Breadcrumb
        items={[
          { label: 'Prose Studio', href: '/novel' },
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

        <div class="w-[150px] xs:w-[170px] sm:w-[190px] shrink-0">
          <Select
            options={selectOptions}
            value={currentItem.href}
            placeholder="Select Section..."
            onchange={(val) => handleSectionChange(String(val))}
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Sub-route View Content -->
  {#if !projectStore.activeProject}
    <div class="flex-1 flex items-center justify-center p-6 sm:p-12">
      <div class="max-w-md w-full text-center space-y-4 bg-card border border-border p-6 sm:p-8 rounded-xl shadow-xs">
        <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <FileText class="w-6 h-6" />
        </div>
        <h2 class="text-lg sm:text-xl font-bold tracking-tight">No Active Novel Project</h2>
        <p class="text-xs sm:text-sm text-muted-foreground">
          Select an existing novel project or initialize a new creative project to start writing chapters and scenes.
        </p>
        <button
          type="button"
          onclick={() => (projectStore.isCreateDialogOpen = true)}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer w-full sm:w-auto min-h-[44px]"
        >
          <FolderPlus class="w-4 h-4" />
          <span>Create Novel Project</span>
        </button>
      </div>
    </div>
  {:else}
    <div class="flex-1 flex flex-col min-w-0">
      {@render children()}
    </div>
  {/if}
</div>
