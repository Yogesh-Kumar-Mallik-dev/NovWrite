<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    size?: "default" | "sm" | "lg" | "icon";
    class?: string;
    children?: Snippet;
  }

  let {
    variant = "default",
    size = "default",
    class: className,
    children,
    type = "button",
    ...rest
  }: Props = $props();

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-xs text-foreground",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
    ghost: "hover:bg-accent hover:text-accent-foreground text-foreground",
    link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
  };

  const sizeClasses = {
    default: "h-9 px-4 py-2 text-sm min-h-[36px]",
    sm: "h-8 px-3 text-xs min-h-[32px] rounded-md",
    lg: "h-10 px-8 text-base min-h-[44px] rounded-md",
    icon: "h-9 w-9 p-0 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md",
  };
</script>

<button
  {type}
  class={cn(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  )}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</button>
