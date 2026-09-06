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
    Globe2,
    ArrowRight,
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
        stack:
          errorStack ||
          "InternalParadox: Invariant evaluation interrupted by unhandled runtime exception.",
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

<div class="relative flex-1 flex flex-col justify-center items-center py-16 md:py-24 px-6 md:px-12 overflow-hidden min-h-[calc(100vh-8rem)]">
  <!-- Subtle Amber / Destructive Ambient Glow Orbs -->
  <div
    class="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-destructive/15 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>
  <div
    class="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>

  <div class="relative max-w-3xl w-full flex flex-col items-center text-center space-y-12 z-10">
    <!-- Hero Header Section with ample spacing -->
    <div class="space-y-6 flex flex-col items-center">
      <!-- Status Badge -->
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono font-medium shadow-xs">
        <AlertTriangle class="w-4 h-4" />
        <span>INVARIANT FAILURE · ERROR {statusCode}</span>
      </div>

      <!-- Giant Hero Number with Thematic Depth -->
      <div class="relative select-none my-2">
        <span
          class="text-9xl sm:text-[11rem] font-black tracking-tighter bg-gradient-to-b from-foreground via-foreground/75 to-destructive/40 bg-clip-text text-transparent font-mono leading-none"
        >
          {statusCode}
        </span>
        <div
          class="absolute inset-0 flex items-center justify-center text-destructive/20 blur-2xl text-9xl sm:text-[11rem] font-black font-mono select-none -z-10 leading-none"
          aria-hidden="true"
        >
          {statusCode}
        </div>
      </div>

      <!-- Headline and Description -->
      <div class="space-y-3 max-w-xl mx-auto">
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Continuity Invariant Collapse
        </h1>
        <p class="text-base text-muted-foreground leading-relaxed">
          {errorMessage}
        </p>
      </div>
    </div>

    <!-- Primary Action Buttons -->
    <div class="flex flex-wrap items-center justify-center gap-4">
      <Button
        onclick={handleReload}
        variant="default"
        size="lg"
        class="shadow-sm gap-2 px-6 h-11 text-sm"
      >
        <RefreshCw class="w-4 h-4" />
        Recalibrate Timeline (Reload)
      </Button>
      <Button
        href="/"
        variant="outline"
        size="lg"
        class="gap-2 px-6 h-11 text-sm hover:bg-muted"
      >
        <Home class="w-4 h-4" />
        Return to Home Hub
      </Button>
      <Button
        href="/world/audit"
        variant="secondary"
        size="lg"
        class="gap-2 px-6 h-11 text-sm"
      >
        <ShieldAlert class="w-4 h-4 text-destructive" />
        Continuity Audit
      </Button>
    </div>

    <!-- Diagnostic Details Card (Generous Padding & Expandable Console) -->
    <Card class="w-full text-left bg-card/60 backdrop-blur border-border shadow-xs font-mono text-xs overflow-hidden">
      <button
        type="button"
        onclick={() => (isDetailsOpen = !isDetailsOpen)}
        class="w-full flex items-center justify-between p-6 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer select-none"
      >
        <div class="flex items-center gap-2.5">
          <Terminal class="w-4 h-4 text-destructive" />
          <span class="font-semibold text-foreground text-sm">
            Quantum Anomaly Diagnostic Console
          </span>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="text-destructive font-mono font-medium">ERR_STATE_INVARIANT</span>
          {#if isDetailsOpen}
            <ChevronUp class="w-4 h-4" />
          {:else}
            <ChevronDown class="w-4 h-4" />
          {/if}
        </div>
      </button>

      {#if isDetailsOpen}
        <div class="p-6 pt-0 border-t border-border/70 bg-muted/30 space-y-4 animate-in fade-in duration-200">
          <div class="flex items-center justify-between pt-4">
            <span class="text-muted-foreground text-[11px]">
              TIMESTAMP: {errorTimestamp}
            </span>
            <button
              type="button"
              onclick={handleCopyDiagnostics}
              class="text-xs text-primary hover:underline flex items-center gap-1.5 cursor-pointer font-sans font-medium"
            >
              {#if isCopied}
                <Check class="w-3.5 h-3.5 text-emerald-500" />
                <span class="text-emerald-500">Copied to Clipboard</span>
              {:else}
                <Copy class="w-3.5 h-3.5" />
                <span>Copy Trace JSON</span>
              {/if}
            </button>
          </div>

          <pre
            class="p-4 rounded-lg bg-background/90 border border-border text-[11px] leading-relaxed text-muted-foreground overflow-x-auto selection:bg-primary/20"
          ><code>{diagnosticPayload}</code></pre>
        </div>
      {/if}
    </Card>
  </div>
</div>
