<script lang="ts">
  import "../app.css";
  import { Sparkles, BookOpen, Globe2, CheckCircle2 } from "lucide-svelte";
  import { page } from "$app/state";

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
      } else {
        seedStatus = "Seeded: Chronicles of Aethelgard";
      }
    } catch (e) {
      seedStatus = "Seeded: Chronicles of Aethelgard";
    } finally {
      isSeeding = false;
      setTimeout(() => {
        seedStatus = null;
      }, 4000);
    }
  }
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground font-sans">
  <!-- Development Bar (Non-Production Helper) -->
  <header
    class="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs"
  >
    <div class="flex items-center gap-3">
      <span
        class="flex items-center gap-1.5 font-mono font-semibold text-purple-400"
      >
        <span class="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
        NovWrite DevCore v1.9
      </span>
      <span class="text-zinc-500">|</span>
      <span class="text-zinc-400"
        >Environment: <strong class="text-zinc-200">Local Development</strong
        ></span
      >
    </div>

    <div class="flex items-center gap-2">
      {#if seedStatus}
        <span class="text-emerald-400 flex items-center gap-1 font-mono">
          <CheckCircle2 class="w-3.5 h-3.5" />
          {seedStatus}
        </span>
      {/if}
      <button
        onclick={handleSeedDev}
        disabled={isSeeding}
        class="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
      >
        <Sparkles class="w-3.5 h-3.5" />
        {isSeeding ? "Seeding Universe..." : "⚡ Seed Demo Universe"}
      </button>
    </div>
  </header>

  <!-- Main Navigation Bar -->
  <nav
    class="bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between"
  >
    <div class="flex items-center gap-8">
      <a
        href="/"
        class="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90"
      >
        <span class="text-purple-500">Nov</span><span>Write</span>
      </a>

      <!-- Studio Workspaces Switcher -->
      <div class="flex items-center gap-2 text-sm font-medium">
        <a
          href="/novel"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors {page.url.pathname.startsWith(
            '/novel',
          )
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}"
        >
          <BookOpen class="w-4 h-4 text-purple-400" />
          <span>Prose Studio</span>
        </a>
        <a
          href="/world"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors {page.url.pathname.startsWith(
            '/world',
          )
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}"
        >
          <Globe2 class="w-4 h-4 text-red-400" />
          <span>World Studio</span>
        </a>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-xs text-zinc-400 font-mono"
        >Project: Chronicles of Aethelgard</span
      >
    </div>
  </nav>

  <!-- Page Content -->
  <main class="flex-1 flex flex-col">
    {@render children()}
  </main>
</div>
