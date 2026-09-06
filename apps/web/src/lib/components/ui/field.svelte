<script lang="ts">
  import { cn } from "$lib/utils";
  import Label from "./label.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    id?: string;
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
    class?: string;
    children?: Snippet;
    labelSnippet?: Snippet;
  }

  let {
    id,
    label,
    description,
    error,
    required = false,
    class: className,
    children,
    labelSnippet,
  }: Props = $props();
</script>

<div class={cn("flex flex-col gap-1.5", className)}>
  {#if label || labelSnippet}
    <div class="flex items-center justify-between gap-2">
      {#if labelSnippet}
        {@render labelSnippet()}
      {:else}
        <Label for={id}>
          {label}
          {#if required}
            <span class="text-destructive font-bold">*</span>
          {/if}
        </Label>
      {/if}
    </div>
  {/if}

  {#if children}
    {@render children()}
  {/if}

  {#if description}
    <p class="text-[11px] text-muted-foreground leading-normal">{description}</p>
  {/if}

  {#if error}
    <p class="text-[11px] text-destructive leading-normal font-medium">{error}</p>
  {/if}
</div>
