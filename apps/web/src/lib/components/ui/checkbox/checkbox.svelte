<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import CheckIcon from "@lucide/svelte/icons/check";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	data-slot="checkbox"
	class={cn(
		"peer border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="flex size-full items-center justify-center text-current pointer-events-none"
		>
			{#if indeterminate}
				<MinusIcon class="size-3 stroke-[3]" />
			{:else if checked}
				<CheckIcon class="size-3 stroke-[3]" />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
