<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { AlertTriangle, Info } from "lucide-svelte";

  interface Props {
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default";
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    open = false,
    title,
    description,
    confirmText = "Delete",
    cancelText = "Cancel",
    variant = "destructive",
    onConfirm,
    onCancel,
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
    aria-describedby="confirm-dialog-description"
  >
    <!-- Click outside to cancel -->
    <button
      type="button"
      class="fixed inset-0 cursor-default bg-transparent border-0"
      onclick={onCancel}
      tabindex="-1"
      aria-hidden="true"
    ></button>

    <div
      transition:scale={{ start: 0.96, duration: 150 }}
      class="relative z-10 w-full max-w-md"
    >
      <Card
        class="border-border bg-card p-4 sm:p-6 space-y-4 shadow-2xl max-h-[min(90dvh,600px)] overflow-y-auto"
      >
        <div class="flex items-start gap-3">
          <div
            class="p-2 rounded-lg {variant === 'destructive'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary/10 text-primary'} mt-0.5 shrink-0"
          >
            {#if variant === "destructive"}
              <AlertTriangle class="w-5 h-5" />
            {:else}
              <Info class="w-5 h-5" />
            {/if}
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              class="text-base font-bold text-foreground leading-snug"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-description"
              class="text-xs text-muted-foreground mt-1.5 leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>

        <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onclick={onCancel}
            class="h-8 px-3 text-xs w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onclick={onConfirm}
            class="h-8 px-3 text-xs font-semibold w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  </div>
{/if}
