<script lang="ts">
  import { page } from "$app/state";
  import { Users, Clock, ShieldCheck, AlertOctagon } from "lucide-svelte";

  let { children } = $props();

  const navItems = [
    { href: "/world/characters", label: "Entities & Schemas", icon: Users },
    { href: "/world/timeline", label: "Causal Timeline", icon: Clock },
    { href: "/world/rules", label: "Invariant Rules", icon: ShieldCheck },
    { href: "/world/audit", label: "Continuity Audit", icon: AlertOctagon },
  ];
</script>

<div class="flex-1 flex flex-col bg-zinc-950 text-zinc-100">
  <!-- World Studio Sub-Header -->
  <div
    class="border-b border-zinc-800 bg-zinc-900/50 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3"
  >
    <div class="flex items-center gap-2">
      <div class="h-2 w-2 rounded-full bg-red-500"></div>
      <h1 class="text-sm font-semibold tracking-tight text-zinc-200">
        World Studio Workbench
      </h1>
      <span class="text-xs text-zinc-500 font-mono hidden sm:inline"
        >| Deterministic Universe State</span
      >
    </div>

    <!-- Navigation Tabs -->
    <nav
      class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 max-w-full"
    >
      {#each navItems as item}
        {@const Icon = item.icon}
        {@const isActive = page.url.pathname.startsWith(item.href)}
        <a
          href={item.href}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] {isActive
            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'}"
        >
          <Icon
            class="w-3.5 h-3.5 {isActive ? 'text-red-400' : 'text-zinc-500'}"
          />
          {item.label}
        </a>
      {/each}
    </nav>
  </div>

  <!-- Workbench Content -->
  <div class="flex-1 p-4 md:p-6 overflow-y-auto">
    {@render children()}
  </div>
</div>
