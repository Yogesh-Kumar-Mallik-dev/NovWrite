<script lang="ts">
  import "../app.css";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import {
    BookOpen,
    Globe2,
    Menu,
    Home,
    Users,
    LayoutTemplate,
    Clock,
    ShieldCheck,
    AlertOctagon,
    ChevronRight,
    Edit3,
    ListTree,
    BarChart3,
    User,
    LogOut,
    LogIn,
    Shield,
  } from "lucide-svelte";
  import { page } from "$app/state";
  import { authStore } from "$lib/stores/projectStore.svelte";
  import ThemeToggle from "$lib/components/ui/theme-toggle.svelte";
  import ProjectSwitcher from "$lib/components/ui/project-switcher.svelte";
  import CreateProjectDialog from "$lib/components/ui/create-project-dialog.svelte";
  import EditProjectDialog from "$lib/components/ui/edit-project-dialog.svelte";
  import DeleteProjectDialog from "$lib/components/ui/delete-project-dialog.svelte";
  import Toaster from "$lib/components/ui/toaster.svelte";

  let { children } = $props();

  let mobileDrawerOpen = $state(false);
  let userMenuOpen = $state(false);

  const isErrorPage = $derived(
    page.status >= 400 ||
    page.error !== null ||
    page.url.pathname === "/404" ||
    page.url.pathname === "/500"
  );

  // Close drawer on navigation
  $effect(() => {
    page.url.pathname;
    mobileDrawerOpen = false;
    userMenuOpen = false;
  });

  const novelNavItems = [
    { href: "/novel", label: "Manuscript Overview", icon: BookOpen, exact: true },
    { href: "/novel/editor", label: "Canvas Editor", icon: Edit3 },
    { href: "/novel/outline", label: "Manuscript Outline", icon: ListTree },
    { href: "/novel/stats", label: "Writing Telemetry", icon: BarChart3 },
  ];

  const worldNavItems = [
    { href: "/world", label: "Overview / Dashboard", icon: Home, exact: true },
    { href: "/world/entities", label: "Universe Entities", icon: Users },
    { href: "/world/schemas", label: "Blueprints & Schemas", icon: LayoutTemplate },
    { href: "/world/timeline", label: "Causal Timeline", icon: Clock },
    { href: "/world/rules", label: "Invariant Rules", icon: ShieldCheck },
    { href: "/world/audit", label: "Continuity Audit", icon: AlertOctagon },
  ];
</script>

<svelte:window onkeydown={(e) => { 
  if (e.key === 'Escape') {
    if (mobileDrawerOpen) mobileDrawerOpen = false;
    if (userMenuOpen) userMenuOpen = false;
  }
}} />

<div class="min-h-screen w-full max-w-full flex flex-col bg-background text-foreground font-sans relative overflow-x-clip">
  {#if !isErrorPage}
    <!-- Main Navigation Bar -->
    <nav
      class="h-14 bg-card/85 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors gap-2.5 sm:gap-4 min-w-0 sticky top-0 z-30"
    >
      <!-- Left: Mobile Hamburger OR Desktop Brand + Links -->
      <div class="flex items-center gap-2 sm:gap-6 md:gap-8 min-w-0">
        <!-- Mobile Hamburger Button (< 768px) -->
        <button
          type="button"
          class="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
          onclick={() => (mobileDrawerOpen = true)}
          aria-label="Open Navigation Menu"
        >
          <Menu class="w-5 h-5" />
        </button>

        <!-- Brand Identity -->
        <a
          href="/"
          class="flex items-center gap-2 sm:gap-2.5 font-bold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity shrink-0"
        >
          <img
            src="/logo.png"
            alt="NovWrite"
            class="w-6 h-6 rounded-md object-contain border border-border shadow-2xs shrink-0"
          />
          <div class="flex items-center">
            <span class="text-primary">Nov</span><span>Write</span>
          </div>
        </a>

        <!-- Desktop Studio Workspaces Switcher (≥ 768px) -->
        <div class="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-medium">
          <a
            href="/novel"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md min-h-[36px] transition-colors {page.url.pathname.startsWith(
              '/novel',
            )
              ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          >
            <BookOpen class="w-4 h-4 text-primary shrink-0" />
            <span class="whitespace-nowrap">Prose Studio</span>
          </a>
          <a
            href="/world"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md min-h-[36px] transition-colors {page.url.pathname.startsWith(
              '/world',
            )
              ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          >
            <Globe2 class="w-4 h-4 text-primary shrink-0" />
            <span class="whitespace-nowrap">World Studio</span>
          </a>
        </div>
      </div>

      <!-- Right: User Account, Project Switcher & Theme Toggle -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <ProjectSwitcher />
        <ThemeToggle size="sm" />

        <!-- User Profile Pill / Menu -->
        <div class="relative">
          {#if authStore.isAuthenticated}
            <button
              type="button"
              onclick={() => (userMenuOpen = !userMenuOpen)}
              class="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-border bg-card/80 hover:bg-muted/80 text-xs font-medium transition-colors cursor-pointer"
              aria-label="User Account Menu"
            >
              <div class="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                {authStore.username.charAt(0).toUpperCase()}
              </div>
              <span class="hidden sm:inline max-w-[100px] truncate">{authStore.username}</span>
              {#if authStore.isSuperAdmin}
                <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  ROOT
                </span>
              {/if}
            </button>

            {#if userMenuOpen}
              <div
                transition:fade={{ duration: 120 }}
                class="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-card shadow-xl py-1.5 z-50 text-xs"
              >
                <div class="px-3 py-2 border-b border-border/60">
                  <div class="font-semibold text-foreground truncate">{authStore.username}</div>
                  <div class="text-[11px] text-muted-foreground truncate">{authStore.email || "author@novwrite.dev"}</div>
                  <div class="mt-1 text-[10px] uppercase font-bold text-primary">{authStore.role || "USER"}</div>
                </div>

                {#if authStore.isSuperAdmin}
                  <a
                    href="/superadmin"
                    onclick={() => (userMenuOpen = false)}
                    class="flex items-center gap-2 px-3 py-2 hover:bg-muted text-foreground transition-colors"
                  >
                    <Shield class="w-3.5 h-3.5 text-purple-500" />
                    <span>Super Admin Console</span>
                  </a>
                {/if}

                <button
                  type="button"
                  onclick={() => {
                    userMenuOpen = false;
                    authStore.logout();
                  }}
                  class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                >
                  <LogOut class="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            {/if}
          {:else}
            <a
              href="/superadmin"
              class="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border border-border bg-card/80 hover:bg-muted text-xs font-medium transition-colors"
            >
              <LogIn class="w-3.5 h-3.5 text-primary" />
              <span class="hidden sm:inline">Sign In</span>
            </a>
          {/if}
        </div>
      </div>
    </nav>

    <!-- Mobile Slide-In Navigation Drawer -->
    {#if mobileDrawerOpen}
      <div
        transition:fade={{ duration: 180 }}
        class="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-xs"
        onclick={() => (mobileDrawerOpen = false)}
        onkeydown={(e) => e.key === "Escape" && (mobileDrawerOpen = false)}
        role="button"
        tabindex="0"
        aria-label="Close Navigation Backdrop"
      >
        <div
          transition:fly={{ x: -320, duration: 220, easing: cubicOut }}
          class="fixed inset-y-0 left-0 w-[min(85vw,320px)] bg-card border-r border-border shadow-2xl flex flex-col z-50"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
          tabindex="-1"
        >
          <!-- Drawer Header -->
          <div class="h-14 px-4 flex items-center border-b border-border shrink-0">
            <div class="flex items-center gap-2.5 font-bold text-base tracking-tight">
              <img
                src="/logo.png"
                alt="NovWrite"
                class="w-6 h-6 rounded-md object-contain border border-border shadow-2xs"
              />
              <span>
                <span class="text-primary">Nov</span>Write
              </span>
            </div>
          </div>

          <!-- Drawer Scrollable Body -->
          <div class="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-5 [scrollbar-width:thin]">
            <!-- Active Project Switcher -->
            <ProjectSwitcher isMobile={true} />

            <!-- Studio Workspaces Group -->
            <div class="space-y-1.5">
              <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-1 block">
                Studio Workspaces
              </span>

              <div class="space-y-1">
                <a
                  href="/novel"
                  onclick={() => (mobileDrawerOpen = false)}
                  class="flex items-center justify-between h-9 px-3 rounded-md text-xs font-medium transition-colors {page.url.pathname.startsWith(
                    '/novel',
                  )
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'}"
                >
                  <div class="flex items-center gap-2.5">
                    <BookOpen class="w-4 h-4 text-primary shrink-0" />
                    <span>Prose Studio</span>
                  </div>
                  <ChevronRight class="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                </a>

                <a
                  href="/world"
                  onclick={() => (mobileDrawerOpen = false)}
                  class="flex items-center justify-between h-9 px-3 rounded-md text-xs font-medium transition-colors {page.url.pathname.startsWith(
                    '/world',
                  )
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'}"
                >
                  <div class="flex items-center gap-2.5">
                    <Globe2 class="w-4 h-4 text-primary shrink-0" />
                    <span>World Studio</span>
                  </div>
                  <ChevronRight class="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                </a>
              </div>
            </div>

            <!-- Prose Studio Sections Sub-List -->
            {#if page.url.pathname.startsWith('/novel')}
              <div class="space-y-1.5">
                <span class="text-[10px] uppercase font-bold tracking-wider text-primary/90 px-1 block">
                  Prose Workbench
                </span>

                <div class="space-y-1 border-l-2 border-primary/30 ml-2.5 pl-2.5">
                  {#each novelNavItems as item}
                    {@const Icon = item.icon}
                    {@const isActive = item.exact
                      ? page.url.pathname === item.href
                      : page.url.pathname.startsWith(item.href)}
                    <a
                      href={item.href}
                      onclick={() => (mobileDrawerOpen = false)}
                      class="flex items-center gap-2.5 h-8 px-2 rounded-md text-xs font-medium transition-colors {isActive
                        ? 'bg-secondary text-secondary-foreground font-bold border border-border shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
                    >
                      <Icon class="w-3.5 h-3.5 shrink-0 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
                      <span class="truncate">{item.label}</span>
                    </a>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- World Studio Sections Sub-List -->
            {#if page.url.pathname.startsWith('/world')}
              <div class="space-y-1.5">
                <span class="text-[10px] uppercase font-bold tracking-wider text-primary/90 px-1 block">
                  World Workbench
                </span>

                <div class="space-y-1 border-l-2 border-primary/30 ml-2.5 pl-2.5">
                  {#each worldNavItems as item}
                    {@const Icon = item.icon}
                    {@const isActive = item.exact
                      ? page.url.pathname === item.href
                      : page.url.pathname.startsWith(item.href)}
                    <a
                      href={item.href}
                      onclick={() => (mobileDrawerOpen = false)}
                      class="flex items-center gap-2.5 h-8 px-2 rounded-md text-xs font-medium transition-colors {isActive
                        ? 'bg-secondary text-secondary-foreground font-bold border border-border shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
                    >
                      <Icon class="w-3.5 h-3.5 shrink-0 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
                      <span class="truncate">{item.label}</span>
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
            <!-- User Account / Auth Mobile Section -->
            <div class="space-y-1.5 pt-2 border-t border-border">
              <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-1 block">
                Account & Identity
              </span>
              {#if authStore.isAuthenticated}
                <div class="p-2.5 rounded-lg border border-border bg-card/60 space-y-2">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                      {authStore.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-xs text-foreground truncate">{authStore.username}</div>
                      <div class="text-[10px] text-muted-foreground truncate">{authStore.email || "author@novwrite.dev"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onclick={() => {
                      mobileDrawerOpen = false;
                      authStore.logout();
                    }}
                    class="w-full h-8 flex items-center justify-center gap-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium transition-colors"
                  >
                    <LogOut class="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              {:else}
                <a
                  href="/superadmin"
                  onclick={() => (mobileDrawerOpen = false)}
                  class="flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition-opacity hover:opacity-90"
                >
                  <LogIn class="w-4 h-4" />
                  <span>Sign In to NovWrite</span>
                </a>
              {/if}
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="shrink-0 mt-auto px-4 py-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-card/60">
            <span class="font-medium text-xs">Theme</span>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Page Content -->
  <main class="flex-1 flex flex-col">
    {@render children()}
  </main>

  <!-- Global Modals & Notifications -->
  <CreateProjectDialog />
  <EditProjectDialog />
  <DeleteProjectDialog />
  <Toaster />
</div>
