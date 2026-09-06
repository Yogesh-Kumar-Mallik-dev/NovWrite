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
    Check,
    X,
    CheckCircle,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Label } from "$lib/components/ui/label";
  import { Card } from "$lib/components/ui/card";
  import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
  } from "$lib/components/ui/table";
  import { Switch } from "$lib/components/ui/switch";
  import ConfirmDialog from "$lib/components/ui/confirm-dialog.svelte";
  import EmptyState from "$lib/components/ui/empty-state.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import { toast } from "$lib/stores/toastStore.svelte";
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

  // Deletion Confirmation Dialog State
  let ruleToDelete = $state<{ id: string; name: string } | null>(null);

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

  // Filter Options
  const severityFilterOptions = [
    { value: "ALL", label: "All Severities" },
    { value: "BLOCKING_ERROR", label: "Blocking Only" },
    { value: "WARNING", label: "Warnings Only" },
    { value: "ADVISORY_NOTE", label: "Advisory Notes" },
  ];

  const typeFilterOptions = [
    { value: "ALL", label: "All Rule Types" },
    { value: "STATE_GUARD", label: "State Guard" },
    { value: "NUMERIC_BOUNDS", label: "Numeric Bounds" },
    { value: "PREREQUISITE", label: "Prerequisite" },
    { value: "RELATIONAL_GUARD", label: "Relational Guard" },
    { value: "FORMULA_BOUNDARY", label: "Formula Boundary" },
  ];

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

  // Target Blueprint Options
  const targetBlueprintOptions = $derived([
    { value: "", label: "Universal (All Blueprints & Entities)" },
    ...worldStore.blueprints.map((bp: BlueprintDef) => ({
      value: bp.id,
      label: `${bp.name} (${bp.category})`,
    })),
  ]);

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
    formType = "STATE_GUARD";
    formTargetBlueprintId = "";
    formTargetCategory = "";
    formPredicateExpression = "";
    formPredicateSummary = "";
    formDescription = "";
    formSuggestedResolution = "";
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
    formPredicateSummary = rule.predicateSummary || "";
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
      toast.success("Invariant Rule Created", `Rule "${formName.trim()}" has been established.`);
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
      toast.success("Invariant Rule Updated", `Rule "${formName.trim()}" changes saved.`);
    }

    isModalOpen = false;
  }

  function handleDeleteRule(id: string, name: string) {
    ruleToDelete = { id, name };
  }

  function confirmDeleteRule() {
    if (ruleToDelete) {
      worldStore.deleteRule(ruleToDelete.id);
      toast.success("Invariant Rule Deleted", `Rule "${ruleToDelete.name}" was removed from the universe.`);
      ruleToDelete = null;
    }
  }

  function handleToggleRule(id: string, checked: boolean) {
    const r = worldStore.getRule(id);
    if (r) {
      r.enabled = checked;
      toast.info(checked ? "Rule Enabled" : "Rule Disabled", `Constraint enforcement ${checked ? "activated" : "paused"} for "${r.name}".`);
    }
  }
</script>

<div class="space-y-6 transition-colors">
  <!-- Header & Primary Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-amber-500" />
        <span>Universe Invariant Rules & Causal Boundaries</span>
      </h2>
      <p class="text-xs text-muted-foreground mt-0.5">
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
    <Card class="p-3.5 space-y-1 bg-card border-border shadow-xs">
      <span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Total Rules</span>
      <p class="text-xl font-bold text-foreground">{totalRulesCount}</p>
    </Card>
    <Card class="p-3.5 space-y-1 bg-destructive/5 border-destructive/20 shadow-xs">
      <span class="text-[10px] font-mono text-destructive uppercase tracking-wider flex items-center gap-1">
        <ShieldAlert class="w-3 h-3" />
        <span>Blocking Invariants</span>
      </span>
      <p class="text-xl font-bold text-destructive">{blockingCount}</p>
    </Card>
    <Card class="p-3.5 space-y-1 bg-amber-500/5 border-amber-500/20 shadow-xs">
      <span class="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
        <AlertTriangle class="w-3 h-3 text-amber-500" />
        <span>Warnings / Advisory</span>
      </span>
      <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{warningCount}</p>
    </Card>
    <Card class="p-3.5 space-y-1 bg-emerald-500/5 border-emerald-500/20 shadow-xs">
      <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
        <CheckCircle class="w-3 h-3 text-emerald-500" />
        <span>Active Rules</span>
      </span>
      <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
    </Card>
  </div>

  <!-- Filters & Search Toolbar -->
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border">
    <div class="relative flex-1 max-w-sm">
      <Search class="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
      <Input
        type="text"
        placeholder="Filter by rule name, predicate, or target scope..."
        bind:value={searchQuery}
        class="h-8 pl-9 text-xs"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <!-- Severity Filter -->
      <div class="w-40">
        <Select
          bind:value={selectedSeverityFilter}
          options={severityFilterOptions}
          class="h-8 text-xs min-h-[32px]"
        />
      </div>

      <!-- Type Filter -->
      <div class="w-48">
        <Select
          bind:value={selectedTypeFilter}
          options={typeFilterOptions}
          class="h-8 text-xs min-h-[32px]"
        />
      </div>
    </div>
  </div>

  <!-- Rules Table -->
  <Card class="border-border bg-card overflow-hidden shadow-xs">
    <div class="overflow-x-auto w-full">
      <Table class="w-full text-left text-xs min-w-[900px]">
        <TableHeader class="bg-muted/50 border-b border-border text-muted-foreground font-mono uppercase tracking-wider text-[11px]">
          <TableRow>
            <TableHead class="px-4 py-3 min-w-[280px]">Rule Definition</TableHead>
            <TableHead class="px-4 py-3 min-w-[130px]">Type</TableHead>
            <TableHead class="px-4 py-3 min-w-[120px]">Severity</TableHead>
            <TableHead class="px-4 py-3 min-w-[240px]">Predicate Condition</TableHead>
            <TableHead class="px-4 py-3 min-w-[140px]">Scope / Target</TableHead>
            <TableHead class="px-4 py-3 text-center w-[80px]">Status</TableHead>
            <TableHead class="px-4 py-3 text-right w-[90px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="divide-y divide-border/60">
          {#if filteredRules.length === 0}
            <TableRow>
              <TableCell colspan={7} class="p-0 border-0">
                <EmptyState
                  icon={ShieldCheck}
                  title={worldStore.rules.length === 0 ? "No Invariant Rules Defined" : "No Matching Invariant Rules"}
                  description={worldStore.rules.length === 0
                    ? "Establish deterministic rules, prerequisites, and state guards to prevent plot holes and causal contradictions."
                    : "No invariant rules match your search query or filter criteria."}
                  actionText={worldStore.rules.length === 0 ? "+ Define First Invariant Rule" : "Clear Filters"}
                  onAction={worldStore.rules.length === 0 ? openAddModal : () => { searchQuery = ""; selectedSeverityFilter = "ALL"; selectedTypeFilter = "ALL"; }}
                  class="border-0 rounded-none bg-transparent py-12"
                />
              </TableCell>
            </TableRow>
          {/if}

          {#each filteredRules as rule}
            <TableRow class="hover:bg-accent/40 transition-colors {rule.enabled ? '' : 'opacity-50'}">
              <!-- Rule Definition -->
              <TableCell class="px-4 py-3.5 font-medium text-foreground min-w-[280px] max-w-sm whitespace-normal break-words">
                <div class="flex items-start gap-2.5">
                  <ShieldCheck class="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <span class="font-bold text-foreground block leading-snug">{rule.name}</span>
                    <p class="text-[11px] text-muted-foreground font-sans mt-0.5 leading-relaxed whitespace-normal break-words">
                      {rule.description}
                    </p>
                    {#if rule.suggestedResolution}
                      <p class="text-[10px] text-muted-foreground/80 font-sans mt-1.5 leading-relaxed whitespace-normal break-words">
                        <strong class="text-foreground/80">Resolution Hint:</strong> {rule.suggestedResolution}
                      </p>
                    {/if}
                  </div>
                </div>
              </TableCell>

              <!-- Rule Type -->
              <TableCell class="px-4 py-3 font-mono text-[11px] min-w-[130px] whitespace-nowrap align-top">
                <span class="text-primary font-medium px-2 py-0.5 rounded bg-primary/10 border border-primary/20 inline-block">
                  {rule.type}
                </span>
              </TableCell>

              <!-- Severity Indicator -->
              <TableCell class="px-4 py-3 font-mono text-[11px] min-w-[120px] whitespace-nowrap align-top">
                {#if rule.severity === "BLOCKING_ERROR"}
                  <span class="inline-flex items-center gap-1.5 text-destructive font-semibold">
                    <ShieldAlert class="w-3.5 h-3.5 text-destructive shrink-0" />
                    BLOCKING
                  </span>
                {:else if rule.severity === "WARNING"}
                  <span class="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <AlertTriangle class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    WARNING
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <Info class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ADVISORY
                  </span>
                {/if}
              </TableCell>

              <!-- Predicate Condition -->
              <TableCell class="px-4 py-3 font-mono text-foreground text-[11px] min-w-[240px] max-w-md whitespace-normal break-words align-top">
                <code class="text-amber-600 dark:text-amber-300 bg-muted/80 px-2.5 py-1.5 rounded border border-border block text-[11px] leading-relaxed whitespace-normal break-words font-mono">
                  {rule.predicateSummary || rule.predicateExpression}
                </code>
              </TableCell>

              <!-- Scope / Target -->
              <TableCell class="px-4 py-3 font-mono text-muted-foreground text-[11px] min-w-[140px] whitespace-normal break-words align-top">
                <span class="text-foreground">{rule.targetBlueprintName || rule.targetCategory || "Universal"}</span>
              </TableCell>

              <!-- Active Toggle -->
              <TableCell class="px-4 py-3 text-center w-[80px] align-top">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked: boolean) => handleToggleRule(rule.id, checked)}
                  aria-label="Toggle rule active state"
                />
              </TableCell>

              <!-- Actions -->
              <TableCell class="px-4 py-3 text-right w-[90px] align-top">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => openEditModal(rule)}
                    class="h-7 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => handleDeleteRule(rule.id, rule.name)}
                    class="h-7 px-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </Card>

  <!-- Delete Confirmation Dialog -->
  <ConfirmDialog
    open={ruleToDelete !== null}
    title="Delete Invariant Rule"
    description={`Are you sure you want to delete "${ruleToDelete?.name}"? This invariant constraint will no longer be checked during narrative continuity audits.`}
    confirmText="Delete Rule"
    onConfirm={confirmDeleteRule}
    onCancel={() => (ruleToDelete = null)}
  />

  <!-- Create / Edit Invariant Rule Modal -->
  {#if isModalOpen}
    <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <Card class="border-border bg-card max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center gap-2 text-amber-500">
            <ShieldCheck class="w-5 h-5" />
            <h3 class="text-base font-bold text-foreground">
              {modalMode === "add" ? "Create Invariant Rule" : "Edit Invariant Rule"}
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="text-muted-foreground hover:text-foreground"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Rule Name -->
          <div class="space-y-1.5">
            <Label for="rule-name">Rule Name <span class="text-destructive">*</span></Label>
            <Input
              id="rule-name"
              bind:value={formName}
              placeholder="e.g. Non-Negative Mana Invariant, Relic Ownership Integrity..."
              class="text-xs"
            />
          </div>

          <!-- Severity & Type Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label for="rule-severity">Severity Level</Label>
              <Select
                id="rule-severity"
                bind:value={formSeverity}
                options={severityOptions}
                class="h-9 text-xs"
              />
            </div>

            <div class="space-y-1.5">
              <Label for="rule-type">Rule Type</Label>
              <Select
                id="rule-type"
                bind:value={formType}
                options={typeOptions}
                class="h-9 text-xs"
              />
            </div>
          </div>

          <!-- Target Blueprint / Scope -->
          <div class="space-y-1.5">
            <Label for="rule-target-bp">Target Blueprint Scope</Label>
            <Select
              id="rule-target-bp"
              bind:value={formTargetBlueprintId}
              options={targetBlueprintOptions}
              placeholder="Select blueprint scope..."
              class="h-9 text-xs"
            />
          </div>

          <!-- Predicate Condition & Summary -->
          <div class="space-y-1.5">
            <Label for="rule-predicate">Predicate Condition (AST Logic) <span class="text-destructive">*</span></Label>
            <Input
              id="rule-predicate"
              bind:value={formPredicateExpression}
              placeholder="e.g. cultivation.major_realm >= 3 or mana_capacity >= 0"
              class="text-xs font-mono text-amber-600 dark:text-amber-300"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="rule-pred-summary">Predicate Human Summary</Label>
            <Input
              id="rule-pred-summary"
              bind:value={formPredicateSummary}
              placeholder="e.g. REQUIRES cultivation.major_realm >= 3 (Core Formation)"
              class="text-xs font-mono"
            />
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <Label for="rule-desc">Rule Rationale & Description</Label>
            <Textarea
              id="rule-desc"
              bind:value={formDescription}
              rows={2}
              placeholder="Explain why this universe law must remain invariant..."
              class="text-xs"
            />
          </div>

          <!-- Suggested Resolution -->
          <div class="space-y-1.5">
            <Label for="rule-resolution">Suggested Editorial Resolution</Label>
            <Input
              id="rule-resolution"
              bind:value={formSuggestedResolution}
              placeholder="e.g. Auto-log breakthrough event or link valid sacred weapon wielder..."
              class="text-xs"
            />
          </div>

          <!-- Active Toggle Switch -->
          <div class="flex items-center gap-2 pt-1">
            <Switch
              id="rule-enabled"
              checked={formEnabled}
              onCheckedChange={(c: boolean) => (formEnabled = c)}
            />
            <Label for="rule-enabled" class="text-xs font-medium text-foreground cursor-pointer">
              Enforce rule actively in real-time continuity audit checks
            </Label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onclick={() => (isModalOpen = false)}>Cancel</Button>
          <Button size="sm" disabled={!formName.trim()} onclick={handleSaveRule}>
            {modalMode === "add" ? "Create Rule" : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  {/if}
</div>
