<script lang="ts">
  import {
    Users,
    Clock,
    ShieldCheck,
    AlertOctagon,
    ArrowRight,
  } from "lucide-svelte";
</script>

<div class="max-w-5xl mx-auto space-y-6">
  <div>
    <h2 class="text-xl font-bold tracking-tight text-zinc-100">
      World Studio Hub
    </h2>
    <p class="text-sm text-zinc-400 mt-1">
      Manage the canonical universe rules, dynamic schemas, timeline causal
      events, and continuity validation.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <a
      href="/world/characters"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div
          class="flex items-center gap-2 text-purple-400 font-semibold text-sm"
        >
          <Users class="w-4 h-4" />
          <span>Entities & Schemas</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Define dynamic entity types (Characters, Locations, Artifacts) and
          inspect real-time property values.
        </p>
      </div>
      <div
        class="mt-4 flex items-center text-xs font-medium text-purple-400 group-hover:translate-x-0.5 transition-transform"
      >
        Open Entity Workbench <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>

    <a
      href="/world/timeline"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div
          class="flex items-center gap-2 text-cyan-400 font-semibold text-sm"
        >
          <Clock class="w-4 h-4" />
          <span>Causal Timeline</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Dual-index causal event stream: toggle between narrative manuscript
          sequence and universe chronological order.
        </p>
      </div>
      <div
        class="mt-4 flex items-center text-xs font-medium text-cyan-400 group-hover:translate-x-0.5 transition-transform"
      >
        Open Timeline Workbench <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>

    <a
      href="/world/rules"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div
          class="flex items-center gap-2 text-amber-400 font-semibold text-sm"
        >
          <ShieldCheck class="w-4 h-4" />
          <span>Invariant Rules</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Author-defined universe boundary rules (numeric bounds, state guard
          conditions, prerequisites).
        </p>
      </div>
      <div
        class="mt-4 flex items-center text-xs font-medium text-amber-400 group-hover:translate-x-0.5 transition-transform"
      >
        Open Rules Workbench <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>

    <a
      href="/world/audit"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-red-400 font-semibold text-sm">
          <AlertOctagon class="w-4 h-4" />
          <span>Continuity Violation Audit</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Inspect RFC 7807 problem details across draft scenes and execute Lead
          Author overrides with audit logging.
        </p>
      </div>
      <div
        class="mt-4 flex items-center text-xs font-medium text-red-400 group-hover:translate-x-0.5 transition-transform"
      >
        Open Audit Console <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>
  </div>
</div>
