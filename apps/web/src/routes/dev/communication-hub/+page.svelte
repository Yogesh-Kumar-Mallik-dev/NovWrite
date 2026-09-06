<script lang="ts">
  import {
    MockBridgeService,
    DEMO_PROJECT_ID,
    ELDRIN_ENTITY_ID,
    MALAKOR_ENTITY_ID,
  } from "@novwrite/bridge";
  import {
    Activity,
    Play,
    AlertTriangle,
    CheckCircle,
    Terminal,
    Cpu,
  } from "lucide-svelte";

  import Button from "$lib/components/ui/button.svelte";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
  } from "$lib/components/ui/card";

  const bridge = new MockBridgeService();

  let activeTab = $state<"grounding" | "continuity" | "mentions">("continuity");
  let isExecuting = $state(false);
  let requestLog = $state<
    Array<{
      id: string;
      timestamp: string;
      type: string;
      status: string;
      payload: any;
      response: any;
    }>
  >([]);

  let selectedLog = $state<any>(null);

  async function runTestGrounding() {
    isExecuting = true;
    const req = {
      projectId: DEMO_PROJECT_ID,
      sceneId: "d1111111-1111-1111-1111-111111111111",
      targetSequenceNumber: 50,
      mentionedEntityIds: [ELDRIN_ENTITY_ID],
    };

    try {
      const res = await bridge.getSceneGrounding(req);
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: "SceneGroundingRequest",
        status: "SUCCESS",
        payload: req,
        response: res,
      };
      requestLog = [entry, ...requestLog];
      selectedLog = entry;
    } finally {
      isExecuting = false;
    }
  }

  async function runTestViolation() {
    isExecuting = true;
    const req = {
      projectId: DEMO_PROJECT_ID,
      sceneId: "d2222222-2222-2222-2222-222222222222",
      sequenceNumber: 160,
      draftEvents: [
        {
          entityId: MALAKOR_ENTITY_ID,
          eventType: "CAST_SPELL",
          delta: { spell_name: "Void Siphon", mana_cost: 600 },
        },
      ],
    };

    try {
      const res = await bridge.validateProseContinuity(req);
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: "ContinuityAuditRequest",
        status: res.status,
        payload: req,
        response: res,
      };
      requestLog = [entry, ...requestLog];
      selectedLog = entry;
    } finally {
      isExecuting = false;
    }
  }

  async function runTestMentions() {
    isExecuting = true;
    const req = {
      projectId: DEMO_PROJECT_ID,
      queryToken: "eldrin",
    };

    try {
      const res = await bridge.suggestEntityMentions(req);
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: "EntityMentionQuery",
        status: "SUCCESS",
        payload: req,
        response: res,
      };
      requestLog = [entry, ...requestLog];
      selectedLog = entry;
    } finally {
      isExecuting = false;
    }
  }

  // Run a default test on mount
  $effect(() => {
    if (requestLog.length === 0) {
      runTestViolation();
    }
  });
</script>

<div class="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
    <div>
      <div class="flex items-center gap-2">
        <Activity class="w-5 h-5 text-emerald-500" />
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Communication Bridge Diagnostics Hub
        </h1>
      </div>
      <p class="text-sm text-muted-foreground mt-1">
        Centralized console to inspect cross-domain RPC contracts, simulate
        payloads, and diagnose continuity violations in one page.
      </p>
    </div>

    <!-- Quick Action Triggers -->
    <div class="flex flex-wrap items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        onclick={runTestViolation}
        disabled={isExecuting}
      >
        <Play class="w-3.5 h-3.5 mr-1" />
        <span>Test Invariant Violation</span>
      </Button>
      <Button
        variant="default"
        size="sm"
        onclick={runTestGrounding}
        disabled={isExecuting}
      >
        <Play class="w-3.5 h-3.5 mr-1" />
        <span>Test Grounding</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onclick={runTestMentions}
        disabled={isExecuting}
      >
        <Play class="w-3.5 h-3.5 mr-1" />
        <span>Test Mentions</span>
      </Button>
    </div>
  </div>

  <!-- Main Grid: Traffic Inspector & Detail Inspector -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
    <!-- Left: Traffic Table -->
    <Card class="lg:col-span-5 flex flex-col overflow-hidden bg-card border-border shadow-xs">
      <div
        class="bg-muted/60 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs font-semibold text-foreground"
      >
        <span class="flex items-center gap-1.5">
          <Terminal class="w-3.5 h-3.5 text-muted-foreground" />
          Cross-Space RPC Stream ({requestLog.length})
        </span>
        <span class="text-muted-foreground font-mono text-[11px]">Channel: @novwrite/bridge</span>
      </div>

      <div class="flex-1 overflow-y-auto divide-y divide-border">
        {#if requestLog.length === 0}
          <div class="p-8 text-center text-muted-foreground text-xs">
            No cross-space requests captured yet.
          </div>
        {:else}
          {#each requestLog as log (log.id)}
            <button
              onclick={() => {
                selectedLog = log;
              }}
              class="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start justify-between gap-3 text-xs {selectedLog?.id ===
              log.id
                ? 'bg-muted border-l-2 border-primary'
                : ''}"
            >
              <div>
                <div class="font-mono font-medium text-foreground">
                  {log.type}
                </div>
                <div class="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {log.timestamp} · ID: {log.id.slice(0, 8)}
                </div>
              </div>

              {#if log.status === "VIOLATION_DETECTED"}
                <span class="flex items-center gap-1 text-[11px] font-mono font-semibold text-destructive">
                  <AlertTriangle class="w-3.5 h-3.5" /> VIOLATION
                </span>
              {:else}
                <span class="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle class="w-3.5 h-3.5" /> OK
                </span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </Card>

    <!-- Right: Payload & RFC 7807 Detail Inspector -->
    <Card class="lg:col-span-7 flex flex-col overflow-hidden bg-card border-border shadow-xs">
      <div
        class="bg-muted/60 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs font-semibold text-foreground"
      >
        <span class="flex items-center gap-1.5">
          <Cpu class="w-3.5 h-3.5 text-primary" />
          Contract Payload Inspector
        </span>
        {#if selectedLog}
          <span class="font-mono text-muted-foreground text-[11px]"
            >{selectedLog.type}</span
          >
        {/if}
      </div>

      <div class="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4">
        {#if !selectedLog}
          <div class="text-muted-foreground text-center py-12">
            Select a request from the stream to inspect payload details.
          </div>
        {:else}
          <!-- Violation Banner if detected -->
          {#if selectedLog.response?.violations && selectedLog.response.violations.length > 0}
            <div
              class="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs"
            >
              <div
                class="flex items-center gap-1.5 font-bold mb-1"
              >
                <AlertTriangle class="w-4 h-4" />
                RFC 7807 Invariant Violation Detected: {selectedLog.response
                  .violations[0].code}
              </div>
              <p class="text-foreground/90 font-sans text-xs">
                {selectedLog.response.violations[0].message}
              </p>
              <div class="mt-2 text-[10px] text-destructive/80 font-mono">
                Rule: {selectedLog.response.violations[0].ruleName} · Spec URI: {selectedLog
                  .response.violations[0].rfc7807Uri}
              </div>
            </div>
          {/if}

          <!-- Request Payload -->
          <div>
            <div class="text-muted-foreground text-[11px] font-semibold mb-1 font-sans">
              Request Payload (from Novel Space):
            </div>
            <pre
              class="p-3 bg-muted/40 rounded-lg border border-border text-foreground overflow-x-auto text-[11px] font-mono">{JSON.stringify(
                selectedLog.payload,
                null,
                2,
              )}</pre>
          </div>

          <!-- Response Payload -->
          <div>
            <div class="text-muted-foreground text-[11px] font-semibold mb-1 font-sans">
              Response Payload (from World Engine):
            </div>
            <pre
              class="p-3 bg-muted/40 rounded-lg border border-border text-primary overflow-x-auto text-[11px] font-mono">{JSON.stringify(
                selectedLog.response,
                null,
                2,
              )}</pre>
          </div>
        {/if}
      </div>
    </Card>
  </div>
</div>
