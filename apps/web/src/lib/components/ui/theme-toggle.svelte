<script lang="ts">
  import { Sun, Moon } from "lucide-svelte";
  import { themeStore, type ThemeMode } from "$lib/stores/themeStore.svelte";
  import { cn } from "$lib/utils";

  interface Props {
    size?: "sm" | "md";
    showLabels?: boolean;
    class?: string;
  }

  let { size = "sm", showLabels = true, class: className = "" }: Props = $props();

  function handleChange(val: ThemeMode) {
    themeStore.setTheme(val);
  }
</script>

<fieldset
  class={cn(
    "inline-flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/50 text-foreground transition-colors",
    className
  )}
  role="radiogroup"
  aria-label="Theme mode selection"
>
  <!-- Light Mode Tile Radio -->
  <label
    for="theme-tile-radio-light"
    class={cn(
      "group relative flex items-center gap-1.5 rounded-md cursor-pointer transition-all duration-150 select-none font-medium border",
      size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
      themeStore.mode === "light"
        ? "bg-card text-foreground shadow-xs border-border/90"
        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
    )}
  >
    <input
      type="radio"
      id="theme-tile-radio-light"
      name="novwrite-theme-selection"
      value="light"
      checked={themeStore.mode === "light"}
      onchange={() => handleChange("light")}
      class="size-3.5 accent-primary cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-full"
      aria-label="Light mode"
    />
    <Sun
      class={cn(
        "size-3.5 transition-colors shrink-0",
        themeStore.mode === "light" ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
      )}
    />
    {#if showLabels}
      <span class="font-mono text-[11px] leading-none">Light</span>
    {/if}
  </label>

  <!-- Dark Mode Tile Radio -->
  <label
    for="theme-tile-radio-dark"
    class={cn(
      "group relative flex items-center gap-1.5 rounded-md cursor-pointer transition-all duration-150 select-none font-medium border",
      size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
      themeStore.mode === "dark"
        ? "bg-card text-foreground shadow-xs border-border/90"
        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
    )}
  >
    <input
      type="radio"
      id="theme-tile-radio-dark"
      name="novwrite-theme-selection"
      value="dark"
      checked={themeStore.mode === "dark"}
      onchange={() => handleChange("dark")}
      class="size-3.5 accent-primary cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-full"
      aria-label="Dark mode"
    />
    <Moon
      class={cn(
        "size-3.5 transition-colors shrink-0",
        themeStore.mode === "dark" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )}
    />
    {#if showLabels}
      <span class="font-mono text-[11px] leading-none">Dark</span>
    {/if}
  </label>
</fieldset>

