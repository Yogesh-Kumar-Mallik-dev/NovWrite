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
  class="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground font-medium min-w-0"
>
  <a href="/" class="hover:text-foreground transition-colors flex items-center shrink-0">
    <Home class="w-3.5 h-3.5" />
  </a>
  {#each items as item, idx}
    <ChevronRight class="w-3 h-3 text-muted-foreground/60 shrink-0" />
    {#if item.href && idx < items.length - 1}
      <a href={item.href} class="hover:text-foreground transition-colors truncate max-w-[140px] sm:max-w-[220px] md:max-w-none">
        {item.label}
      </a>
    {:else}
      <span class="text-foreground font-semibold truncate max-w-[160px] sm:max-w-[260px] md:max-w-none">{item.label}</span>
    {/if}
  {/each}
</nav>
