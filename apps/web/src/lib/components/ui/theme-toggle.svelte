<script lang="ts">
  import { Sun, Moon } from "lucide-svelte";
  import { themeStore } from "$lib/stores/themeStore.svelte";
  import { cn } from "$lib/utils";

  interface Props {
    size?: "sm" | "md" | "lg";
    class?: string;
  }

  let { size = "sm", class: className = "" }: Props = $props();

  const isDark = $derived(themeStore.mode === "dark");

  function handleToggle() {
    themeStore.toggleTheme();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={isDark}
  aria-label="Toggle light and dark theme"
  onclick={handleToggle}
  onkeydown={handleKeyDown}
  class={cn(
    "relative inline-flex items-center rounded-full border border-border transition-colors duration-200 cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shrink-0 bg-muted hover:bg-muted/80",
    size === "sm" && "h-6 w-11 px-0.5",
    size === "md" && "h-7 w-13 px-0.5",
    size === "lg" && "h-8 w-15 px-1",
    className
  )}
>
  <!-- Inactive track icon (shows the opposite mode target) -->
  <span
    class={cn(
      "absolute flex items-center justify-center transition-opacity duration-200 pointer-events-none",
      isDark
        ? "left-1.5 text-amber-500/70"
        : "right-1.5 text-muted-foreground/60"
    )}
  >
    {#if isDark}
      <Sun class={cn(size === "sm" ? "size-3" : size === "md" ? "size-3.5" : "size-4")} />
    {:else}
      <Moon class={cn(size === "sm" ? "size-3" : size === "md" ? "size-3.5" : "size-4")} />
    {/if}
  </span>

  <!-- Sliding Thumb (Carries active mode icon in theme colors) -->
  <span
    class={cn(
      "relative z-10 flex items-center justify-center rounded-full bg-card border border-border shadow-xs transition-transform duration-200 ease-in-out",
      size === "sm" && "size-5",
      size === "md" && "size-6",
      size === "lg" && "size-6",
      isDark
        ? size === "sm"
          ? "translate-x-5"
          : size === "md"
            ? "translate-x-6"
            : "translate-x-7"
        : "translate-x-0"
    )}
  >
    {#if isDark}
      <Moon class={cn("text-primary shrink-0", size === "sm" ? "size-3" : size === "md" ? "size-3.5" : "size-4")} />
    {:else}
      <Sun class={cn("text-amber-500 shrink-0", size === "sm" ? "size-3" : size === "md" ? "size-3.5" : "size-4")} />
    {/if}
  </span>
</button>


