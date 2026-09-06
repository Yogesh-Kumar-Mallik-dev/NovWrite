<script lang="ts">
  import { Sun, Moon } from "lucide-svelte";
  import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group";
  import { themeStore, type ThemeMode } from "$lib/stores/themeStore.svelte";
  import { cn } from "$lib/utils";

  interface Props {
    size?: "sm" | "md";
    showLabels?: boolean;
    class?: string;
  }

  let { size = "sm", showLabels = true, class: className = "" }: Props = $props();

  function handleValueChange(val: string) {
    if (val === "light" || val === "dark") {
      themeStore.setTheme(val);
    }
  }
</script>

<RadioGroup
  value={themeStore.mode}
  onValueChange={handleValueChange}
  class={cn(
    "flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/50 text-foreground transition-colors",
    className
  )}
  aria-label="Theme mode selection"
>
  <!-- Light Mode Radio Button -->
  <label
    for="theme-light-radio"
    class={cn(
      "flex items-center gap-1.5 rounded-md cursor-pointer transition-all duration-150 select-none font-medium",
      size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
      themeStore.mode === "light"
        ? "bg-background text-foreground shadow-xs border border-border/80"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    )}
  >
    <RadioGroupItem
      id="theme-light-radio"
      value="light"
      class={cn(
        "size-3.5 border-muted-foreground/60 transition-colors data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white focus-visible:ring-ring"
      )}
    />
    <Sun class={cn("size-3.5 transition-colors", themeStore.mode === "light" ? "text-amber-500" : "text-muted-foreground")} />
    {#if showLabels}
      <span class="font-mono text-[11px] leading-none">Light</span>
    {/if}
  </label>

  <!-- Dark Mode Radio Button -->
  <label
    for="theme-dark-radio"
    class={cn(
      "flex items-center gap-1.5 rounded-md cursor-pointer transition-all duration-150 select-none font-medium",
      size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
      themeStore.mode === "dark"
        ? "bg-background text-foreground shadow-xs border border-border/80"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    )}
  >
    <RadioGroupItem
      id="theme-dark-radio"
      value="dark"
      class={cn(
        "size-3.5 border-muted-foreground/60 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring"
      )}
    />
    <Moon class={cn("size-3.5 transition-colors", themeStore.mode === "dark" ? "text-primary" : "text-muted-foreground")} />
    {#if showLabels}
      <span class="font-mono text-[11px] leading-none">Dark</span>
    {/if}
  </label>
</RadioGroup>
