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
      class="bg-card/85 backdrop-blur border-b border-border px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between transition-colors gap-2 sm:gap-4 min-w-0"
    >
      <div class="flex items-center gap-2 sm:gap-6 md:gap-8 min-w-0">
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

        <!-- Studio Workspaces Switcher -->
        <div class="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium">
          <a
            href="/novel"
            class="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md min-h-[36px] transition-colors {page.url.pathname.startsWith(
              '/novel',
            )
              ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          >
            <BookOpen class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary shrink-0" />
            <span class="whitespace-nowrap">Prose Studio</span>
          </a>
          <a
            href="/world"
            class="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md min-h-[36px] transition-colors {page.url.pathname.startsWith(
              '/world',
            )
              ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          >
            <Globe2 class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary shrink-0" />
            <span class="whitespace-nowrap">World Studio</span>
          </a>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-4 shrink-0">
        <span class="text-xs text-muted-foreground font-mono hidden lg:inline"
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
