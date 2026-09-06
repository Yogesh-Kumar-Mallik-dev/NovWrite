<script lang="ts">
  import {
    Compass,
    Home,
    ArrowLeft,
    Globe2,
    BookOpen,
    Search,
    Clock,
    Layers,
    FileQuestion,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { page } from "$app/state";

  interface Props {
    customPath?: string;
    message?: string;
  }

  let { customPath, message }: Props = $props();

  const currentPath = $derived(customPath || page.url.pathname);
</script>

<div class="relative flex-1 flex items-center justify-center p-6 md:p-12 overflow-hidden min-h-[calc(100vh-8rem)]">
  <!-- Subtle Ambient Glow Orbs -->
  <div
    class="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>
  <div
    class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>

  <div class="relative max-w-2xl w-full flex flex-col items-center text-center space-y-8 z-10">
    <!-- Status Badge -->
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-medium shadow-xs animate-in fade-in slide-in-from-top-3 duration-500">
      <Compass class="w-3.5 h-3.5 animate-spin-slow" />
      <span>TIMELINE PARADOX · ERROR 404</span>
    </div>

    <!-- Giant Hero Number with Thematic Style -->
    <div class="relative select-none">
      <span
        class="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-foreground via-foreground/70 to-foreground/20 bg-clip-text text-transparent opacity-90 font-mono"
      >
        404
      </span>
      <div
        class="absolute inset-0 flex items-center justify-center text-primary/20 blur-xl text-8xl sm:text-9xl font-black font-mono select-none -z-10"
        aria-hidden="true"
      >
        404
      </div>
    </div>

    <!-- Headline and Description -->
    <div class="space-y-3 max-w-lg mx-auto">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Timeline Branch Not Found
      </h1>
      <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {message ||
          "The requested entity, blueprint archetype, or manuscript scene does not exist in the active canon index. The timeline coordinates may have shifted or the page was never created."}
      </p>
    </div>

    <!-- Action Navigation Buttons -->
    <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
      <Button href="/" variant="default" size="lg" class="shadow-sm gap-2">
        <Home class="w-4 h-4" />
        Return to Home Hub
      </Button>
      <Button
        onclick={() => history.back()}
        variant="outline"
        size="lg"
        class="gap-2 hover:bg-muted"
      >
        <ArrowLeft class="w-4 h-4" />
        Go Back
      </Button>
      <Button href="/world" variant="secondary" size="lg" class="gap-2">
        <Globe2 class="w-4 h-4 text-primary" />
        World Studio
      </Button>
      <Button href="/novel" variant="secondary" size="lg" class="gap-2">
        <BookOpen class="w-4 h-4 text-primary" />
        Prose Studio
      </Button>
    </div>

    <!-- Continuum Diagnostics Card -->
    <Card class="w-full text-left p-4 bg-card/60 backdrop-blur border-border/80 shadow-xs font-mono text-xs space-y-2">
      <div class="flex items-center justify-between text-muted-foreground border-b border-border/60 pb-2">
        <div class="flex items-center gap-2">
          <FileQuestion class="w-3.5 h-3.5 text-primary" />
          <span class="font-semibold text-foreground">Canon Navigation Inspector</span>
        </div>
        <span class="text-[10px] text-muted-foreground/80">STATUS: UNRESOLVED_BRANCH</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-muted-foreground">
        <div>
          <span class="text-foreground/70">Lookup Path: </span>
          <span class="text-primary font-semibold truncate inline-block max-w-[200px] align-bottom">
            {currentPath}
          </span>
        </div>
        <div>
          <span class="text-foreground/70">Canon Sync: </span>
          <span class="text-emerald-500 font-medium">STABLE</span>
        </div>
        <div>
          <span class="text-foreground/70">Fault Type: </span>
          <span class="text-amber-500">NULL_POINTER_CHRONICLE</span>
        </div>
        <div>
          <span class="text-foreground/70">Causal Integrity: </span>
          <span class="text-foreground font-medium">100% (No Collateral)</span>
        </div>
      </div>
    </Card>
  </div>
</div>
