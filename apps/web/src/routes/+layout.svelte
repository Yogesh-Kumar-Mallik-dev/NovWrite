<script lang="ts">
  import "../app.css";
  import {
    BookOpen,
    Globe2,
    Menu,
    X,
    Home,
    Users,
    LayoutTemplate,
    Clock,
    ShieldCheck,
    AlertOctagon,
    Activity,
    ChevronRight,
  } from "lucide-svelte";
  import { page } from "$app/state";
  import ThemeToggle from "$lib/components/ui/theme-toggle.svelte";
  import Toaster from "$lib/components/ui/toaster.svelte";

  let { children } = $props();

  let mobileDrawerOpen = $state(false);

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
  });

  const worldNavItems = [
    { href: "/world", label: "Overview / Dashboard", icon: Home, exact: true },
    { href: "/world/entities", label: "Universe Entities", icon: Users },
    { href: "/world/schemas", label: "Blueprints & Schemas", icon: LayoutTemplate },
    { href: "/world/timeline", label: "Causal Timeline", icon: Clock },
    { href: "/world/rules", label: "Invariant Rules", icon: ShieldCheck },
    { href: "/world/audit", label: "Continuity Audit", icon: AlertOctagon },
  ];
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground font-sans relative">
  {#if !isErrorPage}
    <!-- Main Navigation Bar -->
    <nav
      class="bg-card/85 backdrop-blur border-b border-border px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between transition-colors gap-2 sm:gap-4 min-w-0 sticky top-0 z-30"
    >
      <!-- Left: Mobile Hamburger OR Desktop Brand + Links -->
      <div class="flex items-center gap-2 sm:gap-6 md:gap-8 min-w-0">
        <!-- Mobile Hamburger Button (< 768px) -->
        <button
          type="button"
          class="md:hidden flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
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
            class="w-6 h-6 rounded-md object-contain border border-border shadow-2xs"
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

      <!-- Right: Telemetry & Theme Toggle -->
      <div class="flex items-center gap-2 sm:gap-4 shrink-0">
        <span class="text-xs text-muted-foreground font-mono hidden lg:inline"
          >Project: Chronicles of Aethelgard</span
        >
        <ThemeToggle size="sm" />
      </div>
    </nav>

    <!-- Mobile Slide-In Navigation Drawer -->
    {#if mobileDrawerOpen}
      <div
        class="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onclick={() => (mobileDrawerOpen = false)}
        onkeydown={(e) => e.key === "Escape" && (mobileDrawerOpen = false)}
        role="button"
        tabindex="0"
        aria-label="Close Navigation Backdrop"
      >
        <div
          class="fixed inset-y-0 left-0 w-[min(85vw,340px)] bg-card border-r border-border shadow-2xl flex flex-col p-4 z-50 animate-in slide-in-from-left duration-200"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
          tabindex="-1"
        >
          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <div class="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="NovWrite"
                class="w-6 h-6 rounded-md object-contain border border-border"
              />
              <span class="font-bold text-base tracking-tight">
                <span class="text-primary">Nov</span>Write
              </span>
            </div>
            <button
              type="button"
              class="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              onclick={() => (mobileDrawerOpen = false)}
              aria-label="Close Navigation Drawer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Project Context Badge -->
          <div class="py-2.5 px-3 my-3 rounded-lg bg-muted/50 border border-border/70 text-xs font-mono text-muted-foreground">
            <span class="block text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">Active Project</span>
            <span class="font-bold text-foreground truncate block">Chronicles of Aethelgard</span>
          </div>

          <!-- Drawer Navigation Links -->
          <div class="flex-1 overflow-y-auto space-y-4 py-1">
            <!-- Studio Workspaces Group -->
            <div class="space-y-1">
              <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 block">
                Studio Workspaces
              </span>

              <a
                href="/novel"
                class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {page.url.pathname.startsWith(
                  '/novel',
                )
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground/80 hover:bg-muted'}"
              >
                <div class="flex items-center gap-2.5">
                  <BookOpen class="w-4 h-4 text-primary" />
                  <span>Prose Studio</span>
                </div>
                <ChevronRight class="w-4 h-4 text-muted-foreground/50" />
              </a>

              <a
                href="/world"
                class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {page.url.pathname.startsWith(
                  '/world',
                )
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground/80 hover:bg-muted'}"
              >
                <div class="flex items-center gap-2.5">
                  <Globe2 class="w-4 h-4 text-primary" />
                  <span>World Studio</span>
                </div>
                <ChevronRight class="w-4 h-4 text-muted-foreground/50" />
              </a>
            </div>

            <!-- World Studio Sections Sub-List -->
            {#if page.url.pathname.startsWith('/world')}
              <div class="space-y-1 pl-2 border-l-2 border-primary/30 ml-2">
                <span class="text-[10px] uppercase font-bold tracking-wider text-primary px-2 block">
                  World Workbench
                </span>

                {#each worldNavItems as item}
                  {@const Icon = item.icon}
                  {@const isActive = item.exact
                    ? page.url.pathname === item.href
                    : page.url.pathname.startsWith(item.href)}
                  <a
                    href={item.href}
                    class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors {isActive
                      ? 'bg-secondary text-secondary-foreground font-bold border border-border'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
                  >
                    <Icon class="w-3.5 h-3.5 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
                    <span>{item.label}</span>
                  </a>
                {/each}
              </div>
            {/if}

            <!-- Developer Tools Group -->
            <div class="space-y-1 pt-2 border-t border-border/60">
              <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 block">
                Diagnostics
              </span>
              <a
                href="/dev/communication-hub"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Activity class="w-3.5 h-3.5 text-emerald-500" />
                <span>Bridge Diagnostics Hub</span>
              </a>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Theme</span>
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

  <!-- Global Toast Notifications -->
  <Toaster />
</div>
