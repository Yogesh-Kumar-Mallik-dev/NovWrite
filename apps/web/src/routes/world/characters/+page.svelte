<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/world/entities', { replaceState: true });
  });
</script>

<div class="p-8 text-center text-xs text-zinc-500 font-mono">
  Redirecting to Entities workbench...
</div>
