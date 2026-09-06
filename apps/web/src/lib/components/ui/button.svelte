<script lang="ts">
  import Button from "./button/button.svelte";
  let { ...props } = $props();
</script>

<Button {...props} />

