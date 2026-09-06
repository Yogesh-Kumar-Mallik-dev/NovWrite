<script lang="ts">
  import {
    AlertTriangle,
    RefreshCw,
    Home,
    ShieldAlert,
    Copy,
    Check,
    Terminal,
    ChevronDown,
    ChevronUp,
    Sparkles,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { toast } from "$lib/stores/toastStore.svelte";
  import { page } from "$app/state";

  interface Props {
    statusCode?: number;
    message?: string;
    errorStack?: string;
  }

  let { statusCode = 500, message, errorStack }: Props = $props();

  let isDetailsOpen = $state(false);
  let isCopied = $state(false);

  const errorTimestamp = new Date().toISOString();
  const errorMessage = $derived(
    message ||
      "An unexpected anomaly halted the deterministic event folding engine. The universe state has encountered an unresolvable invariant conflict."
  );

  const diagnosticPayload = $derived(
    JSON.stringify(
      {
        status: statusCode,
        fault: "CONTINUITY_INVARIANT_BREACH",
        message: errorMessage,
        path: page.url.pathname,
        timestamp: errorTimestamp,
        pipeline: "AST_EVAL -> CAUSAL_FOLD -> HYDRATION_RENDER",
        stack: errorStack || "InternalParadox: Invariant evaluation interrupted by unhandled runtime exception.",
      },
      null,
      2
    )
  );

  async function handleCopyDiagnostics() {
    try {
      await navigator.clipboard.writeText(diagnosticPayload);
      isCopied = true;
      toast.success(
        "Diagnostics Copied",
        "Error trace copied to clipboard for debugging."
      );
      setTimeout(() => {
        isCopied = false;
      }, 3000);
    } catch {
      toast.info("Diagnostics", diagnosticPayload.slice(0, 100));
    }
  }

  function handleReload() {
    window.location.reload();
  }
</script>

<div class="relative flex-1 flex items-center justify-center p-6 md:p-12 overflow-hidden min-h-[calc(100vh-8rem)]">
  <!-- Subtle Amber / Destructive Ambient Glow Orbs -->
  <div
    class="absolute -top-32 -left-32 w-96 h-96 bg-destructive/15 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>
  <div
    class="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>

  <div class="relative max-w-2xl w-full flex flex-col items-center text-center space-y-8 z-10">
    <!-- Status Badge -->
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono font-medium shadow-xs animate-in fade-in slide-in-from-top-3 duration-500">
      <AlertTriangle class="w-3.5 h-3.5" />
      <span>INVARIANT FAILURE · ERROR {statusCode}</span>
    </div>

    <!-- Giant Hero Number with Thematic Style -->
    <div class="relative select-none">
      <span
        class="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-foreground via-foreground/70 to-destructive/40 bg-clip-text text-transparent opacity-90 font-mono"
      >
        {statusCode}
      </span>
      <div
        class="absolute inset-0 flex items-center justify-center text-destructive/20 blur-xl text-8xl sm:text-9xl font-black font-mono select-none -z-10"
        aria-hidden="true"
      >
        {statusCode}
      </div>
    </div>

    <!-- Headline and Description -->
    <div class="space-y-3 max-w-lg mx-auto">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Continuity Invariant Collapse
      </h1>
      <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {errorMessage}
      </p>
    </div>

    <!-- Action Navigation Buttons -->
    <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
      <Button onclick={handleReload} variant="default" size="lg" class="shadow-sm gap-2">
        <RefreshCw class="w-4 h-4" />
        Recalibrate Timeline
      </Button>
      <Button href="/" variant="outline" size="lg" class="gap-2 hover:bg-muted">
        <Home class="w-4 h-4" />
        Return to Safety
      </Button>
      <Button href="/world/audit" variant="secondary" size="lg" class="gap-2">
        <ShieldAlert class="w-4 h-4 text-destructive" />
        Continuity Audit
      </Button>
      <Button
        onclick={handleCopyDiagnostics}
        variant="ghost"
        size="lg"
        class="gap-2 text-muted-foreground hover:text-foreground"
      >
        {#if isCopied}
          <Check class="w-4 h-4 text-emerald-500" />
          <span class="text-emerald-500">Copied!</span>
        {:else}
          <Copy class="w-4 h-4" />
          <span>Copy Diagnostics</span>
        {/if}
      </Button>
    </div>

    <!-- Collapsible Continuum Diagnostic Trace Card -->
    <Card class="w-full text-left bg-card/60 backdrop-blur border-border/80 shadow-xs font-mono text-xs overflow-hidden">
      <button
        type="button"
        onclick={() => (isDetailsOpen = !isDetailsOpen)}
        class="w-full flex items-center justify-between p-4 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer select-none"
      >
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-destructive" />
          <span class="font-semibold text-foreground">Quantum Anomaly Diagnostic Trace</span>
        </div>
        <div class="flex items-center gap-2 text-[11px]">
          <span class="text-destructive font-mono">ERR_STATE_INVARIANT</span>
          {#if isDetailsOpen}
            <ChevronUp class="w-4 h-4" />
          {:else}
            <ChevronDown class="w-4 h-4" />
          {/if}
        </div>
      </button>

      {#if isDetailsOpen}
        <div class="p-4 pt-2 border-t border-border/60 bg-muted/40 space-y-3 animate-in fade-in duration-200">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground text-[10px]">
              TIMESTAMP: {errorTimestamp}
            </span>
            <button
              type="button"
              onclick={handleCopyDiagnostics}
              class="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-sans"
            >
              {#if isCopied}
                <Check class="w-3 h-3 text-emerald-500" /> Copied
              {:else}
                <Copy class="w-3 h-3" /> Copy JSON
              {/if}
            </button>
          </div>

          <pre
            class="p-3 rounded-md bg-background/80 border border-border text-[11px] leading-relaxed text-muted-foreground overflow-x-auto selection:bg-primary/20"
          ><code>{diagnosticPayload}</code></pre>
        </div>
      {/if}
    </Card>
  </div>
</div>
