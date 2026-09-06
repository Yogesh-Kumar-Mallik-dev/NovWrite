<script lang="ts">
  import {
    AlertOctagon,
    CheckCircle2,
    ShieldAlert,
    Sparkles,
    Key,
    Check,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    History,
    Wrench,
    ExternalLink,
    X,
    ShieldCheck,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Card } from "$lib/components/ui/card";
  import { EmptyState } from "$lib/components/ui";
  import { toast } from "$lib/stores/toastStore.svelte";
  import {
    worldStore,
    type ContinuityViolationItem,
    type RuleSeverity,
  } from "$lib/stores/worldStore.svelte";

  // Filter State
  let statusFilter = $state<"ALL" | "ACTIVE" | "OVERRIDDEN">("ALL");

  // Modal State
  let activeOverrideViolation = $state<ContinuityViolationItem | null>(null);
  let justificationInput = $state("");
  let authorNameInput = $state("Lead Author");
  let actionSuccessMessage = $state<string | null>(null);
  let isAuditing = $state(false);

  // Derived filtered violations
  const filteredViolations = $derived(
    worldStore.violations.filter((v: ContinuityViolationItem) => {
      if (statusFilter === "ACTIVE") return !v.overridden;
      if (statusFilter === "OVERRIDDEN") return !!v.overridden;
      return true;
    }),
  );

  // Health Metrics
  const totalViolationsCount = $derived(worldStore.violations.length);
  const activeBlockingCount = $derived(
    worldStore.violations.filter(
      (v: ContinuityViolationItem) => !v.overridden && v.severity === "BLOCKING_ERROR",
    ).length,
  );
  const activeWarningCount = $derived(
    worldStore.violations.filter(
      (v: ContinuityViolationItem) => !v.overridden && v.severity === "WARNING",
    ).length,
  );
  const overriddenCount = $derived(
    worldStore.violations.filter((v: ContinuityViolationItem) => !!v.overridden).length,
  );

  function triggerAuditRun() {
    isAuditing = true;
    setTimeout(() => {
      worldStore.runContinuityAudit();
      isAuditing = false;
      toast.success("Audit Complete", "Causal state graph synchronized with manuscript.");
      showNotification("Continuity audit complete. Causal state graph synchronized.");
    }, 600);
  }

  function openOverrideModal(viol: ContinuityViolationItem) {
    activeOverrideViolation = viol;
    justificationInput = "";
    authorNameInput = "Lead Author";
  }

  function handleExecuteOverride() {
    if (!activeOverrideViolation || !justificationInput.trim()) return;

    worldStore.overrideViolation(
      activeOverrideViolation.id,
      justificationInput.trim(),
      authorNameInput.trim() || "Lead Author",
    );

    toast.warning(
      "Invariant Overridden",
      `Lead Author Override logged for ${activeOverrideViolation.code}.`,
    );
    showNotification(
      `Lead Author Override logged for ${activeOverrideViolation.code}. Audit entry recorded.`,
    );
    activeOverrideViolation = null;
  }

  function handleReconcile(viol: ContinuityViolationItem, actionType: string) {
    const success = worldStore.reconcileViolation(viol.id, actionType);
    if (success) {
      if (actionType === "AUTO_LOG_BREAKTHROUGH") {
        toast.success("Auto-Reconciled", `Breakthrough event injected into timeline for ${viol.entityName}.`);
        showNotification(
          `Auto-reconciled: Breakthrough event injected into timeline for ${viol.entityName}.`,
        );
      } else if (actionType === "AUTO_LINK_RELATIONAL_WEAPON") {
        toast.success("Auto-Reconciled", `Bound relational weapon link established for ${viol.entityName}.`);
        showNotification(
          `Auto-reconciled: Bound relational weapon link established for ${viol.entityName}.`,
        );
      } else {
        toast.info("Violation Dismissed", "Continuity violation dismissed.");
        showNotification("Violation dismissed.");
      }
    }
  }

  function handleDismiss(id: string) {
    worldStore.dismissViolation(id);
    toast.info("Violation Dismissed", "Continuity violation dismissed from active list.");
    showNotification("Continuity violation dismissed.");
  }

  function showNotification(msg: string) {
    actionSuccessMessage = msg;
    setTimeout(() => {
      actionSuccessMessage = null;
    }, 4500);
  }
</script>

<div class="space-y-6 transition-colors">
  <!-- Header & Primary Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
        <AlertOctagon class="w-5 h-5 text-destructive" />
        <span>Continuity Violation & RFC 7807 Audit Console</span>
      </h2>
      <p class="text-xs text-muted-foreground mt-0.5">
        Deterministic contradiction detector cross-referencing drafted manuscript scenes with causal state transitions.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isAuditing}
        onclick={triggerAuditRun}
        class="h-8 text-xs flex items-center gap-1.5"
      >
        <RefreshCw class="w-3.5 h-3.5 {isAuditing ? 'animate-spin text-primary' : 'text-muted-foreground'}" />
        <span>{isAuditing ? "Auditing State..." : "Re-Run Audit"}</span>
      </Button>
    </div>
  </div>

  <!-- Notification Banner -->
  {#if actionSuccessMessage}
    <div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium shadow-xs">
      <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>{actionSuccessMessage}</span>
    </div>
  {/if}

  <!-- Audit Health Metrics Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <Card class="p-3.5 space-y-1 {activeBlockingCount > 0 ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'} shadow-xs">
      <span class="text-[10px] font-mono text-destructive uppercase tracking-wider flex items-center gap-1">
        <ShieldAlert class="w-3.5 h-3.5" />
        <span>Blocking Invariants</span>
      </span>
      <p class="text-2xl font-bold {activeBlockingCount > 0 ? 'text-destructive' : 'text-muted-foreground'}">{activeBlockingCount}</p>
    </Card>

    <Card class="p-3.5 space-y-1 border-amber-500/30 bg-amber-500/5 shadow-xs">
      <span class="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
        <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
        <span>Active Warnings</span>
      </span>
      <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{activeWarningCount}</p>
    </Card>

    <Card class="p-3.5 space-y-1 border-border bg-card shadow-xs">
      <span class="text-[10px] font-mono text-primary uppercase tracking-wider flex items-center gap-1">
        <Key class="w-3.5 h-3.5" />
        <span>Lead Author Overrides</span>
      </span>
      <p class="text-2xl font-bold text-primary">{overriddenCount}</p>
    </Card>

    <Card class="p-3.5 space-y-1 border-border bg-card shadow-xs">
      <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
        <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
        <span>Audit Graph Status</span>
      </span>
      <p class="text-xs font-mono font-bold {activeBlockingCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'} pt-1.5">
        {activeBlockingCount === 0 ? "CONTINUITY INTACT" : "CONTRADICTIONS FOUND"}
      </p>
    </Card>
  </div>

  <!-- Filter Strip -->
  <div class="flex items-center justify-between bg-muted/40 p-2.5 rounded-lg border border-border">
    <div class="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
      <span class="mr-2">Filter Violations:</span>
      <button
        type="button"
        onclick={() => (statusFilter = "ALL")}
        class="px-2.5 py-1 rounded-md text-xs transition {statusFilter === 'ALL' ? 'bg-background text-foreground font-bold border border-border shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
      >
        All ({totalViolationsCount})
      </button>
      <button
        type="button"
        onclick={() => (statusFilter = "ACTIVE")}
        class="px-2.5 py-1 rounded-md text-xs transition {statusFilter === 'ACTIVE' ? 'bg-destructive/10 border border-destructive/30 text-destructive font-bold' : 'text-muted-foreground hover:text-foreground'}"
      >
        Active ({activeBlockingCount + activeWarningCount})
      </button>
      <button
        type="button"
        onclick={() => (statusFilter = "OVERRIDDEN")}
        class="px-2.5 py-1 rounded-md text-xs transition {statusFilter === 'OVERRIDDEN' ? 'bg-primary/10 border border-primary/30 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}"
      >
        Overridden ({overriddenCount})
      </button>
    </div>

    <span class="text-[11px] font-mono text-muted-foreground hidden sm:inline">
      RFC 7807 Problem Details Spec Active
    </span>
  </div>

  <!-- Violations List -->
  <div class="space-y-4">
    {#if filteredViolations.length === 0}
      <EmptyState
        icon={ShieldCheck}
        title={statusFilter === 'ACTIVE' ? "Zero Active Violations" : statusFilter === 'OVERRIDDEN' ? "No Overridden Violations" : "100% Continuity Intact"}
        description={statusFilter === 'ACTIVE'
          ? "All active narrative scene state transitions comply with your universe invariant rules and causal delta logs."
          : statusFilter === 'OVERRIDDEN'
            ? "No editorial overrides have been recorded for this universe."
            : "No contradictions or invariant rule violations found across any narrative scenes or causal events."}
        actionText="Re-Run Continuity Audit"
        onAction={triggerAuditRun}
      />
    {/if}

    {#each filteredViolations as viol}
      <Card
        class="border-border bg-card {viol.overridden
          ? 'opacity-65'
          : viol.severity === 'BLOCKING_ERROR'
            ? 'border-destructive/40 bg-destructive/5'
            : 'border-amber-500/40 bg-amber-500/5'} p-5 space-y-4 shadow-xs transition-colors"
      >
        <!-- Card Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3.5">
          <div class="flex items-start gap-3">
            <div class="mt-0.5">
              {#if viol.overridden}
                <CheckCircle class="w-5 h-5 text-muted-foreground" />
              {:else if viol.severity === "BLOCKING_ERROR"}
                <AlertOctagon class="w-5 h-5 text-destructive" />
              {:else}
                <AlertTriangle class="w-5 h-5 text-amber-500" />
              {/if}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs font-bold {viol.overridden ? 'text-muted-foreground' : viol.severity === 'BLOCKING_ERROR' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}">
                  {viol.code}
                </span>
                <span class="text-muted-foreground/50">·</span>
                <span class="text-xs font-semibold text-foreground font-mono">
                  Rule: {viol.ruleName}
                </span>
              </div>
              <p class="text-xs text-foreground/90 font-medium mt-0.5">
                {viol.sceneTitle} (Sequence #{viol.sequenceNumber})
              </p>
            </div>
          </div>

          <!-- Status Indicator & Actions -->
          <div class="flex flex-wrap items-center gap-2">
            {#if viol.overridden}
              <div class="px-2.5 py-1 rounded-md bg-muted border border-border text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <Key class="w-3.5 h-3.5 text-primary" />
                <span>OVERRIDDEN BY {viol.overriddenBy || "LEAD AUTHOR"}</span>
              </div>
            {:else}
              {#if viol.severity === "BLOCKING_ERROR"}
                <span class="inline-flex items-center gap-1 text-xs font-mono text-destructive font-semibold px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                  <ShieldAlert class="w-3.5 h-3.5" />
                  BLOCKING ERROR
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle class="w-3.5 h-3.5" />
                  WARNING
                </span>
              {/if}

              <Button
                variant="destructive"
                size="sm"
                onclick={() => openOverrideModal(viol)}
                class="h-7 text-xs flex items-center gap-1"
              >
                <Key class="w-3 h-3" />
                <span>Override</span>
              </Button>
            {/if}
          </div>
        </div>

        <!-- Violation Message -->
        <p class="text-xs text-foreground/90 leading-relaxed font-sans">{viol.message}</p>

        <!-- Problem Detail Breakdown Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
            <span class="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Target Entity</span>
            <p class="text-foreground font-bold">{viol.entityName}</p>
            <span class="text-muted-foreground text-[10px] block">Property: {viol.property}</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
            <span class="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">Expected Invariant Bound</span>
            <p class="text-emerald-700 dark:text-emerald-300 font-bold">{viol.expectedValue}</p>
          </div>

          <div class="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-1">
            <span class="text-destructive text-[10px] uppercase tracking-wider font-semibold">Calculated State at Scene</span>
            <p class="text-destructive font-bold">{viol.calculatedValue}</p>
          </div>
        </div>

        <!-- Historical Causal Traceback (if available) -->
        {#if viol.historicalCausalEventTitle}
          <div class="p-2.5 rounded-lg bg-muted/60 border border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
            <div class="flex items-center gap-2">
              <History class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Historical Causal Origin:</span>
              <strong class="text-foreground">{viol.historicalCausalEventTitle}</strong>
              <span class="text-primary font-bold">(Seq #{viol.historicalCausalSequence})</span>
            </div>
            <span class="text-[10px] text-muted-foreground">Root Mutation Anchor</span>
          </div>
        {/if}

        <!-- One-Click Reconciliations (if not overridden) -->
        {#if !viol.overridden}
          <div class="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Wrench class="w-3.5 h-3.5 text-primary" />
                <span>Suggested Quick-Fix:</span>
              </span>
              <span class="text-xs text-foreground/80 font-sans">{viol.suggestedResolution}</span>
            </div>

            <div class="flex items-center gap-2">
              {#if viol.code === "INVARIANT_PREREQUISITE_STAGE_UNMET"}
                <Button
                  size="sm"
                  onclick={() => handleReconcile(viol, "AUTO_LOG_BREAKTHROUGH")}
                  class="h-7 text-xs flex items-center gap-1 font-mono"
                >
                  <Sparkles class="w-3 h-3" />
                  <span>Auto-Log Breakthrough Event</span>
                </Button>
              {:else if viol.code === "INVARIANT_RELATIONAL_MISMATCH"}
                <Button
                  size="sm"
                  onclick={() => handleReconcile(viol, "AUTO_LINK_RELATIONAL_WEAPON")}
                  class="h-7 text-xs flex items-center gap-1 font-mono"
                >
                  <Sparkles class="w-3 h-3" />
                  <span>Auto-Link Relational Weapon</span>
                </Button>
              {/if}

              <Button
                variant="outline"
                size="sm"
                onclick={() => handleDismiss(viol.id)}
                class="h-7 text-xs"
              >
                Dismiss
              </Button>
            </div>
          </div>
        {/if}

        <!-- Overridden Justification Box -->
        {#if viol.overridden}
          <div class="p-3 rounded-lg bg-muted/60 border border-border space-y-1 text-xs font-sans">
            <div class="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span class="font-bold text-foreground">Lead Author Editorial Justification:</span>
              <span>Logged: {viol.overriddenAt ? new Date(viol.overriddenAt).toLocaleString() : "Recently"}</span>
            </div>
            <p class="text-foreground/90 italic">{viol.overrideJustification}</p>
          </div>
        {/if}

        <!-- RFC 7807 Meta Footer -->
        <div class="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
          <span class="flex items-center gap-1">
            <span>RFC 7807 Spec URI:</span>
            <a
              href={viol.rfc7807Uri}
              target="_blank"
              class="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              <span>{viol.rfc7807Uri}</span>
              <ExternalLink class="w-2.5 h-2.5" />
            </a>
          </span>
          <span>Timeline Anchor: Seq #{viol.sequenceNumber}</span>
        </div>
      </Card>
    {/each}
  </div>

  <!-- Override Justification Modal -->
  {#if activeOverrideViolation}
    <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card class="border-border bg-card max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center gap-2 text-destructive">
            <Key class="w-5 h-5" />
            <h3 class="text-base font-bold text-foreground">
              Lead Author Override Authorization
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (activeOverrideViolation = null)}
            class="text-muted-foreground hover:text-foreground"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          Overriding a canonical invariant bypasses continuity blocking for <strong class="text-destructive font-mono">{activeOverrideViolation.code}</strong>.
          You must provide a formal editorial rationale to preserve audit integrity.
        </p>

        <div class="p-3 rounded-lg bg-muted/50 border border-border text-xs font-mono space-y-1 text-muted-foreground">
          <div>Entity: <strong class="text-foreground">{activeOverrideViolation.entityName}</strong></div>
          <div>Scene Anchor: <strong class="text-foreground">{activeOverrideViolation.sceneTitle}</strong></div>
          <div>Violated Rule: <strong class="text-foreground">{activeOverrideViolation.ruleName}</strong></div>
        </div>

        <div class="space-y-3">
          <div class="space-y-1.5">
            <Label for="author-name-input">Author Identifier <span class="text-destructive">*</span></Label>
            <Input
              id="author-name-input"
              bind:value={authorNameInput}
              placeholder="e.g. Lead Author, Head Lorekeeper"
              class="text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="override-justification-input">Editorial Justification <span class="text-destructive">*</span></Label>
            <Input
              id="override-justification-input"
              bind:value={justificationInput}
              placeholder="e.g., Entity resurrected via astral echo in flashback sequence #160..."
              class="text-xs"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onclick={() => (activeOverrideViolation = null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!justificationInput.trim()}
            onclick={handleExecuteOverride}
          >
            Confirm & Log Override
          </Button>
        </div>
      </Card>
    </div>
  {/if}
</div>
