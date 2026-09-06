<script lang="ts">
  import { BookOpen, Globe2, Activity, ArrowRight, ShieldCheck, Database, Layers } from 'lucide-svelte';
</script>

<div class="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col justify-center">
  <div class="mb-10 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-800 text-purple-300 text-xs font-mono mb-4">
      <ShieldCheck class="w-3.5 h-3.5 text-purple-400" />
      Canon Over AI Memory · Two-Front Isolated Architecture
    </div>
    <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl mb-3">
      NovWrite Engineering Workspace
    </h1>
    <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
      Phase 0 baseline initialized. Parallel development is divided into two autonomous fronts communicating through the dedicated contract bridge.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <!-- Prose Studio Card -->
    <a href="/novel" class="group p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-600/60 transition-all flex flex-col justify-between">
      <div>
        <div class="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400 mb-4">
          <BookOpen class="w-5 h-5" />
        </div>
        <h3 class="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Prose Studio</h3>
        <p class="text-sm text-zinc-400 mb-4">
          Dedicated novel drafting canvas, TipTap editor, manuscript tree, and collaborative heartbeat scene leases.
        </p>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500">
        <span>Branch: novel</span>
        <span class="text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Open Studio <ArrowRight class="w-3.5 h-3.5" />
        </span>
      </div>
    </a>

    <!-- World Studio Card -->
    <a href="/world" class="group p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-red-600/60 transition-all flex flex-col justify-between">
      <div>
        <div class="w-10 h-10 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 mb-4">
          <Globe2 class="w-5 h-5" />
        </div>
        <h3 class="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">World Studio</h3>
        <p class="text-sm text-zinc-400 mb-4">
          Universe entity workbench, dynamic schemas, timeline event sourcing, and 4-step state fold engine.
        </p>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500">
        <span>Branch: world</span>
        <span class="text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Open Studio <ArrowRight class="w-3.5 h-3.5" />
        </span>
      </div>
    </a>

    <!-- Communication Hub Card -->
    <a href="/dev/communication-hub" class="group p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-600/60 transition-all flex flex-col justify-between">
      <div>
        <div class="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-4">
          <Activity class="w-5 h-5" />
        </div>
        <h3 class="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">Diagnostics Hub</h3>
        <p class="text-sm text-zinc-400 mb-4">
          Single-page inspector for all cross-domain RPC traffic, contract validation, and payload replay debugging.
        </p>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500">
        <span>Branch: main (shared)</span>
        <span class="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Launch Hub <ArrowRight class="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  </div>

  <!-- Architecture Status Footer -->
  <div class="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1.5 text-zinc-300">
        <Database class="w-4 h-4 text-purple-400" /> PostgreSQL 18 (port 5433)
      </span>
      <span class="flex items-center gap-1.5 text-zinc-300">
        <Layers class="w-4 h-4 text-red-400" /> Redis 7 (port 6379)
      </span>
    </div>
    <span class="text-zinc-500">Contract: @novwrite/bridge v1.0.0</span>
  </div>
</div>
