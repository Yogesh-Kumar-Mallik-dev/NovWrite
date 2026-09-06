<script lang="ts">
  import { Users, LayoutTemplate, Clock, ShieldCheck, AlertOctagon, ArrowRight } from 'lucide-svelte';
</script>

<div class="max-w-5xl mx-auto space-y-6">
  <div>
    <h2 class="text-xl font-bold tracking-tight text-zinc-100">World Studio Hub</h2>
    <p class="text-sm text-zinc-400 mt-1">
      Manage universe entities, 1st & 2nd-class blueprints, causal timeline events, and invariant continuity rules.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Universe Entities -->
    <a
      href="/world/entities"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-teal-400 font-semibold text-sm">
          <Users class="w-4 h-4" />
          <span>Universe Entities</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Instantiate characters, factions, artifacts, and regions with custom per-blueprint table columns and live formula evaluations.
        </p>
      </div>
      <div class="mt-4 flex items-center text-xs font-medium text-teal-400 group-hover:translate-x-0.5 transition-transform">
        View Entities <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>

    <!-- Blueprints & Schemas (1st & 2nd Class) -->
    <a
      href="/world/schemas"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
          <LayoutTemplate class="w-4 h-4" />
          <span>Blueprints & Schemas</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Architect 1st-Class archetypes (Characters, Relics) and 2nd-Class sub-schemas (Cultivation Ladders, Affection Gauges, Math Formulas).
        </p>
      </div>
      <div class="mt-4 flex items-center text-xs font-medium text-cyan-400 group-hover:translate-x-0.5 transition-transform">
        Manage Blueprints <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>

    <!-- Causal Timeline -->
    <a
      href="/world/timeline"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Clock class="w-4 h-4" />
          <span>Causal Timeline</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Dual-index causal delta event stream: narrative reading sequence vs universe chronological order.
        </p>
      </div>
      <div class="mt-4 flex items-center text-xs font-medium text-indigo-400 group-hover:translate-x-0.5 transition-transform">
        Open Timeline <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>

    <!-- Invariant Rules -->
    <a
      href="/world/rules"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <ShieldCheck class="w-4 h-4" />
          <span>Invariant Rules</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Author-defined universe boundary laws (numeric bounds, dead entity action restrictions, prerequisites).
        </p>
      </div>
      <div class="mt-4 flex items-center text-xs font-medium text-amber-400 group-hover:translate-x-0.5 transition-transform">
        Rules Builder <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>

    <!-- Continuity Audit -->
    <a
      href="/world/audit"
      class="p-5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between group"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-red-400 font-semibold text-sm">
          <AlertOctagon class="w-4 h-4" />
          <span>Continuity Audit</span>
        </div>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Inspect RFC 7807 problem details across draft scenes and execute Lead Author overrides with audit logging.
        </p>
      </div>
      <div class="mt-4 flex items-center text-xs font-medium text-red-400 group-hover:translate-x-0.5 transition-transform">
        Open Audit Console <ArrowRight class="w-3.5 h-3.5 ml-1" />
      </div>
    </a>
  </div>
</div>
