<script lang="ts">
  import { ChevronRight, Home } from "lucide-svelte";
  import { cn } from "$lib/utils";

  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  interface Props {
    items: BreadcrumbItem[];
    class?: string;
  }

  let { items = [], class: className = "" }: Props = $props();
</script>

<nav
  aria-label="Breadcrumb"
  class={cn("flex items-center gap-1.5 text-xs text-muted-foreground font-medium min-w-0 overflow-hidden", className)}
>
  <a href="/" class="hover:text-foreground transition-colors flex items-center shrink-0" aria-label="Home">
    <Home class="w-3.5 h-3.5" />
  </a>
  {#each items as item, idx}
    <ChevronRight class="w-3 h-3 text-muted-foreground/50 shrink-0" />
    {#if item.href && idx < items.length - 1}
      <a href={item.href} class="hover:text-foreground transition-colors truncate shrink-0 max-w-[120px] sm:max-w-[180px] md:max-w-none">
        {item.label}
      </a>
    {:else}
      <span class="text-foreground font-semibold truncate shrink min-w-0">{item.label}</span>
    {/if}
  {/each}
</nav>
