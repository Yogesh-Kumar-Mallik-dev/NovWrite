<script lang="ts">
  import { cn } from "$lib/utils";
  import { ChevronDown } from "lucide-svelte";

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    id?: string;
    options: Option[];
    value?: string;
    placeholder?: string;
    class?: string;
    disabled?: boolean;
    onchange?: (val: string) => void;
  }

  let {
    id,
    options = [],
    value = $bindable(""),
    placeholder = "Select an option...",
    class: className,
    disabled = false,
    onchange,
  }: Props = $props();

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    value = target.value;
    onchange?.(target.value);
  }
</script>

<div class={cn("relative inline-block w-full", className)}>
  <select
    {id}
    bind:value
    onchange={handleChange}
    {disabled}
    class="flex h-9 w-full appearance-none items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 pr-8 text-sm text-zinc-100 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer min-h-[36px]"
  >
    {#if placeholder}
      <option value="" disabled selected={!value}>{placeholder}</option>
    {/if}
    {#each options as opt}
      <option value={opt.value} class="bg-zinc-900 text-zinc-100 py-1.5"
        >{opt.label}</option
      >
    {/each}
  </select>
  <div
    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400"
  >
    <ChevronDown class="w-4 h-4" />
  </div>
</div>
