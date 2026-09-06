<script lang="ts">
  import {
    BookOpen,
    Globe2,
    ArrowRight,
    ShieldCheck,
    Database,
    Layers,
    Sparkles,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
  } from "$lib/components/ui/card";
</script>

<div class="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full flex flex-col justify-center transition-colors">
  <div class="mb-10 text-center space-y-3">
    <div
      class="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium mx-auto"
    >
      <ShieldCheck class="w-4 h-4" />
      <span>Canon Over AI Memory · Isolated Two-Front Architecture</span>
    </div>
    <h1
      class="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground"
    >
      NovWrite Authoring Workspace
    </h1>
    <p class="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
      Professional fictional universe design studio powered by deterministic event folding, 1st-Class Blueprints, AST formulas, and causal timeline auditing.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
          <span>Branch: novel</span>
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
          <span>Branch: world</span>
          <span
            class="text-destructive flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium"
          >
            Open Studio <ArrowRight class="w-3.5 h-3.5" />
          </span>
        </CardFooter>
      </Card>
    </a>
  </div>

  <!-- Workspace Status Footer -->
  <Card class="p-4 border-border bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1.5 text-foreground font-medium">
        <Database class="w-4 h-4 text-primary" /> PostgreSQL 18
      </span>
      <span class="flex items-center gap-1.5 text-foreground font-medium">
        <Layers class="w-4 h-4 text-destructive" /> Redis 7
      </span>
    </div>
    <span class="text-muted-foreground">NovWrite v2.0 Architecture</span>
  </Card>
</div>
