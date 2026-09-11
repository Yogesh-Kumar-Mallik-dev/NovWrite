<script lang="ts">
  import Checkbox from "./checkbox/checkbox.svelte";
  import type { ComponentProps } from "svelte";

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    ref = $bindable(null),
    class: className,
    ...props
  }: ComponentProps<typeof Checkbox> = $props();
</script>

<Checkbox bind:checked bind:indeterminate bind:ref class={className} {...props} />
