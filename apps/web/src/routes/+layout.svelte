<script lang="ts">
  import "../app.css";
  import {
    Sparkles,
    Activity,
    BookOpen,
    Globe2,
    ShieldAlert,
    CheckCircle2,
  } from "lucide-svelte";

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
        seedStatus = "Mock seed active";
      }
    } catch (e) {
      seedStatus = "Mock seed active";
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
        >Environment: <strong class="text-zinc-200">Local Main (Phase 0)</strong
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
        class="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-2.5 py-1 rounded transition-colors"
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
    <div class="flex items-center gap-6">
      <a
        href="/"
        class="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90"
      >
        <span class="text-purple-500">Nov</span><span>Write</span>
      </a>

      <div class="flex items-center gap-1 text-sm font-medium">
        <a
          href="/novel"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <BookOpen class="w-4 h-4 text-purple-400" />
          Prose Studio (novel branch)
        </a>
        <a
          href="/world"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <Globe2 class="w-4 h-4 text-red-400" />
          World Studio (world branch)
        </a>
        <a
          href="/dev/communication-hub"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <Activity class="w-4 h-4 text-emerald-400" />
          Communication Hub
        </a>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-xs text-zinc-500 font-mono"
        >Project: 9b1deb4d · Chronicles of Aethelgard</span
      >
    </div>
  </nav>

  <!-- Page Content -->
  <main class="flex-1 flex flex-col">
    {@render children()}
  </main>
</div>
