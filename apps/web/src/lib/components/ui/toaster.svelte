<script lang="ts">
  import { toast, type ToastItem } from "$lib/stores/toastStore.svelte";
  import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    X,
  } from "lucide-svelte";
</script>

<div
  class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4 sm:p-0"
  aria-live="polite"
  aria-label="Notifications"
>
  {#each toast.items as item (item.id)}
    <div
      class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card text-card-foreground shadow-lg transition-all animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
      role="alert"
    >
      {#if item.type === "success"}
        <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      {:else if item.type === "error"}
        <AlertCircle class="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      {:else if item.type === "warning"}
        <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      {:else}
        <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
      {/if}

      <div class="min-w-0 flex-1">
        <h5 class="text-xs font-semibold text-foreground leading-snug">
          {item.title}
        </h5>
        {#if item.description}
          <p class="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {item.description}
          </p>
        {/if}
      </div>

      <button
        type="button"
        onclick={() => toast.remove(item.id)}
        class="text-muted-foreground hover:text-foreground transition-colors p-0.5 -mr-1 -mt-1 cursor-pointer rounded hover:bg-muted"
        aria-label="Dismiss notification"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  {/each}
</div>
