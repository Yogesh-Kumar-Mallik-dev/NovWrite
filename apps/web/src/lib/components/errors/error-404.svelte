<script lang="ts">
  import {
    Compass,
    Home,
    ArrowLeft,
    Globe2,
    BookOpen,
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

<div class="relative flex-1 flex flex-col items-center justify-center py-16 md:py-24 px-6 md:px-12 overflow-hidden min-h-[calc(100vh-8rem)]">
  <!-- Subtle Ambient Glow Orbs -->
  <div
    class="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>
  <div
    class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>

  <div class="relative max-w-2xl w-full flex flex-col items-center text-center space-y-10 md:space-y-12 z-10">
    <!-- Status Badge -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-medium shadow-xs animate-in fade-in slide-in-from-top-3 duration-500">
      <Compass class="w-4 h-4 animate-spin-slow" />
      <span>TIMELINE PARADOX · ERROR 404</span>
    </div>

    <!-- Giant Hero Number with Generous Vertical Space -->
    <div class="relative select-none my-2 md:my-4">
      <span
        class="text-8xl sm:text-9xl md:text-[10rem] font-black tracking-tighter bg-gradient-to-b from-foreground via-foreground/75 to-foreground/20 bg-clip-text text-transparent opacity-90 font-mono leading-none"
      >
        404
      </span>
      <div
        class="absolute inset-0 flex items-center justify-center text-primary/20 blur-xl text-8xl sm:text-9xl md:text-[10rem] font-black font-mono select-none -z-10 leading-none"
        aria-hidden="true"
      >
        404
      </div>
    </div>

    <!-- Headline and Description -->
    <div class="space-y-4 max-w-lg mx-auto">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Timeline Branch Not Found
      </h1>
      <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {message ||
          "The requested entity, blueprint archetype, or manuscript scene does not exist in the active canon index. The timeline coordinates may have shifted or the page was never created."}
      </p>
    </div>

    <!-- Action Navigation Buttons with comfortable spacing -->
    <div class="flex flex-wrap items-center justify-center gap-3.5 pt-2">
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

    <!-- Continuum Diagnostics Card with generous padding -->
    <Card class="w-full text-left p-5 md:p-6 bg-card/60 backdrop-blur border-border/80 shadow-xs font-mono text-xs space-y-3.5 mt-4">
      <div class="flex items-center justify-between text-muted-foreground border-b border-border/60 pb-3">
        <div class="flex items-center gap-2">
          <FileQuestion class="w-4 h-4 text-primary" />
          <span class="font-semibold text-foreground text-xs">Canon Navigation Inspector</span>
        </div>
        <span class="text-[10px] text-muted-foreground/80 px-2 py-0.5 rounded bg-muted/60">
          STATUS: UNRESOLVED_BRANCH
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-muted-foreground">
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
