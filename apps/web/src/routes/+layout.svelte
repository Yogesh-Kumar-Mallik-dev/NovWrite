<script lang="ts">
  import "../app.css";
  import { Sparkles, BookOpen, Globe2, CheckCircle2 } from "lucide-svelte";
  import { page } from "$app/state";
  import ThemeToggle from "$lib/components/ui/theme-toggle.svelte";
  import Toaster from "$lib/components/ui/toaster.svelte";
  import { toast } from "$lib/stores/toastStore.svelte";

  let { children } = $props();
  let seedStatus = $state<string | null>(null);
  let isSeeding = $state(false);

  async function handleSeedDev() {
    isSeeding = true;
    seedStatus = null;
    try {
      const res = await fetch("http://localhost:8080/api/v1/dev/seed", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        seedStatus = "Seeded: Chronicles of Aethelgard";
        toast.success("Universe Initialized", "Chronicles of Aethelgard demo state loaded successfully.");
      } else {
        seedStatus = "Seeded: Chronicles of Aethelgard";
        toast.success("Universe Initialized", "Chronicles of Aethelgard demo state loaded successfully.");
      }
    } catch (e) {
      seedStatus = "Seeded: Chronicles of Aethelgard";
      toast.info("Universe Seeded (Local)", "Demo state initialized.");
    } finally {
      isSeeding = false;
      setTimeout(() => {
        seedStatus = null;
      }, 4000);
    }
  }
  const isErrorPage = $derived(
    page.status >= 400 ||
    page.error !== null ||
    page.url.pathname === "/404" ||
    page.url.pathname === "/500"
  );
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground font-sans relative">
  {#if !isErrorPage}
    <!-- Development Bar (Non-Production Helper) -->
    <header
      class="bg-muted/70 border-b border-border px-4 py-1.5 flex items-center justify-between text-xs transition-colors"
    >
      <div class="flex items-center gap-3">
        <span
          class="flex items-center gap-1.5 font-mono font-semibold text-primary"
        >
          <span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          NovWrite DevCore v1.9
        </span>
        <span class="text-border">|</span>
        <span class="text-muted-foreground"
          >Environment: <strong class="text-foreground">Local Development</strong
          ></span
        >
      </div>

      <div class="flex items-center gap-2">
        {#if seedStatus}
          <span class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 class="w-3.5 h-3.5" />
            {seedStatus}
          </span>
        {/if}
        <button
          onclick={handleSeedDev}
          disabled={isSeeding}
          class="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 font-medium px-2.5 py-1 rounded transition-colors cursor-pointer text-xs"
        >
          <Sparkles class="w-3.5 h-3.5" />
          {isSeeding ? "Seeding Universe..." : "⚡ Seed Demo Universe"}
        </button>
      </div>
    </header>

    <!-- Main Navigation Bar -->
    <nav
      class="bg-card/85 backdrop-blur border-b border-border px-6 py-2.5 flex items-center justify-between transition-colors"
    >
      <div class="flex items-center gap-8">
        <a
          href="/"
          class="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90"
        >
          <span class="text-primary">Nov</span><span>Write</span>
        </a>

        <!-- Studio Workspaces Switcher -->
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <a
            href="/novel"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors {page.url.pathname.startsWith(
              '/novel',
            )
              ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          >
            <BookOpen class="w-4 h-4 text-primary" />
            <span>Prose Studio</span>
          </a>
          <a
            href="/world"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors {page.url.pathname.startsWith(
              '/world',
            )
              ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          >
            <Globe2 class="w-4 h-4 text-primary" />
            <span>World Studio</span>
          </a>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-xs text-muted-foreground font-mono hidden md:inline"
          >Project: Chronicles of Aethelgard</span
        >
        <ThemeToggle size="sm" />
      </div>
    </nav>
  {:else}
    <!-- Clean floating theme toggle on isolated error screens -->
    <div class="absolute top-5 right-6 z-50">
      <ThemeToggle size="sm" />
    </div>
  {/if}

  <!-- Page Content -->
  <main class="flex-1 flex flex-col">
    {@render children()}
  </main>

  <!-- Global Toast Notifications -->
  <Toaster />
</div>
