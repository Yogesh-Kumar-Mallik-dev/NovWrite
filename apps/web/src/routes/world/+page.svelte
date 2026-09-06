<script lang="ts">
  import { Users, LayoutTemplate, Clock, ShieldCheck, AlertOctagon, ArrowRight, Sparkles } from 'lucide-svelte';
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
  } from "$lib/components/ui/card";
</script>

<div class="max-w-5xl mx-auto space-y-6 transition-colors">
  <div>
    <h2 class="text-xl font-bold tracking-tight text-foreground">World Studio Hub</h2>
    <p class="text-sm text-muted-foreground mt-1">
      Manage universe entities, 1st & 2nd-class blueprints, causal timeline events, and invariant continuity rules.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Universe Entities -->
    <a
      href="/world/entities"
      class="group block transition-transform hover:-translate-y-0.5"
    >
      <Card class="h-full border-border bg-card hover:border-teal-500/60 transition-colors flex flex-col justify-between shadow-xs">
        <CardHeader class="pb-3 space-y-2">
          <div class="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-sm">
            <Users class="w-4 h-4" />
            <span>Universe Entities</span>
          </div>
          <CardDescription class="text-xs text-muted-foreground leading-relaxed">
            Instantiate characters, factions, artifacts, and regions with custom per-blueprint table columns and live formula evaluations.
          </CardDescription>
        </CardHeader>
        <CardFooter class="pt-3 border-t border-border/80 text-xs font-medium text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center">
          <span>View Entities</span> <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </CardFooter>
      </Card>
    </a>

    <!-- Blueprints & Schemas (1st & 2nd Class) -->
    <a
      href="/world/schemas"
      class="group block transition-transform hover:-translate-y-0.5"
    >
      <Card class="h-full border-border bg-card hover:border-cyan-500/60 transition-colors flex flex-col justify-between shadow-xs">
        <CardHeader class="pb-3 space-y-2">
          <div class="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold text-sm">
            <LayoutTemplate class="w-4 h-4" />
            <span>Blueprints & Schemas</span>
          </div>
          <CardDescription class="text-xs text-muted-foreground leading-relaxed">
            Architect 1st-Class archetypes (Characters, Relics) and 2nd-Class sub-schemas (Cultivation Ladders, Affection Gauges, Math Formulas).
          </CardDescription>
        </CardHeader>
        <CardFooter class="pt-3 border-t border-border/80 text-xs font-medium text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center">
          <span>Manage Blueprints</span> <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </CardFooter>
      </Card>
    </a>

    <!-- Causal Timeline -->
    <a
      href="/world/timeline"
      class="group block transition-transform hover:-translate-y-0.5"
    >
      <Card class="h-full border-border bg-card hover:border-primary/60 transition-colors flex flex-col justify-between shadow-xs">
        <CardHeader class="pb-3 space-y-2">
          <div class="flex items-center gap-2 text-primary font-semibold text-sm">
            <Clock class="w-4 h-4" />
            <span>Causal Timeline</span>
          </div>
          <CardDescription class="text-xs text-muted-foreground leading-relaxed">
            Dual-index causal delta event stream: narrative reading sequence vs universe chronological order with time-travel state scrubber.
          </CardDescription>
        </CardHeader>
        <CardFooter class="pt-3 border-t border-border/80 text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform flex items-center">
          <span>Open Timeline</span> <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </CardFooter>
      </Card>
    </a>

    <!-- Invariant Rules -->
    <a
      href="/world/rules"
      class="group block transition-transform hover:-translate-y-0.5"
    >
      <Card class="h-full border-border bg-card hover:border-amber-500/60 transition-colors flex flex-col justify-between shadow-xs">
        <CardHeader class="pb-3 space-y-2">
          <div class="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
            <ShieldCheck class="w-4 h-4" />
            <span>Invariant Rules</span>
          </div>
          <CardDescription class="text-xs text-muted-foreground leading-relaxed">
            Author-defined universe boundary laws (numeric bounds, dead entity action restrictions, prerequisites, formula clamps).
          </CardDescription>
        </CardHeader>
        <CardFooter class="pt-3 border-t border-border/80 text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center">
          <span>Rules Builder</span> <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </CardFooter>
      </Card>
    </a>

    <!-- Continuity Audit -->
    <a
      href="/world/audit"
      class="group block transition-transform hover:-translate-y-0.5"
    >
      <Card class="h-full border-border bg-card hover:border-destructive/60 transition-colors flex flex-col justify-between shadow-xs">
        <CardHeader class="pb-3 space-y-2">
          <div class="flex items-center gap-2 text-destructive font-semibold text-sm">
            <AlertOctagon class="w-4 h-4" />
            <span>Continuity Audit</span>
          </div>
          <CardDescription class="text-xs text-muted-foreground leading-relaxed">
            Live contradiction detector comparing drafted scenes against causal state fold graphs with RFC 7807 problem details.
          </CardDescription>
        </CardHeader>
        <CardFooter class="pt-3 border-t border-border/80 text-xs font-medium text-destructive group-hover:translate-x-0.5 transition-transform flex items-center">
          <span>Audit Console</span> <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </CardFooter>
      </Card>
    </a>
  </div>
</div>
