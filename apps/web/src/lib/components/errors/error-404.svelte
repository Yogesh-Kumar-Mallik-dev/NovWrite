<script lang="ts">
  import {
    Compass,
    Home,
    ArrowLeft,
    Globe2,
    BookOpen,
    ArrowRight,
    FileQuestion,
    Layers,
    Sparkles,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { page } from "$app/state";

  interface Props {
    customPath?: string;
    message?: string;
  }

  let { customPath, message }: Props = $props();

  const currentPath = $derived(customPath || page.url.pathname);
</script>

<div class="relative flex-1 flex flex-col justify-center items-center py-16 md:py-24 px-6 md:px-12 overflow-hidden min-h-[calc(100vh-8rem)]">
  <!-- Subtle Ambient Glow Orbs -->
  <div
    class="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>
  <div
    class="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>

  <div class="relative max-w-3xl w-full flex flex-col items-center text-center space-y-12 z-10">
    <!-- Hero Header Section with ample spacing -->
    <div class="space-y-6 flex flex-col items-center">
      <!-- Status Badge -->
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-medium shadow-xs">
        <Compass class="w-4 h-4 animate-spin-slow" />
        <span>TIMELINE PARADOX · 404 NOT FOUND</span>
      </div>

      <!-- Giant Hero Number with Thematic Depth -->
      <div class="relative select-none my-2">
        <span
          class="text-9xl sm:text-[11rem] font-black tracking-tighter bg-gradient-to-b from-foreground via-foreground/75 to-foreground/15 bg-clip-text text-transparent font-mono leading-none"
        >
          404
        </span>
        <div
          class="absolute inset-0 flex items-center justify-center text-primary/15 blur-2xl text-9xl sm:text-[11rem] font-black font-mono select-none -z-10 leading-none"
          aria-hidden="true"
        >
          404
        </div>
      </div>

      <!-- Headline and Description -->
      <div class="space-y-3 max-w-xl mx-auto">
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Timeline Branch Not Found
        </h1>
        <p class="text-base text-muted-foreground leading-relaxed">
          {message ||
            "The requested entity, blueprint archetype, or manuscript scene does not exist in the active canon index. The timeline coordinates may have shifted or the record was never authored."}
        </p>
      </div>
    </div>

    <!-- Primary Action Buttons -->
    <div class="flex flex-wrap items-center justify-center gap-4">
      <Button href="/" variant="default" size="lg" class="shadow-sm gap-2 px-6 h-11 text-sm">
        <Home class="w-4 h-4" />
        Return to Home Hub
      </Button>
      <Button
        onclick={() => history.back()}
        variant="outline"
        size="lg"
        class="gap-2 px-6 h-11 text-sm hover:bg-muted"
      >
        <ArrowLeft class="w-4 h-4" />
        Go Back
      </Button>
    </div>

    <!-- Quick Studio Gateways (Spacious Grid) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 w-full text-left pt-2">
      <a
        href="/world"
        class="group block transition-transform hover:-translate-y-0.5"
      >
        <Card class="h-full border-border bg-card hover:border-primary/50 transition-all p-5 shadow-xs">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
              <Globe2 class="w-5 h-5" />
            </div>
            <div class="space-y-1 flex-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-foreground group-hover:text-primary transition-colors text-base">
                  World Studio
                </span>
                <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">
                Explore 1st-Class Blueprints, Entity instances, AST formulas, and causal timeline auditing.
              </p>
            </div>
          </div>
        </Card>
      </a>

      <a
        href="/novel"
        class="group block transition-transform hover:-translate-y-0.5"
      >
        <Card class="h-full border-border bg-card hover:border-primary/50 transition-all p-5 shadow-xs">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
              <BookOpen class="w-5 h-5" />
            </div>
            <div class="space-y-1 flex-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-foreground group-hover:text-primary transition-colors text-base">
                  Prose Studio
                </span>
                <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">
                Open dedicated novel manuscript editor, chapter tree, and lore lookup drawers.
              </p>
            </div>
          </div>
        </Card>
      </a>
    </div>

    <!-- Diagnostic Details Card (Generous Padding & Clear Structure) -->
    <Card class="w-full text-left p-6 bg-card/60 backdrop-blur border-border shadow-xs font-mono text-xs space-y-4">
      <div class="flex items-center justify-between text-muted-foreground border-b border-border/80 pb-3">
        <div class="flex items-center gap-2.5">
          <FileQuestion class="w-4 h-4 text-primary" />
          <span class="font-semibold text-foreground text-sm">Canon Navigation Diagnostic</span>
        </div>
        <span class="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-medium">
          STATUS 404
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-muted-foreground">
        <div class="space-y-1">
          <span class="text-[11px] text-foreground/60 uppercase tracking-wider block">Lookup Route</span>
          <span class="text-primary font-semibold truncate block max-w-full">
            {currentPath}
          </span>
        </div>

        <div class="space-y-1">
          <span class="text-[11px] text-foreground/60 uppercase tracking-wider block">Canon Sync</span>
          <span class="text-emerald-500 font-medium block">CONTINUUM_STABLE</span>
        </div>

        <div class="space-y-1">
          <span class="text-[11px] text-foreground/60 uppercase tracking-wider block">Fault Code</span>
          <span class="text-amber-500 font-medium block">ERR_UNRESOLVED_TIMELINE_SECTOR</span>
        </div>

        <div class="space-y-1">
          <span class="text-[11px] text-foreground/60 uppercase tracking-wider block">Integrity State</span>
          <span class="text-foreground font-medium block">100% Invariant Compliant</span>
        </div>
      </div>
    </Card>
  </div>
</div>
