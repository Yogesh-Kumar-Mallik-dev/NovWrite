<script lang="ts">
  import { MockBridgeService, DEMO_PROJECT_ID, ELDRIN_ENTITY_ID, MALAKOR_ENTITY_ID } from '@novwrite/bridge';
  import { Activity, Play, RefreshCw, AlertTriangle, CheckCircle, Terminal, Cpu } from 'lucide-svelte';

  const bridge = new MockBridgeService();

  let activeTab = $state<'grounding' | 'continuity' | 'mentions'>('continuity');
  let isExecuting = $state(false);
  let requestLog = $state<Array<{ id: string; timestamp: string; type: string; status: string; payload: any; response: any }>>([]);

  let selectedLog = $state<any>(null);

  async function runTestGrounding() {
    isExecuting = true;
    const req = {
      projectId: DEMO_PROJECT_ID,
      sceneId: 'd1111111-1111-1111-1111-111111111111',
      targetSequenceNumber: 50,
      mentionedEntityIds: [ELDRIN_ENTITY_ID]
    };

    try {
      const res = await bridge.getSceneGrounding(req);
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'SceneGroundingRequest',
        status: 'SUCCESS',
        payload: req,
        response: res
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
      sceneId: 'd2222222-2222-2222-2222-222222222222',
      sequenceNumber: 160,
      draftEvents: [
        {
          entityId: MALAKOR_ENTITY_ID,
          eventType: 'CAST_SPELL',
          delta: { spell_name: 'Void Siphon', mana_cost: 600 }
        }
      ]
    };

    try {
      const res = await bridge.validateProseContinuity(req);
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ContinuityAuditRequest',
        status: res.status,
        payload: req,
        response: res
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
      queryToken: 'eldrin'
    };

    try {
      const res = await bridge.suggestEntityMentions(req);
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'EntityMentionQuery',
        status: 'SUCCESS',
        payload: req,
        response: res
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
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <div class="flex items-center gap-2">
        <Activity class="w-5 h-5 text-emerald-400" />
        <h1 class="text-2xl font-bold tracking-tight">Communication Bridge Diagnostics Hub</h1>
      </div>
      <p class="text-sm text-zinc-400 mt-1">
        Centralized console to inspect cross-domain RPC contracts, simulate payloads, and diagnose continuity violations in one page.
      </p>
    </div>

    <!-- Quick Action Triggers -->
    <div class="flex items-center gap-2">
      <button
        onclick={runTestViolation}
        disabled={isExecuting}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900 transition-colors"
      >
        <Play class="w-3.5 h-3.5" />
        Test Invariant Violation (Malakor)
      </button>
      <button
        onclick={runTestGrounding}
        disabled={isExecuting}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-purple-950/80 border border-purple-800 text-purple-300 hover:bg-purple-900 transition-colors"
      >
        <Play class="w-3.5 h-3.5" />
        Test Grounding (Eldrin)
      </button>
      <button
        onclick={runTestMentions}
        disabled={isExecuting}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
      >
        <Play class="w-3.5 h-3.5" />
        Test Mentions Autocomplete
      </button>
    </div>
  </div>

  <!-- Main Grid: Traffic Inspector & Detail Inspector -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
    <!-- Left: Traffic Table -->
    <div class="lg:col-span-5 flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
      <div class="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300">
        <span class="flex items-center gap-1.5">
          <Terminal class="w-3.5 h-3.5 text-zinc-400" />
          Cross-Space RPC Stream ({requestLog.length})
        </span>
        <span class="text-zinc-500 font-mono">Channel: @novwrite/bridge</span>
      </div>

      <div class="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
        {#if requestLog.length === 0}
          <div class="p-8 text-center text-zinc-500 text-xs">No cross-space requests captured yet.</div>
        {:else}
          {#each requestLog as log (log.id)}
            <button
              onclick={() => { selectedLog = log; }}
              class="w-full text-left p-3 hover:bg-zinc-800/50 transition-colors flex items-start justify-between gap-3 text-xs {selectedLog?.id === log.id ? 'bg-zinc-800/80 border-l-2 border-purple-500' : ''}"
            >
              <div>
                <div class="font-mono font-medium text-zinc-200">{log.type}</div>
                <div class="text-[10px] text-zinc-500 font-mono mt-0.5">{log.timestamp} · ID: {log.id.slice(0, 8)}</div>
              </div>

              {#if log.status === 'VIOLATION_DETECTED'}
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-950 text-red-400 border border-red-800">
                  <AlertTriangle class="w-3 h-3" /> VIOLATION
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <CheckCircle class="w-3 h-3" /> OK
                </span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Right: Payload & RFC 7807 Detail Inspector -->
    <div class="lg:col-span-7 flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
      <div class="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300">
        <span class="flex items-center gap-1.5">
          <Cpu class="w-3.5 h-3.5 text-purple-400" />
          Contract Payload Inspector
        </span>
        {#if selectedLog}
          <span class="font-mono text-zinc-400 text-[11px]">{selectedLog.type}</span>
        {/if}
      </div>

      <div class="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4">
        {#if !selectedLog}
          <div class="text-zinc-500 text-center py-12">Select a request from the stream to inspect payload details.</div>
        {:else}
          <!-- Violation Banner if detected -->
          {#if selectedLog.response?.violations && selectedLog.response.violations.length > 0}
            <div class="p-3.5 rounded bg-red-950/40 border border-red-900 text-red-200 text-xs">
              <div class="flex items-center gap-1.5 font-bold text-red-400 mb-1">
                <AlertTriangle class="w-4 h-4" />
                RFC 7807 Invariant Violation Detected: {selectedLog.response.violations[0].code}
              </div>
              <p class="text-zinc-300">{selectedLog.response.violations[0].message}</p>
              <div class="mt-2 text-[10px] text-red-400/80">
                Rule: {selectedLog.response.violations[0].ruleName} · Spec URI: {selectedLog.response.violations[0].rfc7807Uri}
              </div>
            </div>
          {/if}

          <!-- Request Payload -->
          <div>
            <div class="text-zinc-400 text-[11px] font-semibold mb-1">Request Payload (from Novel Space):</div>
            <pre class="p-3 bg-zinc-950 rounded border border-zinc-800 text-zinc-300 overflow-x-auto text-[11px]">{JSON.stringify(selectedLog.payload, null, 2)}</pre>
          </div>

          <!-- Response Payload -->
          <div>
            <div class="text-zinc-400 text-[11px] font-semibold mb-1">Response Payload (from World Engine):</div>
            <pre class="p-3 bg-zinc-950 rounded border border-zinc-800 text-purple-300 overflow-x-auto text-[11px]">{JSON.stringify(selectedLog.response, null, 2)}</pre>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
