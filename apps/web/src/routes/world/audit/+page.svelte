<script lang="ts">
  import {
    AlertOctagon,
    CheckCircle2,
    ShieldAlert,
    Sparkles,
    Key,
    Check,
    Info,
    FileText,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    History,
    Wrench,
    ArrowRight,
    ExternalLink,
    X,
    ShieldCheck,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Field from "$lib/components/ui/field.svelte";
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

    showNotification(
      `Lead Author Override logged for ${activeOverrideViolation.code}. Audit entry recorded.`,
    );
    activeOverrideViolation = null;
  }

  function handleReconcile(viol: ContinuityViolationItem, actionType: string) {
    const success = worldStore.reconcileViolation(viol.id, actionType);
    if (success) {
      if (actionType === "AUTO_LOG_BREAKTHROUGH") {
        showNotification(
          `Auto-reconciled: Breakthrough event injected into timeline for ${viol.entityName}.`,
        );
      } else if (actionType === "AUTO_LINK_RELATIONAL_WEAPON") {
        showNotification(
          `Auto-reconciled: Bound relational weapon link established for ${viol.entityName}.`,
        );
      } else {
        showNotification("Violation dismissed.");
      }
    }
  }

  function handleDismiss(id: string) {
    worldStore.dismissViolation(id);
    showNotification("Continuity violation dismissed.");
  }

  function showNotification(msg: string) {
    actionSuccessMessage = msg;
    setTimeout(() => {
      actionSuccessMessage = null;
    }, 4500);
  }
</script>

<div class="space-y-6">
  <!-- Header & Primary Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <AlertOctagon class="w-5 h-5 text-red-400" />
        <span>Continuity Violation & RFC 7807 Audit Console</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
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
        <RefreshCw class="w-3.5 h-3.5 {isAuditing ? 'animate-spin text-purple-400' : 'text-zinc-400'}" />
        <span>{isAuditing ? "Auditing State..." : "Re-Run Audit"}</span>
      </Button>
    </div>
  </div>

  <!-- Notification Banner -->
  {#if actionSuccessMessage}
    <div class="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-medium shadow-sm">
      <Check class="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{actionSuccessMessage}</span>
    </div>
  {/if}

  <!-- Audit Health Metrics Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="bg-zinc-900/90 rounded-lg border {activeBlockingCount > 0 ? 'border-red-950/80 bg-red-950/15' : 'border-zinc-800'} p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-red-400 uppercase tracking-wider flex items-center gap-1">
        <ShieldAlert class="w-3.5 h-3.5 text-red-500" />
        <span>Blocking Invariants</span>
      </span>
      <p class="text-2xl font-bold {activeBlockingCount > 0 ? 'text-red-400' : 'text-zinc-400'}">{activeBlockingCount}</p>
    </div>

    <div class="bg-zinc-900/90 rounded-lg border border-amber-950/70 p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1">
        <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
        <span>Active Warnings</span>
      </span>
      <p class="text-2xl font-bold text-amber-300">{activeWarningCount}</p>
    </div>

    <div class="bg-zinc-900/90 rounded-lg border border-zinc-800 p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
        <Key class="w-3.5 h-3.5 text-purple-400" />
        <span>Lead Author Overrides</span>
      </span>
      <p class="text-2xl font-bold text-purple-300">{overriddenCount}</p>
    </div>

    <div class="bg-zinc-900/90 rounded-lg border border-zinc-800 p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
        <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
        <span>Audit Graph Status</span>
      </span>
      <p class="text-xs font-mono font-bold {activeBlockingCount === 0 ? 'text-emerald-400' : 'text-red-400'} pt-1.5">
        {activeBlockingCount === 0 ? "CONTINUITY INTACT" : "CONTRADICTIONS FOUND"}
      </p>
    </div>
  </div>

  <!-- Filter Strip -->
  <div class="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
    <div class="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
      <span class="mr-2">Filter Violations:</span>
      <button
        type="button"
        onclick={() => (statusFilter = "ALL")}
        class="px-2.5 py-1 rounded text-xs transition {statusFilter === 'ALL' ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'}"
      >
        All ({totalViolationsCount})
      </button>
      <button
        type="button"
        onclick={() => (statusFilter = "ACTIVE")}
        class="px-2.5 py-1 rounded text-xs transition {statusFilter === 'ACTIVE' ? 'bg-red-950/80 border border-red-800/80 text-red-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}"
      >
        Active ({activeBlockingCount + activeWarningCount})
      </button>
      <button
        type="button"
        onclick={() => (statusFilter = "OVERRIDDEN")}
        class="px-2.5 py-1 rounded text-xs transition {statusFilter === 'OVERRIDDEN' ? 'bg-purple-950/80 border border-purple-800/80 text-purple-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}"
      >
        Overridden ({overriddenCount})
      </button>
    </div>

    <span class="text-[11px] font-mono text-zinc-500">
      RFC 7807 Problem Details Spec Active
    </span>
  </div>

  <!-- Violations List -->
  <div class="space-y-4">
    {#if filteredViolations.length === 0}
      <div class="bg-zinc-900/60 rounded-xl border border-zinc-800 p-8 text-center space-y-2">
        <CheckCircle2 class="w-8 h-8 text-emerald-400 mx-auto" />
        <h3 class="text-sm font-bold text-zinc-200">No Continuity Violations Detected</h3>
        <p class="text-xs text-zinc-400 max-w-md mx-auto">
          All narrative scene state transitions comply with your universe invariant rules and causal delta logs.
        </p>
      </div>
    {/if}

    {#each filteredViolations as viol}
      <div
        class="bg-zinc-900 rounded-xl border {viol.overridden
          ? 'border-zinc-800/80 opacity-65'
          : viol.severity === 'BLOCKING_ERROR'
            ? 'border-red-900/70 bg-red-950/10 shadow-sm'
            : 'border-amber-900/70 bg-amber-950/10 shadow-sm'} p-5 space-y-4"
      >
        <!-- Card Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3.5">
          <div class="flex items-start gap-3">
            <div class="mt-0.5">
              {#if viol.overridden}
                <CheckCircle class="w-5 h-5 text-zinc-500" />
              {:else if viol.severity === "BLOCKING_ERROR"}
                <AlertOctagon class="w-5 h-5 text-red-500" />
              {:else}
                <AlertTriangle class="w-5 h-5 text-amber-500" />
              {/if}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs font-bold {viol.overridden ? 'text-zinc-400' : viol.severity === 'BLOCKING_ERROR' ? 'text-red-300' : 'text-amber-300'}">
                  {viol.code}
                </span>
                <span class="text-zinc-600">·</span>
                <span class="text-xs font-semibold text-zinc-200 font-mono">
                  Rule: {viol.ruleName}
                </span>
              </div>
              <p class="text-xs text-zinc-300 font-medium mt-0.5">
                {viol.sceneTitle} (Sequence #{viol.sequenceNumber})
              </p>
            </div>
          </div>

          <!-- Status Indicator & Actions -->
          <div class="flex flex-wrap items-center gap-2">
            {#if viol.overridden}
              <div class="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <Key class="w-3.5 h-3.5 text-purple-400" />
                <span>OVERRIDDEN BY {viol.overriddenBy || "LEAD AUTHOR"}</span>
              </div>
            {:else}
              {#if viol.severity === "BLOCKING_ERROR"}
                <span class="inline-flex items-center gap-1 text-xs font-mono text-red-400 font-semibold px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60">
                  <ShieldAlert class="w-3.5 h-3.5 text-red-500" />
                  BLOCKING ERROR
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 text-xs font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
                  <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
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
        <p class="text-xs text-zinc-200 leading-relaxed font-sans">{viol.message}</p>

        <!-- Problem Detail Breakdown Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
            <span class="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">Target Entity</span>
            <p class="text-zinc-200 font-bold">{viol.entityName}</p>
            <span class="text-zinc-500 text-[10px] block">Property: {viol.property}</span>
          </div>

          <div class="p-3 rounded-lg bg-zinc-950 border border-emerald-950/60 space-y-1">
            <span class="text-emerald-400/80 text-[10px] uppercase tracking-wider font-semibold">Expected Invariant Bound</span>
            <p class="text-emerald-300 font-bold">{viol.expectedValue}</p>
          </div>

          <div class="p-3 rounded-lg bg-zinc-950 border {viol.overridden ? 'border-zinc-800' : 'border-red-950/60'} space-y-1">
            <span class="text-red-400/80 text-[10px] uppercase tracking-wider font-semibold">Calculated State at Scene</span>
            <p class="text-red-300 font-bold">{viol.calculatedValue}</p>
          </div>
        </div>

        <!-- Historical Causal Traceback (if available) -->
        {#if viol.historicalCausalEventTitle}
          <div class="p-2.5 rounded-lg bg-zinc-950/90 border border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div class="flex items-center gap-2">
              <History class="w-3.5 h-3.5 text-cyan-400" />
              <span>Historical Causal Origin:</span>
              <strong class="text-zinc-200">{viol.historicalCausalEventTitle}</strong>
              <span class="text-cyan-400">(Seq #{viol.historicalCausalSequence})</span>
            </div>
            <span class="text-[10px] text-zinc-500">Root Mutation Anchor</span>
          </div>
        {/if}

        <!-- One-Click Reconciliations (if not overridden) -->
        {#if !viol.overridden}
          <div class="pt-2 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                <Wrench class="w-3.5 h-3.5 text-purple-400" />
                <span>Suggested Quick-Fix:</span>
              </span>
              <span class="text-xs text-zinc-300 font-sans">{viol.suggestedResolution}</span>
            </div>

            <div class="flex items-center gap-2">
              {#if viol.code === "INVARIANT_PREREQUISITE_STAGE_UNMET"}
                <Button
                  size="sm"
                  onclick={() => handleReconcile(viol, "AUTO_LOG_BREAKTHROUGH")}
                  class="h-7 text-xs bg-purple-700 hover:bg-purple-600 text-white flex items-center gap-1 font-mono"
                >
                  <Sparkles class="w-3 h-3" />
                  <span>Auto-Log Breakthrough Event</span>
                </Button>
              {:else if viol.code === "INVARIANT_RELATIONAL_MISMATCH"}
                <Button
                  size="sm"
                  onclick={() => handleReconcile(viol, "AUTO_LINK_RELATIONAL_WEAPON")}
                  class="h-7 text-xs bg-purple-700 hover:bg-purple-600 text-white flex items-center gap-1 font-mono"
                >
                  <Sparkles class="w-3 h-3" />
                  <span>Auto-Link Relational Weapon</span>
                </Button>
              {/if}

              <Button
                variant="outline"
                size="sm"
                onclick={() => handleDismiss(viol.id)}
                class="h-7 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Dismiss
              </Button>
            </div>
          </div>
        {/if}

        <!-- Overridden Justification Box -->
        {#if viol.overridden}
          <div class="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1 text-xs font-sans">
            <div class="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span class="font-bold text-zinc-300">Lead Author Editorial Justification:</span>
              <span>Logged: {viol.overriddenAt ? new Date(viol.overriddenAt).toLocaleString() : "Recently"}</span>
            </div>
            <p class="text-zinc-300 italic">{viol.overrideJustification}</p>
          </div>
        {/if}

        <!-- RFC 7807 Meta Footer -->
        <div class="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
          <span class="flex items-center gap-1">
            <span>RFC 7807 Spec URI:</span>
            <a
              href={viol.rfc7807Uri}
              target="_blank"
              class="text-purple-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>{viol.rfc7807Uri}</span>
              <ExternalLink class="w-2.5 h-2.5" />
            </a>
          </span>
          <span>Timeline Anchor: Seq #{viol.sequenceNumber}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Override Justification Modal -->
  {#if activeOverrideViolation}
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div class="flex items-center gap-2 text-red-400">
            <Key class="w-5 h-5" />
            <h3 class="text-base font-bold text-zinc-100">
              Lead Author Override Authorization
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (activeOverrideViolation = null)}
            class="text-zinc-400 hover:text-zinc-200"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-zinc-300 leading-relaxed">
          Overriding a canonical invariant bypasses continuity blocking for <strong class="text-red-300 font-mono">{activeOverrideViolation.code}</strong>.
          You must provide a formal editorial rationale to preserve audit integrity.
        </p>

        <div class="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1 text-zinc-400">
          <div>Entity: <strong class="text-zinc-200">{activeOverrideViolation.entityName}</strong></div>
          <div>Scene Anchor: <strong class="text-zinc-200">{activeOverrideViolation.sceneTitle}</strong></div>
          <div>Violated Rule: <strong class="text-zinc-200">{activeOverrideViolation.ruleName}</strong></div>
        </div>

        <div class="space-y-3">
          <Field id="author-name-input" label="Author Identifier" required>
            <Input
              id="author-name-input"
              bind:value={authorNameInput}
              placeholder="e.g. Lead Author, Head Lorekeeper"
              class="text-xs"
            />
          </Field>

          <Field id="override-justification-input" label="Editorial Justification" required>
            <Input
              id="override-justification-input"
              bind:value={justificationInput}
              placeholder="e.g., Entity resurrected via astral echo in flashback sequence #160..."
              class="text-xs"
            />
          </Field>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
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
      </div>
    </div>
  {/if}
</div>
