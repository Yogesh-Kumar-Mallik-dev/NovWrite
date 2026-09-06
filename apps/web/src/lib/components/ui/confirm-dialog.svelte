<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { AlertTriangle, Info, X } from "lucide-svelte";

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
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
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

    <Card
      class="relative z-10 border-border bg-card max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
    >
      <div class="flex items-start justify-between gap-3">
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

        <button
          type="button"
          onclick={onCancel}
          class="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer -mr-2 -mt-2"
          aria-label="Close dialog"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onclick={onCancel}
          class="h-8 px-3 text-xs"
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          size="sm"
          onclick={onConfirm}
          class="h-8 px-3 text-xs font-semibold"
        >
          {confirmText}
        </Button>
      </div>
    </Card>
  </div>
{/if}
