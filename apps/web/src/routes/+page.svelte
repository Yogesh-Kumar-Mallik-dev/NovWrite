<script lang="ts">
  import {
    BookOpen,
    Globe2,
    ArrowRight,
    ShieldCheck,
    Database,
    Layers,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
</script>

<div class="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col justify-center">
  <div class="mb-10 text-center space-y-3">
    <div
      class="flex items-center justify-center gap-2 text-purple-400 text-xs font-mono font-medium"
    >
      <ShieldCheck class="w-4 h-4" />
      <span>Canon Over AI Memory · Isolated Two-Front Architecture</span>
    </div>
    <h1
      class="text-4xl font-extrabold tracking-tight sm:text-5xl text-zinc-100"
    >
      NovWrite Authoring Workspace
    </h1>
    <p class="text-zinc-400 text-base max-w-2xl mx-auto">
      Professional multi-user novel writing platform powered by the
      deterministic universe state engine.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <!-- Prose Studio Card -->
    <a
      href="/novel"
      class="group p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-600/60 transition-all flex flex-col justify-between"
    >
      <div>
        <div
          class="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400 mb-4"
        >
          <BookOpen class="w-5 h-5" />
        </div>
        <h3
          class="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors text-zinc-100"
        >
          Prose Studio
        </h3>
        <p class="text-sm text-zinc-400 mb-4 leading-relaxed">
          Dedicated novel writing canvas, rich text editor, manuscript hierarchy
          tree, lore lookup drawer, and collaborative scene leases.
        </p>
      </div>
      <div
        class="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500"
      >
        <span>Branch: novel</span>
        <span
          class="text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium"
        >
          Open Studio <ArrowRight class="w-3.5 h-3.5" />
        </span>
      </div>
    </a>

    <!-- World Studio Card -->
    <a
      href="/world"
      class="group p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-red-600/60 transition-all flex flex-col justify-between"
    >
      <div>
        <div
          class="w-10 h-10 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 mb-4"
        >
          <Globe2 class="w-5 h-5" />
        </div>
        <h3
          class="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors text-zinc-100"
        >
          World Studio
        </h3>
        <p class="text-sm text-zinc-400 mb-4 leading-relaxed">
          Universe entity workbench, dynamic property schemas, dual-index causal
          timeline, invariant rules, and continuity audit console.
        </p>
      </div>
      <div
        class="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500"
      >
        <span>Branch: world</span>
        <span
          class="text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium"
        >
          Open Studio <ArrowRight class="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  </div>

  <!-- Workspace Status Footer -->
  <div
    class="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono"
  >
    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1.5 text-zinc-300">
        <Database class="w-4 h-4 text-purple-400" /> PostgreSQL 18
      </span>
      <span class="flex items-center gap-1.5 text-zinc-300">
        <Layers class="w-4 h-4 text-red-400" /> Redis 7
      </span>
    </div>
    <span class="text-zinc-500">NovWrite v1.0 MVP</span>
  </div>
</div>
