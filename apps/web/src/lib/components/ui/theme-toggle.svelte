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
  aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
  title={isDark ? "Switch to light theme" : "Switch to dark theme"}
  onclick={handleToggle}
  onkeydown={handleKeyDown}
  class={cn(
    "relative inline-flex items-center justify-center rounded-lg border border-border bg-card/60 hover:bg-muted text-primary transition-colors cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shrink-0",
    size === "sm" && "h-8 w-8",
    size === "md" && "h-9 w-9",
    size === "lg" && "h-10 w-10",
    className
  )}
>
  {#if isDark}
    <!-- Dark mode active: Render ONLY single purple Sun icon to switch to light mode -->
    <Sun class={cn(size === "sm" ? "size-4" : size === "md" ? "size-4.5" : "size-5", "text-primary shrink-0 transition-transform duration-200 hover:rotate-45")} />
  {:else}
    <!-- Light mode active: Render ONLY single purple Moon icon to switch to dark mode -->
    <Moon class={cn(size === "sm" ? "size-4" : size === "md" ? "size-4.5" : "size-5", "text-primary shrink-0 transition-transform duration-200 hover:-rotate-12")} />
  {/if}
</button>
