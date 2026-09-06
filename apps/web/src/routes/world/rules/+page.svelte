<script lang="ts">
  import {
    ShieldAlert,
    Plus,
    ShieldCheck,
    Trash2,
    Edit3,
    AlertTriangle,
    Info,
    Search,
    Filter,
    Check,
    X,
    Sliders,
    Layers,
    Shield,
    Sparkles,
    CheckCircle,
    ToggleLeft,
    ToggleRight,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Field from "$lib/components/ui/field.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import {
    worldStore,
    type InvariantRuleItem,
    type RuleSeverity,
    type RuleType,
    type BlueprintDef,
  } from "$lib/stores/worldStore.svelte";

  // Search and Filters
  let searchQuery = $state("");
  let selectedSeverityFilter = $state<string>("ALL");
  let selectedTypeFilter = $state<string>("ALL");

  // Modal State
  let isModalOpen = $state(false);
  let modalMode = $state<"add" | "edit">("add");
  let activeEditId = $state<string | null>(null);

  // Form Fields
  let formName = $state("");
  let formSeverity = $state<RuleSeverity>("BLOCKING_ERROR");
  let formType = $state<RuleType>("NUMERIC_BOUNDS");
  let formTargetBlueprintId = $state<string>("");
  let formTargetCategory = $state<string>("Characters");
  let formPredicateExpression = $state("");
  let formPredicateSummary = $state("");
  let formDescription = $state("");
  let formSuggestedResolution = $state("");
  let formEnabled = $state(true);

  // Severity Options
  const severityOptions: { value: RuleSeverity; label: string }[] = [
    { value: "BLOCKING_ERROR", label: "BLOCKING_ERROR (Strict Invariant)" },
    { value: "WARNING", label: "WARNING (Continuity Advisory)" },
    { value: "ADVISORY_NOTE", label: "ADVISORY_NOTE (Style & Lore Hint)" },
  ];

  // Type Options
  const typeOptions: { value: RuleType; label: string }[] = [
    { value: "STATE_GUARD", label: "STATE_GUARD (Forbidden Actions / States)" },
    { value: "NUMERIC_BOUNDS", label: "NUMERIC_BOUNDS (Min/Max Clamps)" },
    { value: "PREREQUISITE", label: "PREREQUISITE (Required Stage / Item)" },
    { value: "RELATIONAL_GUARD", label: "RELATIONAL_GUARD (Wielder / Ownership)" },
    { value: "FORMULA_BOUNDARY", label: "FORMULA_BOUNDARY (Computed Score Floor/Ceiling)" },
  ];

  // Derived filtered rules
  const filteredRules = $derived(
    worldStore.rules.filter((r: InvariantRuleItem) => {
      const matchesSeverity =
        selectedSeverityFilter === "ALL" || r.severity === selectedSeverityFilter;
      const matchesType =
        selectedTypeFilter === "ALL" || r.type === selectedTypeFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.predicateSummary.toLowerCase().includes(q) ||
        (r.targetCategory && r.targetCategory.toLowerCase().includes(q)) ||
        (r.targetBlueprintName && r.targetBlueprintName.toLowerCase().includes(q));

      return matchesSeverity && matchesType && matchesQuery;
    }),
  );

  // Statistics
  const totalRulesCount = $derived(worldStore.rules.length);
  const blockingCount = $derived(
    worldStore.rules.filter((r: InvariantRuleItem) => r.severity === "BLOCKING_ERROR").length,
  );
  const warningCount = $derived(
    worldStore.rules.filter((r: InvariantRuleItem) => r.severity === "WARNING").length,
  );
  const activeCount = $derived(
    worldStore.rules.filter((r: InvariantRuleItem) => r.enabled).length,
  );

  function openAddModal() {
    modalMode = "add";
    activeEditId = null;
    formName = "";
    formSeverity = "BLOCKING_ERROR";
    formType = "NUMERIC_BOUNDS";
    formTargetBlueprintId = worldStore.blueprints[0]?.id || "";
    formTargetCategory = worldStore.blueprints[0]?.category || "Characters";
    formPredicateExpression = "mana_capacity >= 0";
    formPredicateSummary = "mana_capacity >= 0";
    formDescription = "";
    formSuggestedResolution = "Add a prior spiritual replenishment event or reduce mana expenditure.";
    formEnabled = true;
    isModalOpen = true;
  }

  function openEditModal(rule: InvariantRuleItem) {
    modalMode = "edit";
    activeEditId = rule.id;
    formName = rule.name;
    formSeverity = rule.severity;
    formType = rule.type;
    formTargetBlueprintId = rule.targetBlueprintId || "";
    formTargetCategory = rule.targetCategory || "";
    formPredicateExpression = rule.predicateExpression;
    formPredicateSummary = rule.predicateSummary;
    formDescription = rule.description;
    formSuggestedResolution = rule.suggestedResolution || "";
    formEnabled = rule.enabled;
    isModalOpen = true;
  }

  function handleSaveRule() {
    if (!formName.trim()) return;

    const bp = worldStore.blueprints.find((b: BlueprintDef) => b.id === formTargetBlueprintId);

    if (modalMode === "add") {
      worldStore.addRule({
        name: formName.trim(),
        severity: formSeverity,
        type: formType,
        targetBlueprintId: formTargetBlueprintId || undefined,
        targetBlueprintName: bp?.name || undefined,
        targetCategory: bp?.category || formTargetCategory || undefined,
        predicateExpression: formPredicateExpression.trim(),
        predicateSummary: formPredicateSummary.trim() || formPredicateExpression.trim(),
        description: formDescription.trim(),
        suggestedResolution: formSuggestedResolution.trim() || undefined,
        enabled: formEnabled,
      });
    } else if (activeEditId) {
      worldStore.updateRule(activeEditId, {
        name: formName.trim(),
        severity: formSeverity,
        type: formType,
        targetBlueprintId: formTargetBlueprintId || undefined,
        targetBlueprintName: bp?.name || undefined,
        targetCategory: bp?.category || formTargetCategory || undefined,
        predicateExpression: formPredicateExpression.trim(),
        predicateSummary: formPredicateSummary.trim() || formPredicateExpression.trim(),
        description: formDescription.trim(),
        suggestedResolution: formSuggestedResolution.trim() || undefined,
        enabled: formEnabled,
      });
    }

    isModalOpen = false;
  }

  function handleDeleteRule(id: string) {
    if (confirm("Are you sure you want to delete this invariant rule?")) {
      worldStore.deleteRule(id);
    }
  }

  function handleToggleRule(id: string) {
    worldStore.toggleRule(id);
  }
</script>

<div class="space-y-6">
  <!-- Header & Primary Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-amber-400" />
        <span>Universe Invariant Rules & Causal Boundaries</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Define continuity laws, forbidden states, and relational constraints verified by the state fold engine.
      </p>
    </div>

    <Button size="sm" onclick={openAddModal} class="h-8 text-xs flex items-center gap-1.5">
      <Plus class="w-3.5 h-3.5" />
      <span>Add Invariant Rule</span>
    </Button>
  </div>

  <!-- Summary Metric Strip -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="bg-zinc-900/90 rounded-lg border border-zinc-800 p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Total Rules</span>
      <p class="text-xl font-bold text-zinc-100">{totalRulesCount}</p>
    </div>
    <div class="bg-zinc-900/90 rounded-lg border border-red-950/60 p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-red-400 uppercase tracking-wider flex items-center gap-1">
        <ShieldAlert class="w-3 h-3 text-red-500" />
        <span>Blocking Invariants</span>
      </span>
      <p class="text-xl font-bold text-red-300">{blockingCount}</p>
    </div>
    <div class="bg-zinc-900/90 rounded-lg border border-amber-950/60 p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1">
        <AlertTriangle class="w-3 h-3 text-amber-500" />
        <span>Warnings / Advisory</span>
      </span>
      <p class="text-xl font-bold text-amber-300">{warningCount}</p>
    </div>
    <div class="bg-zinc-900/90 rounded-lg border border-emerald-950/60 p-3.5 space-y-1">
      <span class="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
        <CheckCircle class="w-3 h-3 text-emerald-500" />
        <span>Active Rules</span>
      </span>
      <p class="text-xl font-bold text-emerald-300">{activeCount}</p>
    </div>
  </div>

  <!-- Filters & Search Toolbar -->
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
    <div class="relative flex-1 max-w-sm">
      <Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder="Filter by rule name, predicate, or target scope..."
        bind:value={searchQuery}
        class="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <!-- Severity Filter -->
      <select
        bind:value={selectedSeverityFilter}
        class="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
      >
        <option value="ALL">All Severities</option>
        <option value="BLOCKING_ERROR">Blocking Only</option>
        <option value="WARNING">Warnings Only</option>
        <option value="ADVISORY_NOTE">Advisory Notes</option>
      </select>

      <!-- Type Filter -->
      <select
        bind:value={selectedTypeFilter}
        class="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
      >
        <option value="ALL">All Rule Types</option>
        <option value="STATE_GUARD">State Guard</option>
        <option value="NUMERIC_BOUNDS">Numeric Bounds</option>
        <option value="PREREQUISITE">Prerequisite</option>
        <option value="RELATIONAL_GUARD">Relational Guard</option>
        <option value="FORMULA_BOUNDARY">Formula Boundary</option>
      </select>
    </div>
  </div>

  <!-- Rules Table -->
  <div class="bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider text-[11px]">
          <tr>
            <th class="px-4 py-3">Rule Definition</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Severity</th>
            <th class="px-4 py-3">Predicate Condition</th>
            <th class="px-4 py-3">Scope / Target</th>
            <th class="px-4 py-3 text-center">Status</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/60">
          {#if filteredRules.length === 0}
            <tr>
              <td colspan="7" class="px-4 py-8 text-center text-zinc-500 font-mono">
                No invariant rules match your filter criteria.
              </td>
            </tr>
          {/if}

          {#each filteredRules as rule}
            <tr class="hover:bg-zinc-850/60 transition-colors {rule.enabled ? '' : 'opacity-50'}">
              <!-- Rule Definition -->
              <td class="px-4 py-3.5 font-medium text-zinc-200 max-w-xs">
                <div class="flex items-start gap-2.5">
                  <ShieldCheck class="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span class="font-bold text-zinc-100">{rule.name}</span>
                    <p class="text-[11px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                      {rule.description}
                    </p>
                    {#if rule.suggestedResolution}
                      <p class="text-[10px] text-zinc-500 font-sans mt-1">
                        <strong class="text-zinc-400">Resolution Hint:</strong> {rule.suggestedResolution}
                      </p>
                    {/if}
                  </div>
                </div>
              </td>

              <!-- Rule Type -->
              <td class="px-4 py-3 font-mono text-[11px]">
                <span class="text-purple-300 font-medium px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/40">
                  {rule.type}
                </span>
              </td>

              <!-- Severity Indicator -->
              <td class="px-4 py-3 font-mono text-[11px]">
                {#if rule.severity === "BLOCKING_ERROR"}
                  <span class="inline-flex items-center gap-1.5 text-red-400 font-semibold">
                    <ShieldAlert class="w-3.5 h-3.5 text-red-500" />
                    BLOCKING
                  </span>
                {:else if rule.severity === "WARNING"}
                  <span class="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                    <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
                    WARNING
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1.5 text-zinc-400 font-semibold">
                    <Info class="w-3.5 h-3.5 text-zinc-500" />
                    ADVISORY
                  </span>
                {/if}
              </td>

              <!-- Predicate Condition -->
              <td class="px-4 py-3 font-mono text-zinc-300 text-[11px] max-w-xs">
                <code class="text-amber-200 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 block truncate">
                  {rule.predicateSummary || rule.predicateExpression}
                </code>
              </td>

              <!-- Scope / Target -->
              <td class="px-4 py-3 font-mono text-zinc-400 text-[11px]">
                <span class="text-zinc-300">{rule.targetBlueprintName || rule.targetCategory || "Universal"}</span>
              </td>

              <!-- Active Toggle -->
              <td class="px-4 py-3 text-center">
                <button
                  type="button"
                  onclick={() => handleToggleRule(rule.id)}
                  class="text-xs font-mono inline-flex items-center gap-1 transition-colors {rule.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-600 hover:text-zinc-400'}"
                  title={rule.enabled ? "Disable Rule" : "Enable Rule"}
                >
                  {#if rule.enabled}
                    <ToggleRight class="w-5 h-5 text-emerald-400" />
                  {:else}
                    <ToggleLeft class="w-5 h-5 text-zinc-600" />
                  {/if}
                </button>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => openEditModal(rule)}
                    class="h-7 px-2 text-zinc-400 hover:text-zinc-200"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => handleDeleteRule(rule.id)}
                    class="h-7 px-2 text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Create / Edit Invariant Rule Modal -->
  {#if isModalOpen}
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div class="flex items-center gap-2 text-amber-400">
            <ShieldCheck class="w-5 h-5" />
            <h3 class="text-base font-bold text-zinc-100">
              {modalMode === "add" ? "Create Invariant Rule" : "Edit Invariant Rule"}
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="text-zinc-400 hover:text-zinc-200"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Rule Name -->
          <Field id="rule-name" label="Rule Name" required>
            <Input
              id="rule-name"
              bind:value={formName}
              placeholder="e.g. Non-Negative Mana Invariant, Relic Ownership Integrity..."
              class="text-xs"
            />
          </Field>

          <!-- Severity & Type Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-zinc-300 mb-1.5" for="rule-severity">Severity Level</label>
              <select
                id="rule-severity"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200"
                bind:value={formSeverity}
              >
                {#each severityOptions as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-300 mb-1.5" for="rule-type">Rule Type</label>
              <select
                id="rule-type"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200"
                bind:value={formType}
              >
                {#each typeOptions as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Target Blueprint / Scope -->
          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1.5" for="rule-target-bp">Target Blueprint Scope</label>
            <select
              id="rule-target-bp"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200"
              bind:value={formTargetBlueprintId}
            >
              <option value="">Universal (All Blueprints & Entities)</option>
              {#each worldStore.blueprints as bp}
                <option value={bp.id}>{bp.name} ({bp.category})</option>
              {/each}
            </select>
          </div>

          <!-- Predicate Condition & Summary -->
          <Field id="rule-predicate" label="Predicate Condition (AST Logic)" required>
            <Input
              id="rule-predicate"
              bind:value={formPredicateExpression}
              placeholder="e.g. cultivation.major_realm >= 3 or mana_capacity >= 0"
              class="text-xs font-mono text-amber-200"
            />
          </Field>

          <Field id="rule-pred-summary" label="Predicate Human Summary">
            <Input
              id="rule-pred-summary"
              bind:value={formPredicateSummary}
              placeholder="e.g. REQUIRES cultivation.major_realm >= 3 (Core Formation)"
              class="text-xs font-mono"
            />
          </Field>

          <!-- Description -->
          <Field id="rule-desc" label="Rule Rationale & Description">
            <Textarea
              id="rule-desc"
              bind:value={formDescription}
              rows={2}
              placeholder="Explain why this universe law must remain invariant..."
              class="text-xs"
            />
          </Field>

          <!-- Suggested Resolution -->
          <Field id="rule-resolution" label="Suggested Editorial Resolution">
            <Input
              id="rule-resolution"
              bind:value={formSuggestedResolution}
              placeholder="e.g. Auto-log breakthrough event or link valid sacred weapon wielder..."
              class="text-xs"
            />
          </Field>

          <!-- Active Toggle Switch -->
          <div class="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rule-enabled"
              bind:checked={formEnabled}
              class="w-4 h-4 rounded border-zinc-800 bg-zinc-950 accent-amber-400"
            />
            <label for="rule-enabled" class="text-xs font-medium text-zinc-300 cursor-pointer">
              Enforce rule actively in real-time continuity audit checks
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <Button variant="outline" size="sm" onclick={() => (isModalOpen = false)}>Cancel</Button>
          <Button size="sm" disabled={!formName.trim()} onclick={handleSaveRule}>
            {modalMode === "add" ? "Create Rule" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
