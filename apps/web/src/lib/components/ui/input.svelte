<script lang="ts">
  import Input from "./input/input.svelte";
  let { ...props } = $props();
</script>

<Input {...props} />

