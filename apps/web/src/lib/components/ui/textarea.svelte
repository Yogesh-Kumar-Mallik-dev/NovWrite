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
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...rest}
></textarea>
