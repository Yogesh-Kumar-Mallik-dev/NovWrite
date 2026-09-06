<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning";
    class?: string;
    children?: Snippet;
  }

  let {
    variant = "default",
    class: className,
    children,
    ...rest
  }: Props = $props();

  const variantClasses = {
    default:
      "border-transparent bg-purple-900/60 text-purple-200 border border-purple-700/50",
    secondary: "border-transparent bg-zinc-800 text-zinc-300",
    destructive:
      "border-transparent bg-red-950/80 text-red-300 border border-red-800/60",
    outline: "border-zinc-700 text-zinc-300",
    success:
      "border-transparent bg-emerald-950/80 text-emerald-300 border border-emerald-800/60",
    warning:
      "border-transparent bg-amber-950/80 text-amber-300 border border-amber-800/60",
  };
</script>

<div
  class={cn(
    "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none uppercase font-mono",
    variantClasses[variant],
    className,
  )}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</div>
