<script lang="ts">
  import { fly } from "svelte/transition";
  import { toast, type ToastItem } from "$lib/stores/toastStore.svelte";
  import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
  } from "lucide-svelte";
</script>

<div
  class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4 sm:p-0"
  aria-live="polite"
  aria-label="Notifications"
>
  {#each toast.items as item (item.id)}
    <div
      transition:fly={{ y: 16, duration: 180 }}
      class="pointer-events-auto"
      role="alert"
    >
      <button
        type="button"
        class="w-full flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card text-card-foreground shadow-lg transition-all duration-150 text-left cursor-pointer hover:bg-card/90 active:scale-[0.99]"
        onclick={() => toast.remove(item.id)}
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
      </button>
    </div>
  {/each}
</div>
