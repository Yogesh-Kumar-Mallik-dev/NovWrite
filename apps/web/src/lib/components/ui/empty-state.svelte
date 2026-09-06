<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { cn } from "$lib/utils";
  import { FolderOpen } from "lucide-svelte";
  import type { Component } from "svelte";

  interface Props {
    icon?: Component<any> | any;
    title: string;
    description: string;
    actionText?: string;
    actionHref?: string;
    onAction?: () => void;
    secondaryActionText?: string;
    onSecondaryAction?: () => void;
    class?: string;
    compact?: boolean;
  }

  let {
    icon: IconComp = FolderOpen,
    title,
    description,
    actionText,
    actionHref,
    onAction,
    secondaryActionText,
    onSecondaryAction,
    class: className = "",
    compact = false,
  }: Props = $props();
</script>

<div
  class={cn(
    "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-card/50",
    compact ? "p-6" : "p-10 sm:p-14",
    className
  )}
>
  <div
    class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3.5 ring-8 ring-primary/5"
  >
    <IconComp class="w-6 h-6" />
  </div>

  <h4 class="text-sm font-bold text-foreground tracking-tight">
    {title}
  </h4>

  <p class="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed font-sans">
    {description}
  </p>

  {#if actionText || secondaryActionText}
    <div class="flex flex-wrap items-center justify-center gap-2 mt-5">
      {#if secondaryActionText}
        <Button
          variant="outline"
          size="sm"
          onclick={onSecondaryAction}
          class="h-8 text-xs px-3"
        >
          {secondaryActionText}
        </Button>
      {/if}

      {#if actionText}
        {#if actionHref}
          <a href={actionHref}>
            <Button size="sm" class="h-8 text-xs px-3.5 font-semibold">
              {actionText}
            </Button>
          </a>
        {:else}
          <Button
            size="sm"
            onclick={onAction}
            class="h-8 text-xs px-3.5 font-semibold"
          >
            {actionText}
          </Button>
        {/if}
      {/if}
    </div>
  {/if}
</div>
