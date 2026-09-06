<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  interface Props extends HTMLTextareaAttributes {
    class?: string;
    value?: string;
  }

  let {
    class: className,
    value = $bindable(""),
    rows = 3,
    ...rest
  }: Props = $props();
</script>

<textarea
  bind:value
  {rows}
  class={cn(
    "flex w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...rest}
></textarea>
