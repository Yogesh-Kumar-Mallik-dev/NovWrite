<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Button } from '$lib/components/ui';

  interface Props {
    page: number;
    pageSize?: number;
    totalCount: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    itemLabel?: string;
    borderPosition?: 'top' | 'bottom' | 'none';
    class?: string;
    onPageChange: (newPage: number) => void;
  }

  let {
    page = 1,
    pageSize = 10,
    totalCount = 0,
    totalPages: propTotalPages,
    hasNextPage: propHasNextPage,
    hasPreviousPage: propHasPreviousPage,
    itemLabel = 'items',
    borderPosition = 'bottom',
    class: className = '',
    onPageChange,
  }: Props = $props();

  const totalPages = $derived(
    propTotalPages !== undefined ? propTotalPages : Math.max(1, Math.ceil(totalCount / pageSize))
  );

  const hasNextPage = $derived(
    propHasNextPage !== undefined ? propHasNextPage : page < totalPages
  );

  const hasPreviousPage = $derived(
    propHasPreviousPage !== undefined ? propHasPreviousPage : page > 1
  );

  const startItem = $derived(totalCount === 0 ? 0 : (page - 1) * pageSize + 1);
  const endItem = $derived(Math.min(totalCount, page * pageSize));

  function handlePrevious() {
    if (hasPreviousPage && page > 1) {
      onPageChange(page - 1);
    }
  }

  function handleNext() {
    if (hasNextPage && page < totalPages) {
      onPageChange(page + 1);
    }
  }
</script>

<div
  class={`flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-card/60 ${
    borderPosition === 'bottom'
      ? 'border-b border-border'
      : borderPosition === 'top'
        ? 'border-t border-border'
        : ''
  } ${className}`}
>
  <!-- Item Range Telemetry -->
  <div class="text-xs text-muted-foreground font-mono text-center sm:text-left">
    {#if totalCount === 0}
      <span>0 {itemLabel}</span>
    {:else}
      <span>Showing <strong class="text-foreground font-semibold">{startItem}</strong>–<strong class="text-foreground font-semibold">{endItem}</strong> of <strong class="text-foreground font-semibold">{totalCount}</strong> {itemLabel}</span>
    {/if}
  </div>

  <!-- Pagination Buttons & Page Indicator -->
  <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
    <!-- Previous Page Button -->
    <Button
      variant="outline"
      size="sm"
      class="h-8 px-2.5 sm:px-3 text-xs flex items-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      disabled={!hasPreviousPage || page <= 1}
      onclick={handlePrevious}
      aria-label="Previous Page"
    >
      <ChevronLeft class="w-3.5 h-3.5" />
      <span>Previous</span>
    </Button>

    <!-- Page Number Text -->
    <div class="px-2 sm:px-2.5 py-1 rounded bg-muted/60 border border-border/70 text-xs font-mono text-muted-foreground min-w-[70px] sm:min-w-[75px] text-center">
      Page <strong class="text-foreground">{page}</strong> / {totalPages}
    </div>

    <!-- Next Page Button -->
    <Button
      variant="outline"
      size="sm"
      class="h-8 px-2.5 sm:px-3 text-xs flex items-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      disabled={!hasNextPage || page >= totalPages}
      onclick={handleNext}
      aria-label="Next Page"
    >
      <span>Next</span>
      <ChevronRight class="w-3.5 h-3.5" />
    </Button>
  </div>
</div>
