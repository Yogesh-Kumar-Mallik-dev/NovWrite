<script lang="ts">
  import "../app.css";
  import { BookOpen, Globe2 } from "lucide-svelte";
  import { page } from "$app/state";
  import ThemeToggle from "$lib/components/ui/theme-toggle.svelte";
  import Toaster from "$lib/components/ui/toaster.svelte";

  let { children } = $props();

  const isErrorPage = $derived(
    page.status >= 400 ||
    page.error !== null ||
    page.url.pathname === "/404" ||
    page.url.pathname === "/500"
  );
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground font-sans relative">
  {#if !isErrorPage}
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
  {/if}

  <!-- Page Content -->
  <main class="flex-1 flex flex-col">
    {@render children()}
  </main>

  <!-- Global Toast Notifications -->
  <Toaster />
</div>
