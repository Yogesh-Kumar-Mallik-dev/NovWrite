<script lang="ts">
  import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import { Circle } from "lucide-svelte";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: RadioGroupPrimitive.ItemProps = $props();
</script>

<RadioGroupPrimitive.Item
  bind:ref
  class={cn(
    "aspect-square size-4 rounded-full border border-primary text-primary shadow-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground flex items-center justify-center",
    className
  )}
  {...restProps}
>
  {#snippet children({ checked })}
    {#if checked}
      <Circle class="size-2 fill-current text-current" />
    {/if}
  {/snippet}
</RadioGroupPrimitive.Item>
