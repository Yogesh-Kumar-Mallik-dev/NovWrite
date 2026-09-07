<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import {
    GitBranch,
    Workflow,
    Clock,
    BookOpen,
    Check,
    RotateCcw,
    Plus,
    Sparkles,
    Eye,
    ChevronRight,
    ArrowDown,
    FileEdit,
    Sliders,
    Layers,
    Tag,
    Maximize2,
    CornerDownRight,
    Info,
  } from 'lucide-svelte';
  import {
    worldStore,
    type TimelineEventItem,
    type TimelineEffectItem,
    type EditTree,
    type EditNode,
    type RevisionType,
  } from '$lib/stores/worldStore.svelte';
  import { Button, Card, ConfirmDialog, Select } from '$lib/components/ui';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { toast } from '$lib/stores/toastStore.svelte';

  let {
    selectedEventId = $bindable<string | null>(null),
    onSelectEvent,
  }: {
    selectedEventId?: string | null;
    onSelectEvent?: (event: TimelineEventItem) => void;
  } = $props();

  // Sorted timeline events along the horizontal UPDATE pipe
  const sortedEvents = $derived(worldStore.getTimelineEvents('narrative'));

  // Default to first event if none selected
  $effect(() => {
    if (sortedEvents.length > 0 && (!selectedEventId || !sortedEvents.some((e) => e.id === selectedEventId))) {
      selectedEventId = sortedEvents[0].id;
    }
  });

  const activeEvent = $derived(
    sortedEvents.find((e) => e.id === selectedEventId) || sortedEvents[0] || null
  );

  const activeEditTree = $derived<EditTree<TimelineEventItem> | null>(
    activeEvent ? worldStore.getEventEditTree(activeEvent.id) : null
  );

  // Selected edit node for inspecting details
  let inspectedNodeId = $state<string | null>(null);

  // Modal State for Branching / Adding an Edit
  let isAddEditModalOpen = $state(false);
  let branchParentNodeId = $state<string | null>(null);
  let editFormTitle = $state('');
  let editFormDescription = $state('');
  let editFormAuthorNote = $state('');
  let editFormType = $state<RevisionType>('BASELINE_EDIT');
  let editFormNarrativeSeq = $state<number>(100);
  let editFormChronoOrder = $state<number>(100);
  let editFormEffects = $state<TimelineEffectItem[]>([]);

  // Tree Layout Computation
  interface TreeNodeLayout {
    node: EditNode<TimelineEventItem>;
    depth: number;
    branchIndex: number;
    x: number;
    y: number;
    parentX?: number;
    parentY?: number;
  }

  const treeLayout = $derived.by<TreeNodeLayout[]>(() => {
    if (!activeEditTree || !activeEditTree.rootId) return [];

    const result: TreeNodeLayout[] = [];
    const visited = new Set<string>();

    const rootNode = activeEditTree.nodes[activeEditTree.rootId];
    if (!rootNode) return [];

    // Traverse BFS/DFS to assign grid coordinates
    let currentXByDepth: Record<number, number> = {};

    function traverse(nodeId: string, depth: number, parentX?: number, parentY?: number) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = activeEditTree?.nodes[nodeId];
      if (!node) return;

      if (currentXByDepth[depth] === undefined) {
        currentXByDepth[depth] = 0;
      }

      const branchIdx = currentXByDepth[depth];
      currentXByDepth[depth] += 1;

      // Coordinate scaling: Depth is vertical (Y), Branches are horizontal (X)
      const x = branchIdx * 280;
      const y = depth * 140;

      result.push({
        node,
        depth,
        branchIndex: branchIdx,
        x,
        y,
        parentX,
        parentY,
      });

      // Recurse children
      if (node.childrenIds && node.childrenIds.length > 0) {
        for (const childId of node.childrenIds) {
          traverse(childId, depth + 1, x, y);
        }
      }
    }

    traverse(activeEditTree.rootId, 0);
    return result;
  });

  const inspectedNode = $derived<EditNode<TimelineEventItem> | null>(
    activeEditTree && inspectedNodeId
      ? activeEditTree.nodes[inspectedNodeId] || null
      : activeEditTree && activeEditTree.activeEditId
        ? activeEditTree.nodes[activeEditTree.activeEditId] || null
        : null
  );

  function getRevisionTypeBadge(type: RevisionType) {
    switch (type) {
      case 'TYPO_FIX':
        return {
          label: 'Typo Fix',
          class: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        };
      case 'BASELINE_EDIT':
        return {
          label: 'Baseline Edit',
          class: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
        };
      case 'RETROACTIVE_PLOT_FIX':
        return {
          label: 'Retroactive Plot Fix',
          class: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
        };
      case 'REVERT':
        return {
          label: 'Non-Destructive Revert',
          class: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
        };
      default:
        return {
          label: type,
          class: 'bg-muted text-muted-foreground border-border',
        };
    }
  }

  function handleSelectEvent(ev: TimelineEventItem) {
    selectedEventId = ev.id;
    inspectedNodeId = null;
    if (onSelectEvent) onSelectEvent(ev);
  }

  function handleCheckoutHead(nodeId: string) {
    if (!activeEvent) return;
    const restoredNode = worldStore.checkoutEventEdit(activeEvent.id, nodeId);
    if (restoredNode) {
      toast.success(
        'EDIT Head Checked Out',
        `Active head moved to ${restoredNode.label || 'ED' + restoredNode.revisionNumber}. Children branches remain fully intact.`
      );
      inspectedNodeId = nodeId;
    }
  }

  function openBranchModal(parentNodeId?: string) {
    if (!activeEvent || !activeEditTree) return;
    const targetParent = parentNodeId || activeEditTree.activeEditId;
    branchParentNodeId = targetParent;

    const parentNode = activeEditTree.nodes[targetParent];
    const snap = parentNode ? parentNode.snapshot : activeEvent;

    editFormTitle = snap.title;
    editFormDescription = snap.description || '';
    editFormAuthorNote = '';
    editFormType = 'BASELINE_EDIT';
    editFormNarrativeSeq = snap.narrativeSequenceNumber;
    editFormChronoOrder = snap.chronologicalOrder;
    editFormEffects = JSON.parse(JSON.stringify(snap.effects || []));

    isAddEditModalOpen = true;
  }

  function handleSaveBranchEdit() {
    if (!activeEvent || !activeEditTree || !editFormTitle.trim()) return;

    const newSnapshot: TimelineEventItem = {
      id: activeEvent.id,
      title: editFormTitle.trim(),
      description: editFormDescription.trim(),
      narrativeSequenceNumber: Number(editFormNarrativeSeq),
      chronologicalOrder: Number(editFormChronoOrder),
      anchorChapterTitle: activeEvent.anchorChapterTitle,
      anchorSceneTitle: activeEvent.anchorSceneTitle,
      anchorSceneId: activeEvent.anchorSceneId,
      effects: editFormEffects,
      createdAt: new Date().toISOString(),
    };

    const newNode = worldStore.addEventEdit(
      activeEvent.id,
      newSnapshot,
      editFormAuthorNote.trim() || 'Branched edit',
      editFormType,
      branchParentNodeId || undefined
    );

    toast.success(
      'New Edit Branched',
      `Created ${newNode.label || 'ED' + newNode.revisionNumber} branching from ${branchParentNodeId ? 'parent node' : 'active head'}.`
    );

    inspectedNodeId = newNode.id;
    isAddEditModalOpen = false;
  }
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && isAddEditModalOpen) isAddEditModalOpen = false; }} />

<div class="space-y-6">
  <!-- Top Visual Banner: The Horizontal UPDATE Pipe -->
  <Card class="border-border bg-card/80 p-5 shadow-sm space-y-4 overflow-hidden relative">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Workflow class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-foreground tracking-tight">
              The UPDATE Narrative Pipe
            </h3>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold uppercase tracking-wider">
              Horizontal Plot Axis (T_story)
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5">
            Story milestone progression across events. Each event on the pipe carries an independent, non-destructive hanging EDIT Tree.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 font-mono text-xs">
        <span class="text-muted-foreground">Pipe Events:</span>
        <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
          {sortedEvents.length} Events on Stream
        </span>
      </div>
    </div>

    <!-- The Horizontal Conduit Scroll View -->
    <div class="overflow-x-auto pb-4 pt-2 -mx-2 px-2">
      <div class="flex items-center min-w-max gap-0 relative">
        {#if sortedEvents.length === 0}
          <div class="py-8 text-center text-xs text-muted-foreground w-full font-mono">
            No events on the timeline pipe yet. Create a timeline event to start the causal stream.
          </div>
        {:else}
          {#each sortedEvents as ev, idx (ev.id)}
            {@const isSelected = selectedEventId === ev.id}
            {@const evTree = worldStore.getEventEditTree(ev.id)}
            {@const activeNode = evTree ? evTree.nodes[evTree.activeEditId] : null}
            {@const nodeCount = evTree ? Object.keys(evTree.nodes).length : 1}

            <!-- Pipe Event Node -->
            <div class="flex items-center">
              <button
                type="button"
                onclick={() => handleSelectEvent(ev)}
                class="group flex flex-col items-start p-3.5 rounded-xl border transition-all text-left w-64 relative {isSelected
                  ? 'bg-primary/10 border-primary shadow-md ring-2 ring-primary/30 z-10'
                  : 'bg-card border-border hover:border-primary/50 hover:bg-card/90'}"
              >
                <!-- Top Sequence & Edit Count Badge -->
                <div class="flex items-center justify-between w-full mb-1.5 font-mono">
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded {isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}">
                    Seq #{ev.narrativeSequenceNumber}
                  </span>
                  <span class="text-[10px] text-muted-foreground flex items-center gap-1">
                    <GitBranch class="w-3 h-3 text-primary" />
                    <span>{nodeCount} {nodeCount === 1 ? 'edit' : 'edits'}</span>
                  </span>
                </div>

                <!-- Event Title -->
                <h4 class="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {ev.title}
                </h4>

                {#if ev.anchorChapterTitle}
                  <span class="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {ev.anchorChapterTitle}
                  </span>
                {/if}

                <!-- Active EDIT Head Indicator Pill -->
                <div class="mt-2.5 pt-2 border-t border-border/60 w-full flex items-center justify-between text-[10px] font-mono">
                  <span class="text-muted-foreground">Active Head:</span>
                  <span class="font-bold text-primary flex items-center gap-1">
                    <span class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                    {activeNode?.label || `ED${activeNode?.revisionNumber ?? 0}`}
                  </span>
                </div>
              </button>

              <!-- Conduit Connection Pipe Line between events -->
              {#if idx < sortedEvents.length - 1}
                <div class="flex items-center justify-center w-12 relative px-1">
                  <!-- Pipe Tube Background -->
                  <div class="h-2 w-full bg-muted rounded-full overflow-hidden border border-border flex items-center">
                    <!-- Glowing Fluid Pulse Animation -->
                    <div class="h-full w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30 animate-pulse"></div>
                  </div>
                  <!-- Arrow Head Indicator -->
                  <ChevronRight class="w-4 h-4 text-primary absolute -right-1" />
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </Card>

  <!-- Hanging EDIT Tree Viewport (Vertical Tree Hanging From Selected Pipe Event) -->
  {#if activeEvent && activeEditTree}
    <div class="grid grid-cols-12 gap-5">
      <!-- Left 8 Columns: Interactive Visual Tree DAG Canvas -->
      <div class="col-span-12 lg:col-span-8 flex flex-col">
        <Card class="border-border bg-card p-5 shadow-sm flex flex-col space-y-4 flex-1">
          <!-- Tree Section Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <GitBranch class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-foreground">
                    Hanging EDIT Tree
                  </h3>
                  <span class="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold font-mono">
                    {activeEvent.title}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Non-destructive branching tree. Checking out an earlier edit preserves all children as branches.
                </p>
              </div>
            </div>

            <!-- Branch New Edit Action -->
            <Button
              size="sm"
              onclick={() => openBranchModal(activeEditTree.activeEditId)}
              class="h-8 text-xs flex items-center gap-1.5"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Branch Edit From Head</span>
            </Button>
          </div>

          <!-- Hanging Tree Canvas Area -->
          <div class="relative overflow-x-auto p-4 bg-muted/20 rounded-xl border border-border min-h-[380px] flex justify-center items-start">
            {#if treeLayout.length === 0}
              <div class="py-16 text-center text-xs text-muted-foreground font-mono">
                No edit nodes found in tree.
              </div>
            {:else}
              <div class="relative w-full max-w-2xl py-4 flex flex-col items-center space-y-8">
                <!-- Top Hanging Pipe Anchor -->
                <div class="flex flex-col items-center">
                  <div class="px-3 py-1 rounded-full bg-primary/20 border border-primary text-primary text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                    <Workflow class="w-3 h-3" />
                    <span>UPDATE Pipe: Event #{activeEvent.narrativeSequenceNumber}</span>
                  </div>
                  <!-- Hanging Conduit Pipe Line -->
                  <div class="w-1 h-6 bg-gradient-to-b from-primary to-primary/40"></div>
                </div>

                <!-- Tree Nodes Rendered with Connectors -->
                <div class="w-full flex flex-col items-center space-y-6">
                  {#each treeLayout as layout (layout.node.id)}
                    {@const node = layout.node}
                    {@const isHead = activeEditTree.activeEditId === node.id}
                    {@const isInspected = inspectedNode?.id === node.id}
                    {@const badge = getRevisionTypeBadge(node.type)}
                    {@const hasChildren = node.childrenIds && node.childrenIds.length > 0}

                    <div class="w-full max-w-lg flex flex-col items-center relative">
                      <!-- Edit Node Card -->
                      <div
                        class="w-full p-4 rounded-xl border transition-all shadow-xs relative {isHead
                          ? 'bg-primary/10 border-primary shadow-md ring-2 ring-primary/30'
                          : isInspected
                            ? 'bg-card border-primary/60 ring-1 ring-primary/20'
                            : 'bg-card border-border hover:border-primary/40'}"
                      >
                        <!-- Node Top Badges -->
                        <div class="flex items-center justify-between gap-2 mb-2">
                          <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded font-mono text-xs font-bold {isHead ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}">
                              {node.label || `ED${node.revisionNumber}`}
                            </span>
                            <span class="text-[10px] px-2 py-0.5 rounded border font-medium {badge.class}">
                              {badge.label}
                            </span>
                          </div>

                          {#if isHead}
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold flex items-center gap-1 shadow-xs animate-pulse">
                              <Check class="w-3 h-3" />
                              <span>ACTIVE EDIT HEAD</span>
                            </span>
                          {/if}
                        </div>

                        <!-- Node Snapshot Title & Author Note -->
                        <h5 class="text-xs font-bold text-foreground">
                          "{node.snapshot.title}"
                        </h5>

                        {#if node.authorNote}
                          <p class="text-xs text-foreground/80 font-medium italic mt-1 bg-muted/40 p-2 rounded border border-border/50">
                            "{node.authorNote}"
                          </p>
                        {/if}

                        <!-- Timestamp & Children Branches Count -->
                        <div class="flex items-center justify-between text-[10px] text-muted-foreground mt-3 pt-2.5 border-t border-border/60 font-mono">
                          <span>
                            {new Date(node.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(node.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            {node.childrenIds.length} Child {node.childrenIds.length === 1 ? 'Branch' : 'Branches'}
                          </span>
                        </div>

                        <!-- Node Action Buttons -->
                        <div class="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-border/40">
                          <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => (inspectedNodeId = node.id)}
                            class="h-7 px-2 text-[11px] flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Eye class="w-3 h-3" />
                            <span>Inspect</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onclick={() => openBranchModal(node.id)}
                            class="h-7 px-2.5 text-[11px] flex items-center gap-1 hover:text-primary hover:border-primary/40"
                          >
                            <CornerDownRight class="w-3 h-3" />
                            <span>Branch From Here</span>
                          </Button>

                          {#if !isHead}
                            <Button
                              variant="default"
                              size="sm"
                              onclick={() => handleCheckoutHead(node.id)}
                              class="h-7 px-2.5 text-[11px] flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                            >
                              <RotateCcw class="w-3 h-3" />
                              <span>Checkout Head</span>
                            </Button>
                          {/if}
                        </div>
                      </div>

                      <!-- Vertical Connector to Children -->
                      {#if hasChildren}
                        <div class="flex flex-col items-center my-1">
                          <div class="w-0.5 h-6 bg-border"></div>
                          <ArrowDown class="w-3.5 h-3.5 text-muted-foreground -mt-1" />
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </Card>
      </div>

      <!-- Right 4 Columns: Edit Node Inspector & Effect Delta Breakdown -->
      <div class="col-span-12 lg:col-span-4 flex flex-col">
        <Card class="border-border bg-card p-5 shadow-sm flex flex-col space-y-4 flex-1">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <div class="flex items-center gap-2">
              <FileEdit class="w-4 h-4 text-primary" />
              <h4 class="text-sm font-bold text-foreground">
                Edit Node Details
              </h4>
            </div>
            {#if inspectedNode}
              <span class="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                {inspectedNode.label || `ED${inspectedNode.revisionNumber}`}
              </span>
            {/if}
          </div>

          {#if inspectedNode}
            <div class="space-y-4 text-xs font-sans">
              <!-- Summary Properties -->
              <div class="p-3 rounded-lg bg-muted/40 border border-border space-y-2 font-mono">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-muted-foreground">Revision Number:</span>
                  <span class="font-bold text-foreground">#{inspectedNode.revisionNumber}</span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-muted-foreground">Revision Type:</span>
                  <span class="font-bold text-primary">{inspectedNode.type}</span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-muted-foreground">Parent Node ID:</span>
                  <span class="text-muted-foreground truncate max-w-[150px]">
                    {inspectedNode.parentId || '(Root / None)'}
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-muted-foreground">Is Active EDIT Head:</span>
                  <span class="font-bold {activeEditTree.activeEditId === inspectedNode.id ? 'text-emerald-500' : 'text-muted-foreground'}">
                    {activeEditTree.activeEditId === inspectedNode.id ? 'YES (Active)' : 'NO'}
                  </span>
                </div>
              </div>

              <!-- Snapshot Content -->
              <div class="space-y-1.5">
                <span class="text-[11px] uppercase font-bold text-muted-foreground font-mono">
                  Event Title at this Edit
                </span>
                <p class="font-semibold text-foreground p-2.5 rounded bg-card border border-border">
                  {inspectedNode.snapshot.title}
                </p>
              </div>

              {#if inspectedNode.snapshot.description}
                <div class="space-y-1.5">
                  <span class="text-[11px] uppercase font-bold text-muted-foreground font-mono">
                    Description
                  </span>
                  <p class="text-muted-foreground p-2.5 rounded bg-card border border-border text-xs leading-relaxed">
                    {inspectedNode.snapshot.description}
                  </p>
                </div>
              {/if}

              <!-- Atomic Effects Snapshot -->
              <div class="space-y-2 pt-2 border-t border-border">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] uppercase font-bold text-muted-foreground font-mono flex items-center gap-1">
                    <Sparkles class="w-3.5 h-3.5 text-primary" />
                    <span>Atomic Delta Effects ({inspectedNode.snapshot.effects?.length || 0})</span>
                  </span>
                </div>

                {#if !inspectedNode.snapshot.effects || inspectedNode.snapshot.effects.length === 0}
                  <div class="p-3 rounded bg-muted/30 text-center text-xs text-muted-foreground font-mono">
                    No effects configured in this edit.
                  </div>
                {:else}
                  <div class="space-y-1.5 font-mono text-[11px] max-h-52 overflow-y-auto pr-1">
                    {#each inspectedNode.snapshot.effects as eff}
                      <div class="p-2 rounded border border-border bg-muted/30 flex items-center justify-between">
                        <div>
                          <span class="font-bold text-primary">{eff.entityName || eff.targetEntityId}</span>
                          <span class="text-muted-foreground">.{eff.propertyKey}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <span class="px-1.5 py-0.5 rounded bg-background border text-[10px] font-bold uppercase">
                            {eff.operation}
                          </span>
                          <span class="text-amber-500 font-bold">{JSON.stringify(eff.value)}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- Quick Action inside Inspector -->
              {#if activeEditTree.activeEditId !== inspectedNode.id}
                <Button
                  variant="default"
                  size="sm"
                  onclick={() => inspectedNode && handleCheckoutHead(inspectedNode.id)}
                  class="w-full mt-2 text-xs flex items-center justify-center gap-1.5 bg-primary text-primary-foreground"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Checkout This Node as Active EDIT Head</span>
                </Button>
              {/if}
            </div>
          {/if}
        </Card>
      </div>
    </div>
  {/if}

  <!-- Modal: Branch / Add New Edit Node -->
  {#if isAddEditModalOpen}
    <div
      transition:fade={{ duration: 150 }}
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop Click to Close -->
      <button
        type="button"
        class="fixed inset-0 cursor-default bg-transparent border-0"
        onclick={() => (isAddEditModalOpen = false)}
        tabindex="-1"
        aria-hidden="true"
      ></button>

      <div
        transition:scale={{ start: 0.96, duration: 150 }}
        class="relative z-10 w-full max-w-xl my-4 sm:my-8"
      >
        <Card class="border-border bg-card w-full p-4 sm:p-6 space-y-5 shadow-2xl max-h-[min(90dvh,800px)] overflow-y-auto">
          <div class="flex items-center gap-2 text-primary border-b border-border pb-3">
            <GitBranch class="w-5 h-5" />
            <h3 class="text-base font-bold text-foreground">
              Branch New Edit Node
            </h3>
          </div>

          <div class="space-y-4 text-xs font-sans">
            <!-- Parent Info -->
            <div class="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between font-mono">
              <span class="text-primary font-bold">Branching Parent Node:</span>
              <span class="text-foreground font-semibold">
                {branchParentNodeId ? `Node (${branchParentNodeId.slice(0, 12)}...)` : 'Active Head'}
              </span>
            </div>

            <!-- Edit Title -->
            <div class="space-y-1.5">
              <Label for="branch-title">Edit / Revision Title <span class="text-destructive">*</span></Label>
              <Input
                id="branch-title"
                bind:value={editFormTitle}
                placeholder="e.g. Altered outcome: Lin Fan uses sword instead of talisman..."
                class="text-xs"
              />
            </div>

            <!-- Revision Type & Author Note -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="branch-type">Revision Classification</Label>
                <Select
                  id="branch-type"
                  bind:value={editFormType}
                  options={[
                    { value: 'BASELINE_EDIT', label: 'Baseline Narrative Edit' },
                    { value: 'CANON_FORK', label: 'Canon Multi-Timeline Fork' },
                    { value: 'TYPO_FIX', label: 'Typo / Label Fix' },
                    { value: 'RETROACTIVE_PLOT_FIX', label: 'Retroactive Plot Fix' },
                  ]}
                  class="h-9 text-xs"
                />
              </div>

              <div class="space-y-1.5">
                <Label for="branch-author">Author Editorial Rationale</Label>
                <Input
                  id="branch-author"
                  bind:value={editFormAuthorNote}
                  placeholder="e.g. Exploring darker alternative ending..."
                  class="text-xs"
                />
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <Label for="branch-desc">Revision Manuscript Notes</Label>
              <Textarea
                id="branch-desc"
                bind:value={editFormDescription}
                rows={2}
                placeholder="Narrative description for this revision..."
                class="text-xs"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onclick={() => (isAddEditModalOpen = false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!editFormTitle.trim()} onclick={handleSaveBranchEdit}>
              Create & Checkout Branch
            </Button>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>
