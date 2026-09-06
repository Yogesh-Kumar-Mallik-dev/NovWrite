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

  function highlightJson(jsonStr: string): string {
    if (!jsonStr) return "";
    const escaped = jsonStr
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-600 dark:text-amber-400"; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            const key = match.slice(0, match.lastIndexOf('"') + 1);
            const trailing = match.slice(match.lastIndexOf('"') + 1);
            return `<span class="text-sky-600 dark:text-sky-400 font-semibold">${key}</span><span class="text-muted-foreground">${trailing}</span>`;
          } else {
            return `<span class="text-emerald-600 dark:text-emerald-400">${match}</span>`;
          }
        } else if (/true|false/.test(match)) {
          cls = "text-rose-600 dark:text-rose-400 font-bold";
        } else if (/null/.test(match)) {
          cls = "text-purple-600 dark:text-purple-400 font-bold";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }

  const highlightedDiagnostics = $derived(highlightJson(diagnosticPayload));

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

<div class="relative flex-1 flex flex-col items-center justify-center py-16 md:py-24 px-6 md:px-12 overflow-hidden min-h-[calc(100vh-8rem)]">
  <!-- Subtle Amber / Destructive Ambient Glow Orbs -->
  <div
    class="absolute -top-32 -left-32 w-96 h-96 bg-destructive/15 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>
  <div
    class="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
    aria-hidden="true"
  ></div>

  <div class="relative max-w-2xl w-full flex flex-col items-center text-center space-y-10 md:space-y-12 z-10">
    <!-- Status Badge -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono font-medium shadow-xs animate-in fade-in slide-in-from-top-3 duration-500">
      <AlertTriangle class="w-4 h-4" />
      <span>INVARIANT FAILURE · ERROR {statusCode}</span>
    </div>

    <!-- Giant Hero Number with Generous Vertical Space -->
    <div class="relative select-none my-2 md:my-4">
      <span
        class="text-8xl sm:text-9xl md:text-[10rem] font-black tracking-tighter bg-gradient-to-b from-foreground via-foreground/75 to-destructive/40 bg-clip-text text-transparent opacity-90 font-mono leading-none"
      >
        {statusCode}
      </span>
      <div
        class="absolute inset-0 flex items-center justify-center text-destructive/20 blur-xl text-8xl sm:text-9xl md:text-[10rem] font-black font-mono select-none -z-10 leading-none"
        aria-hidden="true"
      >
        {statusCode}
      </div>
    </div>

    <!-- Headline and Description -->
    <div class="space-y-4 max-w-lg mx-auto">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Continuity Invariant Collapse
      </h1>
      <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {errorMessage}
      </p>
    </div>

    <!-- Action Navigation Buttons with comfortable spacing -->
    <div class="flex flex-wrap items-center justify-center gap-3.5 pt-2">
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

    <!-- Collapsible Continuum Diagnostic Trace Card with generous padding -->
    <Card class="w-full text-left bg-card/60 backdrop-blur border-border/80 shadow-xs font-mono text-xs overflow-hidden mt-4">
      <button
        type="button"
        onclick={() => (isDetailsOpen = !isDetailsOpen)}
        class="w-full flex items-center justify-between p-5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer select-none"
      >
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-destructive" />
          <span class="font-semibold text-foreground text-xs">Quantum Anomaly Diagnostic Trace</span>
        </div>
        <div class="flex items-center gap-2 text-[11px]">
          <span class="text-destructive font-mono font-medium">ERR_STATE_INVARIANT</span>
          {#if isDetailsOpen}
            <ChevronUp class="w-4 h-4" />
          {:else}
            <ChevronDown class="w-4 h-4" />
          {/if}
        </div>
      </button>

      {#if isDetailsOpen}
        <div class="p-5 pt-0 border-t border-border/60 bg-muted/40 space-y-3.5 animate-in fade-in duration-200">
          <div class="flex items-center justify-between pt-4">
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
            class="p-4 rounded-md bg-background/90 border border-border text-[11px] sm:text-xs leading-relaxed font-mono whitespace-pre-wrap break-words [word-break:break-word] overflow-hidden selection:bg-primary/20 text-foreground/80 max-w-full"
          ><code>{@html highlightedDiagnostics}</code></pre>
        </div>
      {/if}
    </Card>
  </div>
</div>
