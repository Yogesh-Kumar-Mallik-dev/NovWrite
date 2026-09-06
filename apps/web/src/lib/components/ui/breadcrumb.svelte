<script lang="ts">
  import { ChevronRight, Home } from "lucide-svelte";

  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  interface Props {
    items: BreadcrumbItem[];
  }

  let { items = [] }: Props = $props();
</script>

<nav
  aria-label="Breadcrumb"
  class="flex items-center gap-1.5 text-xs text-zinc-400 font-medium"
>
  <a href="/" class="hover:text-zinc-200 transition-colors flex items-center">
    <Home class="w-3.5 h-3.5" />
  </a>
  {#each items as item, idx}
    <ChevronRight class="w-3 h-3 text-zinc-600" />
    {#if item.href && idx < items.length - 1}
      <a href={item.href} class="hover:text-zinc-200 transition-colors">
        {item.label}
      </a>
    {:else}
      <span class="text-zinc-100 font-semibold">{item.label}</span>
    {/if}
  {/each}
</nav>
