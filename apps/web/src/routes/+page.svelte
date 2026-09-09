<script lang="ts">
  import {
    BookOpen,
    Globe2,
    ArrowRight,
    Sparkles,
    Folder,
    FolderPlus,
    Pencil,
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

<div class="flex-1 p-4 sm:p-6 md:p-12 max-w-5xl mx-auto w-full flex flex-col justify-center transition-colors">
  <div class="mb-6 sm:mb-10 text-center space-y-3 sm:space-y-4">
    <div class="inline-block relative">
      <div class="absolute -inset-1.5 bg-linear-to-r from-primary to-purple-600 rounded-2xl blur-md opacity-30 animate-pulse"></div>
      <img
        src="/logo.png"
        alt="NovWrite Logo"
        class="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl object-contain"
      />
    </div>
    <h1
      class="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
    >
      NovWrite Authoring Workspace
    </h1>
    <p class="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
      Professional fictional universe design studio powered by deterministic event folding, 1st-Class Blueprints, AST formulas, and causal timeline auditing.
    </p>

    <!-- Active Project Banner / Zero Project CTA -->
    <div class="pt-2 flex items-center justify-center">
      {#if projectStore.activeProject}
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground">
          <Folder class="w-3.5 h-3.5 text-primary" />
          <span>Active Novel: <strong class="font-bold">{projectStore.activeProject.name}</strong></span>
          <span class="text-muted-foreground">({projectStore.activeProject.genre || "Fiction"})</span>
          <button
            type="button"
            onclick={() => projectStore.openEditDialog()}
            class="ml-1 p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-xs"
            title="Edit Project Settings"
            aria-label="Edit Project Settings"
          >
            <Pencil class="w-3 h-3" />
          </button>
        </div>
      {:else}
        <Button
          size="sm"
          onclick={() => projectStore.openCreateDialog()}
          class="bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shadow-sm"
        >
          <FolderPlus class="w-4 h-4" />
          <span>Create Your First Novel Project</span>
        </Button>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
    <!-- Prose Studio Card -->
    <a
      href="/novel"
      class="group block transition-transform hover:-translate-y-0.5"
    >
      <Card class="h-full border-border bg-card hover:border-primary/60 transition-colors flex flex-col justify-between shadow-xs">
        <CardHeader class="pb-3">
          <div
            class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 transition-colors group-hover:bg-primary/20"
          >
            <BookOpen class="w-5 h-5" />
          </div>
          <CardTitle class="text-xl font-bold group-hover:text-primary transition-colors text-foreground">
            Prose Studio
          </CardTitle>
          <CardDescription class="text-sm text-muted-foreground leading-relaxed">
            Dedicated novel writing canvas, rich text editor, manuscript hierarchy tree, lore lookup drawer, and collaborative scene leases.
          </CardDescription>
        </CardHeader>
        <CardFooter class="pt-4 border-t border-border/80 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span
            class="text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium"
          >
            Open Studio <ArrowRight class="w-3.5 h-3.5" />
          </span>
        </CardFooter>
      </Card>
    </a>

    <!-- World Studio Card -->
    <a
      href="/world"
      class="group block transition-transform hover:-translate-y-0.5"
    >
      <Card class="h-full border-border bg-card hover:border-destructive/60 transition-colors flex flex-col justify-between shadow-xs">
        <CardHeader class="pb-3">
          <div
            class="w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-3 transition-colors group-hover:bg-destructive/20"
          >
            <Globe2 class="w-5 h-5" />
          </div>
          <CardTitle class="text-xl font-bold group-hover:text-destructive transition-colors text-foreground">
            World Studio
          </CardTitle>
          <CardDescription class="text-sm text-muted-foreground leading-relaxed">
            1st-Class Blueprint Archetypes, 2nd-Class Sub-Schemas, AST Math Formulas, Causal Timeline, Invariant Rules, and Continuity Violation Audit.
          </CardDescription>
        </CardHeader>
        <CardFooter class="pt-4 border-t border-border/80 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span
            class="text-destructive flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium"
          >
            Open Studio <ArrowRight class="w-3.5 h-3.5" />
          </span>
        </CardFooter>
      </Card>
    </a>
  </div>
</div>
