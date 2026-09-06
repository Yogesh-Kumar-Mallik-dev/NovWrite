<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    class?: string;
    value?: any;
  }

  let {
    class: className,
    value = $bindable(),
    type = "text",
    ...rest
  }: Props = $props();
</script>

<input
  {type}
  bind:value
  class={cn(
    "flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[36px]",
    className,
  )}
  {...rest}
/>
