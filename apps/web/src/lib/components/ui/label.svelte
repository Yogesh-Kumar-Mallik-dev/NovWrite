<script lang="ts">
  import { Label } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  interface Props {
    for?: string;
    class?: string;
    children?: Snippet;
  }

  let { for: htmlFor, class: className, children, ...rest }: Props = $props();
</script>

<Label.Root
  for={htmlFor}
  class={cn(
    "text-xs font-medium text-foreground select-none flex items-center gap-1.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Label.Root>
