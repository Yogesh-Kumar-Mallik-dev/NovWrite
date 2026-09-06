<script lang="ts">
  import { Select } from "bits-ui";
  import { cn } from "$lib/utils";
  import { Check, ChevronDown } from "lucide-svelte";

  interface Option {
    value: string;
    label: string;
    disabled?: boolean;
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

  const selectedLabel = $derived(
    options.find((opt) => opt.value === value)?.label || ""
  );

  function handleValueChange(newVal: string) {
    value = newVal;
    onchange?.(newVal);
  }
</script>

<Select.Root
  type="single"
  {value}
  onValueChange={handleValueChange}
  {disabled}
  items={options}
>
  <Select.Trigger
    {id}
    class={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[36px] cursor-pointer",
      className
    )}
  >
    <span class={cn("truncate text-left", !selectedLabel && "text-zinc-500")}>
      {selectedLabel || placeholder}
    </span>
    <ChevronDown class="w-4 h-4 text-zinc-400 shrink-0 opacity-70 ml-2" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      class="z-50 min-w-[8rem] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-xl"
      sideOffset={4}
    >
      <Select.Viewport class="p-1 max-h-60 overflow-y-auto">
        {#each options as opt (opt.value)}
          <Select.Item
            value={opt.value}
            label={opt.label}
            disabled={opt.disabled}
            class={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-3 text-sm outline-none transition-colors data-[highlighted]:bg-zinc-800 data-[highlighted]:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-zinc-800"
            )}
          >
            {#snippet children({ selected })}
              {#if selected}
                <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-purple-400">
                  <Check class="h-4 w-4" />
                </span>
              {/if}
              <span class="truncate">{opt.label}</span>
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>

