<script lang="ts">
  import {
    ShieldAlert,
    Plus,
    ShieldCheck,
    Trash2,
    Edit3,
    AlertTriangle,
    Info,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";

  interface RuleItem {
    id: string;
    name: string;
    severity: "BLOCKING_ERROR" | "WARNING" | "ADVISORY_NOTE";
    type: "NUMERIC_BOUNDS" | "STATE_GUARD" | "PREREQUISITE";
    targetCategory: string;
    predicateSummary: string;
    description: string;
  }

  let rules = $state<RuleItem[]>([
    {
      id: "rule-1",
      name: "Non-Negative Mana Invariant",
      severity: "BLOCKING_ERROR",
      type: "NUMERIC_BOUNDS",
      targetCategory: "CHARACTER",
      predicateSummary: "mana_capacity >= 0",
      description:
        "Characters cannot cast spells or execute effects that drop mana below 0.",
    },
    {
      id: "rule-2",
      name: "Deceased Entity Action Restriction",
      severity: "BLOCKING_ERROR",
      type: "STATE_GUARD",
      targetCategory: "CHARACTER",
      predicateSummary:
        "IF status == DEAD THEN FORBID [CAST_SPELL, ATTACK, SPEAK]",
      description:
        "Deceased characters cannot perform active spells or dialogue without resurrection.",
    },
    {
      id: "rule-3",
      name: "Core Formation Breakthrough Prerequisite",
      severity: "WARNING",
      type: "PREREQUISITE",
      targetCategory: "CHARACTER",
      predicateSummary:
        "REQUIRES cultivation_realm == Core Formation FOR [Astral_Veil_Domain]",
      description:
        "Domain techniques require at least Core Formation cultivation realm stage.",
    },
  ]);
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100">
        Universe Invariant Rules
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Define continuity laws and causal boundaries enforced by the
        deterministic state fold engine.
      </p>
    </div>

    <Button size="sm">
      <Plus class="w-3.5 h-3.5" />
      <span>Add Invariant Rule</span>
    </Button>
  </div>

  <!-- Rules Table -->
  <div class="bg-zinc-900/60 rounded-lg border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead
          class="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider"
        >
          <tr>
            <th class="px-4 py-3">Rule Name</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Severity</th>
            <th class="px-4 py-3">Predicate Condition</th>
            <th class="px-4 py-3">Scope</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/60">
          {#each rules as rule}
            <tr class="hover:bg-zinc-850/80 transition-colors">
              <td class="px-4 py-3.5 font-medium text-zinc-200">
                <div class="flex items-center gap-2">
                  <ShieldCheck class="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <span>{rule.name}</span>
                    <p class="text-[11px] text-zinc-400 font-sans mt-0.5">
                      {rule.description}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 font-mono text-[11px] text-purple-300"
                >{rule.type}</td
              >
              <td class="px-4 py-3 font-mono text-[11px]">
                {#if rule.severity === "BLOCKING_ERROR"}
                  <span
                    class="inline-flex items-center gap-1 text-red-400 font-semibold"
                  >
                    <ShieldAlert class="w-3.5 h-3.5 text-red-500" />
                    BLOCKING
                  </span>
                {:else if rule.severity === "WARNING"}
                  <span
                    class="inline-flex items-center gap-1 text-amber-400 font-semibold"
                  >
                    <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
                    WARNING
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center gap-1 text-zinc-400 font-semibold"
                  >
                    <Info class="w-3.5 h-3.5 text-zinc-500" />
                    ADVISORY
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3 font-mono text-zinc-300 text-[11px]">
                <code class="text-amber-200">
                  {rule.predicateSummary}
                </code>
              </td>
              <td class="px-4 py-3 font-mono text-zinc-400 text-[11px]"
                >{rule.targetCategory}</td
              >
              <td class="px-4 py-3 text-right">
                <Button variant="ghost" size="sm">
                  <Trash2
                    class="w-3.5 h-3.5 text-zinc-500 hover:text-red-400"
                  />
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
