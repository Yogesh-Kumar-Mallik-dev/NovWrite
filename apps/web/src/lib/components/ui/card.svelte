<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children, ...rest }: Props = $props();
</script>

<div
  class={cn(
    "rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 shadow-sm",
    className
  )}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</div>
