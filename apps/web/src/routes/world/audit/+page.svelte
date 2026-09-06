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
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Field from "$lib/components/ui/field.svelte";

  interface ViolationItem {
    id: string;
    code: string;
    ruleName: string;
    sceneId: string;
    sceneTitle: string;
    sequenceNumber: number;
    entityName: string;
    property: string;
    expectedValue: string;
    calculatedValue: string;
    message: string;
    rfc7807Uri: string;
    overridden?: boolean;
    overrideJustification?: string;
  }

  let violations = $state<ViolationItem[]>([
    {
      id: "viol-1",
      code: "INVARIANT_STATE_ILLEGAL_ACTION",
      ruleName: "Deceased Entity Action Restriction",
      sceneId: "scene-contradiction-160",
      sceneTitle: "Scene 2: The Forbidden Ritual (Contradiction Test Scene)",
      sequenceNumber: 160,
      entityName: "Lord Malakor",
      property: "status",
      expectedValue: "Action CAST_SPELL forbidden when status is DEAD",
      calculatedValue: "status: DEAD, attemptedAction: CAST_SPELL",
      message:
        "Rule 'Deceased Entity Action Restriction' violated: Lord Malakor is DEAD (slain at Seq #150) and cannot execute action 'CAST_SPELL'.",
      rfc7807Uri:
        "https://novwrite.io/errors/invariants/invariant-state-illegal-action",
    },
    {
      id: "viol-2",
      code: "INVARIANT_NUMERIC_MIN_VIOLATED",
      ruleName: "Non-Negative Mana Invariant",
      sceneId: "scene-contradiction-160",
      sceneTitle: "Scene 2: The Forbidden Ritual (Contradiction Test Scene)",
      sequenceNumber: 160,
      entityName: "Eldrin the Spellblade",
      property: "mana_capacity",
      expectedValue: ">= 0",
      calculatedValue: "-200 MP",
      message:
        "Rule 'Non-Negative Mana Invariant' violated: Eldrin the Spellblade mana_capacity calculated as -200 MP, below minimum bound 0.",
      rfc7807Uri:
        "https://novwrite.io/errors/invariants/invariant-numeric-min-violated",
    },
  ]);

  let activeOverrideViolation = $state<ViolationItem | null>(null);
  let justificationInput = $state("");
  let overrideSuccessMessage = $state<string | null>(null);

  function openOverrideModal(viol: ViolationItem) {
    activeOverrideViolation = viol;
    justificationInput = "";
    overrideSuccessMessage = null;
  }

  function handleExecuteOverride() {
    if (!activeOverrideViolation || !justificationInput.trim()) return;

    violations = violations.map((v) => {
      if (v.id === activeOverrideViolation!.id) {
        return {
          ...v,
          overridden: true,
          overrideJustification: justificationInput.trim(),
        };
      }
      return v;
    });

    overrideSuccessMessage = `Lead Author Override logged for ${activeOverrideViolation.code}. Audit entry recorded.`;
    activeOverrideViolation = null;
    setTimeout(() => {
      overrideSuccessMessage = null;
    }, 4000);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100">
        Continuity Violation & RFC 7807 Audit Console
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Live contradiction detector cross-referencing drafted manuscript scenes
        with deterministic universe state.
      </p>
    </div>

    <div
      class="flex items-center gap-2 text-xs font-mono text-red-400 font-semibold"
    >
      <AlertOctagon class="w-4 h-4 text-red-500" />
      <span>2 Active Violations Detected</span>
    </div>
  </div>

  {#if overrideSuccessMessage}
    <div
      class="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-medium"
    >
      <Check class="w-4 h-4" />
      {overrideSuccessMessage}
    </div>
  {/if}

  <!-- Violations List -->
  <div class="space-y-4">
    {#each violations as viol}
      <div
        class="bg-zinc-900 rounded-lg border {viol.overridden
          ? 'border-zinc-800 opacity-60'
          : 'border-red-900/60 bg-red-950/10'} p-5 space-y-3.5"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3"
        >
          <div class="flex items-center gap-2.5">
            <AlertOctagon
              class="w-4 h-4 {viol.overridden
                ? 'text-zinc-500'
                : 'text-red-400'}"
            />
            <div>
              <span class="font-mono text-xs font-bold text-red-300"
                >{viol.code}</span
              >
              <p class="text-xs text-zinc-300 font-medium mt-0.5">
                {viol.sceneTitle}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            {#if viol.overridden}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400"
              >
                <CheckCircle class="w-3.5 h-3.5 text-zinc-500" />
                OVERRIDDEN BY LEAD AUTHOR
              </span>
            {:else}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-mono text-red-400 font-semibold"
              >
                <ShieldAlert class="w-3.5 h-3.5 text-red-500" />
                BLOCKING ERROR
              </span>
              <Button
                variant="destructive"
                size="sm"
                onclick={() => openOverrideModal(viol)}
              >
                <Key class="w-3.5 h-3.5" />
                <span>Lead Author Override</span>
              </Button>
            {/if}
          </div>
        </div>

        <p class="text-xs text-zinc-200 leading-relaxed">{viol.message}</p>

        <!-- Problem Detail Breakdown -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono"
        >
          <div
            class="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1"
          >
            <span class="text-zinc-500 text-[11px]">TARGET ENTITY</span>
            <p class="text-zinc-200 font-semibold">{viol.entityName}</p>
          </div>
          <div
            class="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1"
          >
            <span class="text-zinc-500 text-[11px]">EXPECTED STATE</span>
            <p class="text-emerald-400 font-semibold">{viol.expectedValue}</p>
          </div>
          <div
            class="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1"
          >
            <span class="text-zinc-500 text-[11px]">CALCULATED STATE</span>
            <p class="text-red-400 font-semibold">{viol.calculatedValue}</p>
          </div>
        </div>

        {#if viol.overridden}
          <div
            class="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-sans text-zinc-400"
          >
            <strong>Override Justification:</strong>
            {viol.overrideJustification}
          </div>
        {/if}

        <div
          class="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1"
        >
          <span
            >RFC 7807 Spec: <a
              href={viol.rfc7807Uri}
              target="_blank"
              class="text-purple-400 hover:underline">{viol.rfc7807Uri}</a
            ></span
          >
          <span>Timeline Anchor: Seq #{viol.sequenceNumber}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Override Justification Modal -->
  {#if activeOverrideViolation}
    <div
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl"
      >
        <div class="flex items-center gap-2 text-red-400">
          <Key class="w-5 h-5" />
          <h3 class="text-base font-bold text-zinc-100">
            Lead Author Override Authorization
          </h3>
        </div>

        <p class="text-xs text-zinc-300 leading-relaxed">
          Overriding a canonical invariant bypasses continuity blocking for <strong
            >{activeOverrideViolation.code}</strong
          >. You must provide a formal editorial justification for the project
          audit trail.
        </p>

        <div
          class="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400"
        >
          Entity: <strong class="text-zinc-200"
            >{activeOverrideViolation.entityName}</strong
          ><br />
          Scene:
          <strong class="text-zinc-200"
            >{activeOverrideViolation.sceneTitle}</strong
          >
        </div>

        <Field
          id="override-justification-input"
          label="Editorial Justification"
          required
        >
          <Input
            id="override-justification-input"
            bind:value={justificationInput}
            placeholder="e.g., Character resurrected via astral echo in flashback scene #160..."
            class="text-xs"
          />
        </Field>

        <div
          class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800"
        >
          <Button
            variant="outline"
            size="sm"
            onclick={() => (activeOverrideViolation = null)}>Cancel</Button
          >
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
