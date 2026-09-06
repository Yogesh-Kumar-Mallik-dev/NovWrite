<script lang="ts">
  import {
    Search,
    Plus,
    Edit3,
    X,
    Check,
    Shield,
    User,
    MapPin,
    Sparkles,
    CheckCircle2,
    XCircle,
    AlertCircle,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Select from "$lib/components/ui/select.svelte";

  interface EntityItem {
    id: string;
    name: string;
    category: "CHARACTER" | "LOCATION" | "ARTIFACT" | "FACTION";
    properties: {
      status: string;
      cultivation_realm?: string;
      mana_capacity?: number;
      faction?: string;
      spiritual_density?: number;
      durability?: number;
    };
    lastMutatedSeqNumber: number;
  }

  // Demo state loaded from Chronicles of Aethelgard
  let entities = $state<EntityItem[]>([
    {
      id: "a1111111-1111-4111-a111-111111111111",
      name: "Eldrin the Spellblade",
      category: "CHARACTER",
      properties: {
        status: "ALIVE",
        cultivation_realm: "Foundation",
        mana_capacity: 300,
        faction: "Silver Vanguard",
      },
      lastMutatedSeqNumber: 50,
    },
    {
      id: "b2222222-2222-4222-a222-222222222222",
      name: "Lyra of the Astral Veil",
      category: "CHARACTER",
      properties: {
        status: "ALIVE",
        cultivation_realm: "Core Formation",
        mana_capacity: 800,
        faction: "Astral Covenant",
      },
      lastMutatedSeqNumber: 200,
    },
    {
      id: "c3333333-3333-4333-a333-333333333333",
      name: "Lord Malakor",
      category: "CHARACTER",
      properties: {
        status: "DEAD",
        cultivation_realm: "Core Formation",
        mana_capacity: 1200,
        faction: "Shadow Syndicate",
      },
      lastMutatedSeqNumber: 150,
    },
    {
      id: "d4444444-4444-4444-a444-444444444444",
      name: "The Sunken Citadel",
      category: "LOCATION",
      properties: {
        status: "ACTIVE",
        spiritual_density: 9.5,
        faction: "Neutral",
      },
      lastMutatedSeqNumber: 10,
    },
  ]);

  let searchQuery = $state("");
  let categoryFilter = $state("ALL");
  let selectedEntity = $state<EntityItem | null>(null);
  let editForm = $state<Record<string, any>>({});
  let saveMessage = $state<string | null>(null);

  const categoryOptions = [
    { value: "ALL", label: "All Categories" },
    { value: "CHARACTER", label: "Characters" },
    { value: "LOCATION", label: "Locations" },
    { value: "ARTIFACT", label: "Artifacts" },
  ];

  const statusOptions = [
    { value: "ALIVE", label: "ALIVE" },
    { value: "DEAD", label: "DEAD" },
    { value: "EXILED", label: "EXILED" },
    { value: "ACTIVE", label: "ACTIVE" },
  ];

  const realmOptions = [
    { value: "Mortal", label: "Mortal" },
    { value: "Qi Condensation", label: "Qi Condensation" },
    { value: "Foundation", label: "Foundation" },
    { value: "Core Formation", label: "Core Formation" },
    { value: "Nascent Soul", label: "Nascent Soul" },
  ];

  const filteredEntities = $derived(
    entities.filter((e) => {
      const matchesCat =
        categoryFilter === "ALL" || e.category === categoryFilter;
      const matchesSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.properties.faction?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    }),
  );

  function openDetailDrawer(entity: EntityItem) {
    selectedEntity = entity;
    editForm = {
      name: entity.name,
      status: entity.properties.status || "ALIVE",
      cultivation_realm: entity.properties.cultivation_realm || "Foundation",
      mana_capacity: entity.properties.mana_capacity ?? 0,
      faction: entity.properties.faction || "",
    };
    saveMessage = null;
  }

  function handleSaveEntity() {
    if (!selectedEntity) return;

    entities = entities.map((e) => {
      if (e.id === selectedEntity!.id) {
        return {
          ...e,
          name: editForm.name,
          properties: {
            ...e.properties,
            status: editForm.status,
            cultivation_realm: editForm.cultivation_realm,
            mana_capacity: Number(editForm.mana_capacity),
            faction: editForm.faction,
          },
        };
      }
      return e;
    });

    selectedEntity = {
      ...selectedEntity,
      name: editForm.name,
      properties: {
        ...selectedEntity.properties,
        status: editForm.status,
        cultivation_realm: editForm.cultivation_realm,
        mana_capacity: Number(editForm.mana_capacity),
        faction: editForm.faction,
      },
    };

    saveMessage = "Property schema validated and saved successfully!";
    setTimeout(() => {
      saveMessage = null;
    }, 3000);
  }
</script>

<div class="space-y-6">
  <!-- Header & Action Bar -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-bold tracking-tight text-zinc-100">
        Entities & Dynamic Property Schemas
      </h2>
      <p class="text-xs text-zinc-400 mt-0.5">
        Master-detail view of universe entities with live JSONB property
        inspection.
      </p>
    </div>
    <Button size="sm" class="self-start sm:self-auto">
      <Plus class="w-3.5 h-3.5" />
      <span>New Entity</span>
    </Button>
  </div>

  <!-- Filter Controls -->
  <div
    class="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800"
  >
    <div class="relative flex-1 w-full">
      <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
      <Input
        bind:value={searchQuery}
        placeholder="Filter by name or faction..."
        class="pl-9 h-9 text-xs"
      />
    </div>
    <div class="w-full sm:w-48">
      <Select options={categoryOptions} bind:value={categoryFilter} />
    </div>
  </div>

  <!-- Master Table & Detail Pane Split -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
    <!-- Master Data Table -->
    <div
      class="lg:col-span-2 bg-zinc-900/60 rounded-lg border border-zinc-800 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider"
          >
            <tr>
              <th class="px-4 py-3">Entity</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Realm / Stage</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Mana / Metric</th>
              <th class="px-4 py-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/60">
            {#if filteredEntities.length === 0}
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-zinc-500">
                  No entities found matching filter criteria.
                </td>
              </tr>
            {:else}
              {#each filteredEntities as entity}
                <tr
                  class="hover:bg-zinc-850/80 transition-colors cursor-pointer {selectedEntity?.id ===
                  entity.id
                    ? 'bg-zinc-850 border-l-2 border-purple-500'
                    : ''}"
                  onclick={() => openDetailDrawer(entity)}
                >
                  <td class="px-4 py-3.5 font-medium text-zinc-200">
                    <div class="flex items-center gap-2">
                      {#if entity.category === "CHARACTER"}
                        <User class="w-3.5 h-3.5 text-purple-400" />
                      {:else}
                        <MapPin class="w-3.5 h-3.5 text-emerald-400" />
                      {/if}
                      <span>{entity.name}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-zinc-400 font-mono text-[11px]"
                    >{entity.category}</td
                  >
                  <td class="px-4 py-3 text-zinc-300"
                    >{entity.properties.cultivation_realm || "—"}</td
                  >
                  <td class="px-4 py-3">
                    {#if entity.properties.status === "ALIVE"}
                      <span
                        class="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-semibold"
                      >
                        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
                        ALIVE
                      </span>
                    {:else if entity.properties.status === "DEAD"}
                      <span
                        class="inline-flex items-center gap-1.5 text-red-400 font-mono text-[11px] font-semibold"
                      >
                        <XCircle class="w-3.5 h-3.5 text-red-500" />
                        DEAD
                      </span>
                    {:else}
                      <span
                        class="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]"
                      >
                        <AlertCircle class="w-3.5 h-3.5 text-zinc-500" />
                        {entity.properties.status}
                      </span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 font-mono text-zinc-300">
                    {entity.properties.mana_capacity !== undefined
                      ? `${entity.properties.mana_capacity} MP`
                      : `${entity.properties.spiritual_density ?? "—"} Density`}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={(e) => {
                        e.stopPropagation();
                        openDetailDrawer(entity);
                      }}
                      title="Inspect & Edit Properties"
                    >
                      <Edit3 class="w-3.5 h-3.5 text-purple-400" />
                      <span>Edit</span>
                    </Button>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Drawer / Property Editor -->
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-4 space-y-4">
      {#if selectedEntity}
        <div
          class="flex items-center justify-between border-b border-zinc-800 pb-3"
        >
          <div>
            <h3 class="text-sm font-semibold text-zinc-100">
              Live Property Editor
            </h3>
            <p class="text-[11px] text-zinc-500 font-mono mt-0.5">
              UUID: {selectedEntity.id.substring(0, 13)}...
            </p>
          </div>
          <button
            onclick={() => (selectedEntity = null)}
            class="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        {#if saveMessage}
          <div
            class="p-2.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-1.5 font-medium"
          >
            <Check class="w-3.5 h-3.5" />
            {saveMessage}
          </div>
        {/if}

        <div class="space-y-3.5 text-xs">
          <div>
            <label
              for="entity-name-input"
              class="block text-zinc-400 mb-1 font-medium">Entity Name</label
            >
            <Input
              id="entity-name-input"
              bind:value={editForm.name}
              class="h-8 text-xs"
            />
          </div>

          <div>
            <label
              for="entity-status-select"
              class="block text-zinc-400 mb-1 font-medium">Status (Enum)</label
            >
            <Select
              id="entity-status-select"
              options={statusOptions}
              bind:value={editForm.status}
            />
          </div>

          <div>
            <label
              for="entity-realm-select"
              class="block text-zinc-400 mb-1 font-medium"
              >Cultivation Realm (Ladder Tier)</label
            >
            <Select
              id="entity-realm-select"
              options={realmOptions}
              bind:value={editForm.cultivation_realm}
            />
          </div>

          <div>
            <label
              for="entity-mana-input"
              class="block text-zinc-400 mb-1 font-medium"
              >Mana Capacity (Number >= 0)</label
            >
            <Input
              id="entity-mana-input"
              type="number"
              bind:value={editForm.mana_capacity}
              class="h-8 text-xs font-mono"
            />
          </div>

          <div>
            <label
              for="entity-faction-input"
              class="block text-zinc-400 mb-1 font-medium"
              >Faction (String)</label
            >
            <Input
              id="entity-faction-input"
              bind:value={editForm.faction}
              class="h-8 text-xs"
            />
          </div>

          <div
            class="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800"
          >
            <Button
              variant="outline"
              size="sm"
              onclick={() => (selectedEntity = null)}>Cancel</Button
            >
            <Button size="sm" onclick={handleSaveEntity}>Save Properties</Button
            >
          </div>
        </div>
      {:else}
        <div class="text-center py-12 px-4 space-y-2">
          <Shield class="w-8 h-8 text-zinc-600 mx-auto" />
          <h4 class="text-xs font-semibold text-zinc-400">
            No Entity Selected
          </h4>
          <p class="text-[11px] text-zinc-500 max-w-xs mx-auto">
            Select any entity from the table to inspect and live-edit its
            dynamic property schemas.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
