<script lang="ts">
  import {
    Users,
    LayoutTemplate,
    Clock,
    ShieldCheck,
    AlertOctagon,
    ArrowRight,
    Sparkles,
    FolderPlus,
    Folder,
    Pencil,
    Trash2,
  } from "lucide-svelte";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
  } from "$lib/components/ui/card";
  import Button from "$lib/components/ui/button.svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
</script>

<div class="w-full space-y-6 transition-colors">
  <!-- Active Project Header / Onboarding Hero -->
  {#if !projectStore.activeProject}
    <div class="p-6 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="space-y-1 max-w-xl">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles class="w-3 h-3" />
            <span>Getting Started</span>
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-foreground">
            Welcome to NovWrite World Studio
          </h2>
          <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Create your first novel project workspace to begin designing 1st & 2nd-class blueprints, instantiating entities, and tracking causal timeline events.
          </p>
        </div>
        <Button
          onclick={() => projectStore.openCreateDialog()}
          class="bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shrink-0"
        >
          <FolderPlus class="w-4 h-4" />
          <span>Create Your First Project</span>
        </Button>
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-between gap-3 pb-2 border-b border-border/70 flex-wrap">
      <div>
        <div class="flex items-center gap-2">
          <Folder class="w-4 h-4 text-primary" />
          <h2 class="text-xl font-bold tracking-tight text-foreground">
            {projectStore.activeProject.name}
          </h2>
        </div>
        <p class="text-xs text-muted-foreground mt-0.5">
          {projectStore.activeProject.genre || "Creative Project"} · {projectStore.activeProject.description || "World Studio Workspace"}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => projectStore.openEditDialog()}
          class="text-xs gap-1.5"
        >
          <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
          <span>Edit Project</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() => projectStore.openCreateDialog()}
          class="text-xs gap-1.5"
        >
          <FolderPlus class="w-3.5 h-3.5 text-primary" />
          <span>New Project</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() => projectStore.openDeleteDialog()}
          class="text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          title="Delete Project"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  {/if}

  <div>
    <h3 class="text-base font-bold tracking-tight text-foreground">World Studio Workbenches</h3>
    <p class="text-xs text-muted-foreground mt-0.5">
      Select a domain workbench to inspect and manage dynamic lore specifications.
    </p>
  </div>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
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
