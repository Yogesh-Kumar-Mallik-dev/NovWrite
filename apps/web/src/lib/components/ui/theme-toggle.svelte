<script lang="ts">
  import { Sun, Moon } from "lucide-svelte";
  import { themeStore, type ThemeMode } from "$lib/stores/themeStore.svelte";

  interface Props {
    size?: "sm" | "md";
    showLabels?: boolean;
    class?: string;
  }

  let { size = "sm", showLabels = true, class: className = "" }: Props = $props();

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
  ];
</script>

<fieldset
  class="inline-flex items-center p-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs shadow-inner transition-colors {className}"
  role="radiogroup"
  aria-label="Theme mode selection"
>
  <legend class="sr-only">Select Theme Mode</legend>

  {#each options as opt}
    {@const isChecked = themeStore.mode === opt.mode}
    {@const Icon = opt.icon}
    <label
      class="relative flex items-center gap-1.5 {size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-md cursor-pointer transition-all duration-200 select-none font-medium {isChecked
        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-300/80 dark:border-zinc-700'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-300/40 dark:hover:bg-zinc-850/50 border border-transparent'}"
    >
      <input
        type="radio"
        name="novwrite-theme-mode"
        value={opt.mode}
        checked={isChecked}
        onchange={() => themeStore.setTheme(opt.mode)}
        class="sr-only"
        aria-checked={isChecked}
      />

      <!-- Custom Radio Circle Dot -->
      <span
        class="w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-150 {isChecked
          ? opt.mode === 'light'
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400/40'
            : 'border-purple-400 bg-purple-50 dark:bg-purple-950/50 ring-1 ring-purple-400/40'
          : 'border-zinc-400 dark:border-zinc-600 bg-transparent'}"
        aria-hidden="true"
      >
        {#if isChecked}
          <span
            class="w-1.5 h-1.5 rounded-full transition-transform duration-150 scale-100 {opt.mode === 'light' ? 'bg-amber-500' : 'bg-purple-400'}"
          ></span>
        {/if}
      </span>

      <!-- Icon & Label -->
      <Icon
        class="w-3.5 h-3.5 transition-colors {isChecked
          ? opt.mode === 'light'
            ? 'text-amber-500'
            : 'text-purple-400'
          : 'text-zinc-500 dark:text-zinc-400'}"
      />

      {#if showLabels}
        <span class="text-[11px] font-mono leading-none">{opt.label}</span>
      {/if}
    </label>
  {/each}
</fieldset>
