<script lang="ts">
  import { page } from "$app/state";
  import Error404 from "$lib/components/errors/error-404.svelte";
  import Error500 from "$lib/components/errors/error-500.svelte";

  const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{page.status} - {isNotFound ? "Timeline Paradox" : "Continuity Rupture"} | NovWrite</title>
</svelte:head>

{#if isNotFound}
  <Error404 message={page.error?.message} />
{:else}
  <Error500
    statusCode={page.status}
    message={page.error?.message}
    errorStack={(page.error as any)?.stack}
  />
{/if}
