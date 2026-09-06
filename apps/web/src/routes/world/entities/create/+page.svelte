<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    ArrowLeft,
    Check,
    Boxes,
    Sparkles,
    Calculator,
    Heart,
    Link2,
    ListFilter,
    Shield,
    Hash,
    Layers,
    Edit3,
    User,
    Sword,
    MapPin,
    Zap,
    Scale,
    Info,
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    Flame,
    Activity,
  } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import Field from '$lib/components/ui/field.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import Breadcrumb from '$lib/components/ui/breadcrumb.svelte';
  import {
    worldStore,
    type BlueprintDef,
    type DynamicFieldDef,
  } from '$lib/stores/worldStore.svelte';
  import { evaluateFormula } from '$lib/engine/formulaEngine';

  const firstClassBlueprints = $derived(worldStore.getFirstClassBlueprints());
  const initialBpId = page.url.searchParams.get('blueprintId') || '';

  let carouselEl = $state<HTMLDivElement | null>(null);
  let searchArchetypeQuery = $state('');
  let selectedCategoryFilter = $state('ALL');
  let canScrollLeft = $state(false);
  let canScrollRight = $state(true);
  let activeSlideIndex = $state(0);
  let totalSlides = $state(1);

  function updateScrollState() {
    if (!carouselEl) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselEl;
    canScrollLeft = scrollLeft > 10;
    canScrollRight = scrollLeft + clientWidth < scrollWidth - 10;
    if (clientWidth > 0) {
      activeSlideIndex = Math.round(scrollLeft / clientWidth);
      totalSlides = Math.max(1, Math.ceil(scrollWidth / clientWidth));
    }
  }

  function scrollCarousel(direction: 'left' | 'right') {
    if (!carouselEl) return;
    const firstCard = carouselEl.querySelector<HTMLElement>(':scope > button, :scope > a');
    const cardStep = firstCard ? firstCard.offsetWidth + 12 : 300;
    const amount = direction === 'left' ? -cardStep : cardStep;
    carouselEl.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 250);
  }

  function scrollToSlide(index: number) {
    if (!carouselEl) return;
    carouselEl.scrollTo({ left: index * carouselEl.clientWidth, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  }

  const allCategories = $derived([
    'ALL',
    ...Array.from(new Set(firstClassBlueprints.map((b) => b.category))),
  ]);

  const filteredBlueprints = $derived(
    firstClassBlueprints.filter((bp) => {
      const matchesCategory =
        selectedCategoryFilter === 'ALL' || bp.category === selectedCategoryFilter;
      const q = searchArchetypeQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        bp.name.toLowerCase().includes(q) ||
        bp.category.toLowerCase().includes(q) ||
        (bp.description && bp.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    })
  );

  $effect(() => {
    // When filter changes, reset scroll and update controls
    if (carouselEl && filteredBlueprints) {
      carouselEl.scrollTo({ left: 0, behavior: 'auto' });
      setTimeout(updateScrollState, 50);
    }
  });

  function getDefaultOptionValue(
    options?: Array<
      string | { label: string; value: string; power?: number; numericValue?: number }
    >
  ): string {
    if (!options || options.length === 0) return '';
    const first = options[0];
    return typeof first === 'object' ? first.value : first;
  }

  function getInitialPropertiesForBlueprint(bp?: BlueprintDef): Record<string, any> {
    if (!bp) return {};
    const initialProps: Record<string, any> = {};

    for (const field of bp.fields) {
      if (field.fieldType === 'BLUEPRINT_REF' && field.targetBlueprintId) {
        const targetBp = worldStore.getBlueprint(field.targetBlueprintId);
        if (targetBp && targetBp.blueprintClass === 'SECOND_CLASS') {
          const subProps: Record<string, any> = {};
          for (const subF of targetBp.fields) {
            if (subF.defaultValue !== undefined) {
              subProps[subF.name] = subF.defaultValue;
            } else if (subF.fieldType === 'NUMBER') {
              subProps[subF.name] = subF.defaultValue ?? subF.min ?? 0;
            } else if ((subF.fieldType === 'ENUM' || subF.fieldType === 'VALUE_TYPE') && subF.options) {
              subProps[subF.name] = getDefaultOptionValue(subF.options);
            } else if (subF.fieldType === 'BOOLEAN') {
              subProps[subF.name] = 'false';
            } else {
              subProps[subF.name] = '';
            }
          }
          initialProps[field.name] = subProps;
        } else {
          // 1st-class relational reference (e.g. bound entity ID)
          initialProps[field.name] = field.defaultValue || '';
        }
      } else if (field.defaultValue !== undefined) {
        initialProps[field.name] = field.defaultValue;
      } else if (field.fieldType === 'NUMBER') {
        initialProps[field.name] = field.defaultValue ?? field.min ?? 0;
      } else if ((field.fieldType === 'ENUM' || field.fieldType === 'VALUE_TYPE') && field.options) {
        initialProps[field.name] = getDefaultOptionValue(field.options);
      } else if (field.fieldType === 'BOOLEAN') {
        initialProps[field.name] = 'false';
      } else {
        initialProps[field.name] = '';
      }
    }

    return initialProps;
  }

  // Active Blueprint state with synchronous initial value
  const defaultBp = initialBpId
    ? worldStore.getBlueprint(initialBpId)
    : worldStore.getFirstClassBlueprints()[0];

  let selectedBlueprintId = $state(defaultBp ? defaultBp.id : 'bp-first-character');

  let selectedBlueprint = $derived(
    worldStore.getBlueprint(selectedBlueprintId) || worldStore.getFirstClassBlueprints()[0]
  );

  let name = $state('');
  let description = $state('');
  let properties = $state<Record<string, any>>(
    getInitialPropertiesForBlueprint(defaultBp)
  );

  function handleSelectBlueprint(bpId: string) {
    selectedBlueprintId = bpId;
    const bp = worldStore.getBlueprint(bpId);
    properties = getInitialPropertiesForBlueprint(bp);
  }

  function getArchetypeIcon(bp?: BlueprintDef) {
    if (!bp) return Boxes;
    const cat = (bp.category || '').toLowerCase();
    const nm = (bp.name || '').toLowerCase();
    if (
      cat.includes('char') ||
      nm.includes('cultivator') ||
      nm.includes('char') ||
      nm.includes('hero') ||
      nm.includes('protagonist')
    ) {
      return User;
    }
    if (
      cat.includes('relic') ||
      cat.includes('arm') ||
      cat.includes('weapon') ||
      nm.includes('weapon') ||
      nm.includes('relic') ||
      nm.includes('artifact')
    ) {
      return Sword;
    }
    if (
      cat.includes('cosmo') ||
      cat.includes('geo') ||
      cat.includes('loc') ||
      nm.includes('sanctuary') ||
      nm.includes('realm') ||
      nm.includes('location') ||
      nm.includes('peak')
    ) {
      return MapPin;
    }
    if (
      cat.includes('fac') ||
      cat.includes('sect') ||
      cat.includes('clan') ||
      nm.includes('faction') ||
      nm.includes('sect') ||
      nm.includes('clan') ||
      nm.includes('dynasty')
    ) {
      return Shield;
    }
    return Boxes;
  }

  function getArchetypeContext(bp?: BlueprintDef) {
    if (!bp) {
      return {
        archetypeLabel: 'Universe Entity',
        nameLabel: 'Entity Name',
        namePlaceholder: 'e.g. Lin Fan, Heavensbane Spear, Azure Cloud Peak, Azure Cloud Sword Sect',
        domainLabel: 'Domain / Category',
        loreLabel: 'Lore Background & Narrative Role',
        lorePlaceholder:
          'Lore summary, background origins, and narrative significance in your universe...',
      };
    }

    const catLower = (bp.category || '').toLowerCase();
    const nameLower = (bp.name || '').toLowerCase();

    if (
      catLower.includes('char') ||
      nameLower.includes('cultivator') ||
      nameLower.includes('char') ||
      nameLower.includes('hero') ||
      nameLower.includes('protagonist')
    ) {
      return {
        archetypeLabel: 'Character / Cultivator',
        nameLabel: 'Character / Cultivator Name',
        namePlaceholder: 'e.g. Lin Fan, Xiao Yan, Gu Changge, Meng Hao, Han Li',
        domainLabel: 'Cultivation Faction / Domain',
        loreLabel: 'Character Background, Personality & Story Arc',
        lorePlaceholder:
          'Character origins, personality traits, martial dao pursuit, spiritual bloodline, and narrative role in the novel...',
      };
    }

    if (
      catLower.includes('relic') ||
      catLower.includes('arm') ||
      catLower.includes('weapon') ||
      nameLower.includes('weapon') ||
      nameLower.includes('relic') ||
      nameLower.includes('artifact')
    ) {
      return {
        archetypeLabel: 'Sacred Relic & Weapon',
        nameLabel: 'Artifact / Sacred Relic Name',
        namePlaceholder:
          'e.g. Heavensbane Spear, Void-Sundering Lotus, Solar Emperor Bell, Celestial Frost Blade',
        domainLabel: 'Armament Classification',
        loreLabel: 'Forging Lore, Ancient Masters & Spirit Awakening',
        lorePlaceholder:
          'Forging origin, ancient lineage, awakening of the weapon soul, and past legendary wielders...',
      };
    }

    if (
      catLower.includes('cosmo') ||
      catLower.includes('geo') ||
      catLower.includes('loc') ||
      nameLower.includes('sanctuary') ||
      nameLower.includes('realm') ||
      nameLower.includes('location') ||
      nameLower.includes('peak')
    ) {
      return {
        archetypeLabel: 'Sanctuary & Spiritual Realm',
        nameLabel: 'Sanctuary / Location Name',
        namePlaceholder:
          'e.g. Azure Cloud Peak, Black Dragon Abyss, Nine Heavens Void, Kunlun Sanctuary',
        domainLabel: 'Cosmological Domain',
        loreLabel: 'Geographical Lore, Qi Formations & Regional Sects',
        lorePlaceholder:
          'Geographical terrain, spiritual Qi density, ancient protective formations, indigenous sects, and regional significance...',
      };
    }

    if (
      catLower.includes('fac') ||
      catLower.includes('sect') ||
      catLower.includes('clan') ||
      nameLower.includes('faction') ||
      nameLower.includes('sect') ||
      nameLower.includes('clan') ||
      nameLower.includes('dynasty')
    ) {
      return {
        archetypeLabel: 'Faction & Sect',
        nameLabel: 'Faction / Sect Name',
        namePlaceholder:
          'e.g. Azure Cloud Sword Sect, Void Immortal Palace, Heavenly Demon Sect, Solar Imperial Dynasty',
        domainLabel: 'Organizational Alignment',
        loreLabel: 'Sect History, Ancestral Lineage & Daoist Creed',
        lorePlaceholder:
          'Founding patriarch lore, ancestral spirit veins, internal division politics, and standing in the cultivation world...',
      };
    }

    return {
      archetypeLabel: bp.name,
      nameLabel: `${bp.name} Name`,
      namePlaceholder: `e.g. Name of this ${bp.name.toLowerCase()} instance...`,
      domainLabel: 'Classification / Domain',
      loreLabel: `${bp.name} Lore Background & Narrative Role`,
      lorePlaceholder: `Origins, universe context, and narrative significance for this ${bp.name.toLowerCase()}...`,
    };
  }

  let archetypeContext = $derived(getArchetypeContext(selectedBlueprint));
  let ArchetypeIcon = $derived(getArchetypeIcon(selectedBlueprint));

  function formatEnumOptions(
    options?: Array<
      string | { label: string; value: string; power?: number; numericValue?: number }
    >
  ) {
    if (!options) return [];
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      const power = opt.power ?? opt.numericValue;
      return {
        value: opt.value,
        label: power !== undefined ? `${opt.label} (Power: ${power})` : opt.label,
      };
    });
  }

  // Real-time live computed formulas for the entity being created
  let liveComputedFormulas = $derived.by(() => {
    if (!selectedBlueprint) return {};
    const dummyEntity = {
      id: 'preview',
      name: name || 'Draft Entity',
      blueprintId: selectedBlueprint.id,
      blueprintName: selectedBlueprint.name,
      category: selectedBlueprint.category,
      properties: $state.snapshot(properties),
      lastMutatedSeqNumber: 0,
    };
    const results = worldStore.evaluateEntityFormulas(dummyEntity, selectedBlueprint);
    const computed: Record<
      string,
      { value: number; formatted: string; expr: string; label: string }
    > = {};

    for (const field of selectedBlueprint.fields) {
      if (field.fieldType === 'FORMULA' && field.formulaExpression) {
        const val = results[field.name] ?? 0;
        computed[field.name] = {
          value: val,
          formatted: Number.isInteger(val) ? String(val) : val.toFixed(2),
          expr: field.formulaExpression,
          label: field.label || field.name,
        };
      }
    }

    return computed;
  });

  // Calculate live formula for a sub-blueprint
  function getSubBlueprintComputedFormula(
    targetBp: BlueprintDef,
    subFieldName: string,
    subPropValues: Record<string, any>
  ): { label: string; formatted: string; expr: string } | null {
    const formulaField = targetBp.fields.find((f) => f.fieldType === 'FORMULA' && f.formulaExpression);
    if (!formulaField || !formulaField.formulaExpression) return null;

    try {
      const res = evaluateFormula(formulaField.formulaExpression, subPropValues || {});
      if (!res.success || res.value === undefined) return null;
      const val = res.value;
      return {
        label: formulaField.label || formulaField.name,
        formatted: Number.isInteger(val) ? String(val) : val.toFixed(2),
        expr: formulaField.formulaExpression,
      };
    } catch {
      return null;
    }
  }

  // Categorize fields into direct attributes, sub-blueprint systems, relational links, and formulas
  const directFields = $derived(
    selectedBlueprint
      ? selectedBlueprint.fields.filter(
          (f) => f.fieldType !== 'BLUEPRINT_REF' && f.fieldType !== 'FORMULA'
        )
      : []
  );

  const subBlueprintRefFields = $derived(
    selectedBlueprint
      ? selectedBlueprint.fields.filter((f) => {
          if (f.fieldType !== 'BLUEPRINT_REF') return false;
          const target = worldStore.getBlueprint(f.targetBlueprintId);
          return target && target.blueprintClass === 'SECOND_CLASS';
        })
      : []
  );

  const relationalEntityRefFields = $derived(
    selectedBlueprint
      ? selectedBlueprint.fields.filter((f) => {
          if (f.fieldType !== 'BLUEPRINT_REF') return false;
          const target = worldStore.getBlueprint(f.targetBlueprintId);
          return !target || target.blueprintClass === 'FIRST_CLASS';
        })
      : []
  );

  function handleCreateEntity() {
    if (!name.trim()) {
      alert(`${archetypeContext.nameLabel} is required.`);
      return;
    }
    if (!selectedBlueprint) {
      alert('Please select a valid blueprint archetype.');
      return;
    }

    worldStore.addEntity({
      name: name.trim(),
      blueprintId: selectedBlueprint.id,
      blueprintName: selectedBlueprint.name,
      category: selectedBlueprint.category,
      description: description.trim(),
      properties: JSON.parse(JSON.stringify(properties)),
    });

    goto('/world/entities');
  }
</script>

<div class="max-w-4xl mx-auto space-y-7 pb-20">
  <!-- Breadcrumb -->
  <Breadcrumb
    items={[
      { label: 'World Studio', href: '/world' },
      { label: 'Universe Entities', href: '/world/entities' },
      { label: 'Instantiate New Entity' },
    ]}
  />

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
        <Boxes class="w-5 h-5 text-teal-400" />
        <span>Instantiate Universe Entity</span>
      </h2>
      <p class="text-xs text-zinc-400 mt-1">
        Instantiate concrete entity objects from 1st-Class Blueprints with interactive option pickers, sub-blueprint systems, and relational entity graph connections.
      </p>
    </div>
    <a href="/world/entities">
      <Button variant="outline" size="sm">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Entities</span>
      </Button>
    </a>
  </div>

  <!-- SECTION 1: Carousel of 1st-Class Blueprint Archetype Cards -->
  <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
    <!-- Carousel Header & Category Tabs -->
    <div class="space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Boxes class="w-4 h-4 text-teal-400" />
            <span>Select 1st-Class Blueprint Archetype</span>
          </h3>
          <p class="text-[11px] text-zinc-500 mt-0.5">
            1st-Class Blueprints instantiate standalone universe entity objects. Use the carousel below to select an archetype.
          </p>
        </div>

        <span class="text-[10px] text-zinc-400 font-mono self-start sm:self-auto">
          {filteredBlueprints.length} Archetypes Available
        </span>
      </div>

      <!-- Filter Tabs & Search -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {#each allCategories as cat}
            <button
              type="button"
              onclick={() => (selectedCategoryFilter = cat)}
              class={`px-2.5 py-1 rounded-md text-[11px] font-medium transition shrink-0 ${
                selectedCategoryFilter === cat
                  ? 'bg-teal-950 text-teal-300 border border-teal-700'
                  : 'bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {cat === 'ALL' ? 'All Archetypes' : cat}
            </button>
          {/each}
        </div>

        <div class="relative w-full sm:w-52 shrink-0">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
          <Input
            bind:value={searchArchetypeQuery}
            placeholder="Filter archetypes..."
            class="pl-8 h-7 text-[11px] w-full"
          />
        </div>
      </div>
    </div>

    <!-- Carousel Deck with Side Navigation Buttons and Hidden Scrollbar -->
    <div class="relative px-1 pt-1">
      <!-- Left Carousel Button (Always visible with distinct disabled, hover, and active states) -->
      <button
        type="button"
        onclick={() => scrollCarousel('left')}
        disabled={!canScrollLeft}
        aria-label="Previous Archetype"
        class="absolute -left-3 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 border border-zinc-700 text-teal-400 flex items-center justify-center shadow-lg shadow-black/80 transition-all duration-150 cursor-pointer hover:bg-zinc-800 hover:border-teal-400 hover:text-teal-300 hover:scale-105 active:scale-95 active:bg-teal-950 active:border-teal-500 active:text-teal-200 disabled:opacity-35 disabled:cursor-not-allowed disabled:bg-zinc-950 disabled:border-zinc-850 disabled:text-zinc-600 disabled:shadow-none disabled:scale-100 disabled:hover:scale-100 disabled:hover:border-zinc-850 disabled:hover:bg-zinc-950 disabled:hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Right Carousel Button (Always visible with distinct disabled, hover, and active states) -->
      <button
        type="button"
        onclick={() => scrollCarousel('right')}
        disabled={!canScrollRight}
        aria-label="Next Archetype"
        class="absolute -right-3 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 border border-zinc-700 text-teal-400 flex items-center justify-center shadow-lg shadow-black/80 transition-all duration-150 cursor-pointer hover:bg-zinc-800 hover:border-teal-400 hover:text-teal-300 hover:scale-105 active:scale-95 active:bg-teal-950 active:border-teal-500 active:text-teal-200 disabled:opacity-35 disabled:cursor-not-allowed disabled:bg-zinc-950 disabled:border-zinc-850 disabled:text-zinc-600 disabled:shadow-none disabled:scale-100 disabled:hover:scale-100 disabled:hover:border-zinc-850 disabled:hover:bg-zinc-950 disabled:hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <!-- Carousel Cards Track (Exact Page Grid, No Cut-Offs, Invisible Scrollbar) -->
      <div
        bind:this={carouselEl}
        onscroll={updateScrollState}
        class="flex items-stretch gap-3 overflow-x-auto py-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {#each filteredBlueprints as bp}
          {@const Icon = getArchetypeIcon(bp)}
          {@const isSelected = selectedBlueprintId === bp.id}
          {@const formulaCount = bp.fields.filter((f) => f.fieldType === 'FORMULA').length}
          {@const subSystemCount = bp.fields.filter((f) => {
            if (f.fieldType !== 'BLUEPRINT_REF') return false;
            const target = worldStore.getBlueprint(f.targetBlueprintId);
            return target && target.blueprintClass === 'SECOND_CLASS';
          }).length}
          {@const relationalLinkCount = bp.fields.filter((f) => {
            if (f.fieldType !== 'BLUEPRINT_REF') return false;
            const target = worldStore.getBlueprint(f.targetBlueprintId);
            return !target || target.blueprintClass === 'FIRST_CLASS';
          }).length}

          <button
            type="button"
            onclick={() => handleSelectBlueprint(bp.id)}
            class={`w-full sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] shrink-0 snap-start p-4 rounded-xl border text-left transition relative flex flex-col justify-between ${
              isSelected
                ? 'border-teal-500 bg-gradient-to-b from-teal-950/40 via-zinc-900 to-zinc-900 ring-1 ring-teal-500/60 shadow-md shadow-teal-950/50'
                : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/60'
            }`}
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div class={`p-1.5 rounded-lg ${isSelected ? 'bg-teal-900/60 text-teal-300 border border-teal-700' : 'bg-zinc-800/80 text-zinc-400'}`}>
                    <Icon class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="font-bold text-xs text-zinc-100">{bp.name}</div>
                    <span class="text-[10px] text-zinc-400 font-medium">{bp.category}</span>
                  </div>
                </div>
                {#if isSelected}
                  <span class="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700">
                    <Check class="w-3 h-3" />
                    <span>Selected</span>
                  </span>
                {/if}
              </div>

              <p class="text-[11px] text-zinc-400 mt-2.5 line-clamp-2 leading-relaxed">
                {bp.description}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-zinc-800/80 text-[10px] font-mono">
              <span class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-teal-400">
                {bp.fields.length} fields
              </span>
              {#if formulaCount > 0}
                <span class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400">
                  {formulaCount} math
                </span>
              {/if}
              {#if subSystemCount > 0}
                <span class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400">
                  {subSystemCount} sub-systems
                </span>
              {/if}
              {#if relationalLinkCount > 0}
                <span class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-purple-400">
                  {relationalLinkCount} links
                </span>
              {/if}
            </div>
          </button>
        {/each}

        <!-- Create New 1st-Class Blueprint Card -->
        <a
          href="/world/schemas/create?blueprintClass=FIRST_CLASS"
          target="_blank"
          class="w-full sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] shrink-0 snap-start p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 hover:border-teal-500 hover:bg-teal-950/10 transition flex flex-col justify-center items-center text-center space-y-2 text-zinc-400 hover:text-teal-300 min-h-[160px]"
        >
          <div class="p-2 rounded-full bg-zinc-900 border border-zinc-800">
            <Plus class="w-4 h-4 text-teal-400" />
          </div>
          <div class="font-bold text-xs">Create 1st-Class Blueprint</div>
          <p class="text-[10px] text-zinc-500 max-w-[180px]">
            Define new fields, categories, formulas, and relational schemas.
          </p>
        </a>
      </div>

      <!-- Pagination Dots -->
      {#if totalSlides > 1}
        <div class="flex items-center justify-center gap-1.5 pt-3">
          {#each Array(totalSlides) as _, idx}
            <button
              type="button"
              onclick={() => scrollToSlide(idx)}
              class={`h-1.5 rounded-full transition-all ${
                activeSlideIndex === idx
                  ? 'w-6 bg-teal-400'
                  : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Identity & Lore Inputs -->
    <div class="border-t border-zinc-800 pt-5 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <ArchetypeIcon class="w-4 h-4 text-teal-400" />
          <span>{archetypeContext.archetypeLabel} Identity</span>
        </h3>
        {#if selectedBlueprint}
          <span class="text-[11px] text-teal-400 font-medium px-2.5 py-0.5 rounded bg-teal-950/70 border border-teal-800/60">
            Bound Archetype: {selectedBlueprint.name}
          </span>
        {/if}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field id="entity-name" label={archetypeContext.nameLabel} required>
          <Input
            id="entity-name"
            bind:value={name}
            placeholder={archetypeContext.namePlaceholder}
            class="w-full text-xs font-medium"
          />
        </Field>

        <Field id="entity-cat" label={archetypeContext.domainLabel}>
          <Input
            id="entity-cat"
            value={selectedBlueprint ? selectedBlueprint.category : 'General'}
            disabled
            class="w-full text-xs opacity-80 cursor-not-allowed"
          />
        </Field>
      </div>

      <Field id="entity-desc" label={archetypeContext.loreLabel}>
        <Textarea
          id="entity-desc"
          bind:value={description}
          rows={3}
          placeholder={archetypeContext.lorePlaceholder}
          class="w-full text-xs leading-relaxed"
        />
      </Field>
    </div>
  </div>

  <!-- SECTION 2: Dynamic Template Attributes (1st-Class Options & Enums) -->
  {#if selectedBlueprint && directFields.length > 0}
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-teal-400" />
            <span>Dynamic Template Attributes ({selectedBlueprint.name})</span>
          </h3>
          <p class="text-xs text-zinc-500 mt-0.5">
            Select concrete attributes defined directly in the <strong>{selectedBlueprint.name}</strong> template.
          </p>
        </div>

        <a href={`/world/schemas/${selectedBlueprint.id}`} target="_blank" class="shrink-0">
          <Button variant="outline" size="sm" class="h-7 text-[11px] px-2.5">
            <Edit3 class="w-3 h-3 text-teal-400" />
            <span>Edit Blueprint Schema</span>
          </Button>
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each directFields as field}
          <!-- ENUM / VALUE_TYPE FIELD -->
          {#if field.fieldType === 'ENUM' || field.fieldType === 'VALUE_TYPE'}
            <div class="p-4 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-2.5 col-span-1 md:col-span-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  {#if field.fieldType === 'VALUE_TYPE'}
                    <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
                  {:else}
                    <ListFilter class="w-3.5 h-3.5 text-teal-400" />
                  {/if}
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-zinc-500">({field.name})</span>
                </Label>
              </div>

              {#if field.description}
                <p class="text-[11px] text-zinc-400">{field.description}</p>
              {/if}

              <div class="space-y-2">
                <div class="max-w-md">
                  <Select
                    bind:value={properties[field.name]}
                    options={formatEnumOptions(field.options)}
                  />
                </div>

                {#if field.options && field.options.length > 0}
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-[10px] text-zinc-500 mr-1 font-medium">Quick Select:</span>
                    {#each field.options as opt}
                      {@const optVal = typeof opt === 'string' ? opt : opt.value}
                      {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                      {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                      {@const isSelected = properties[field.name] === optVal || properties[field.name] === optLabel}
                      <button
                        type="button"
                        onclick={() => (properties[field.name] = optVal)}
                        class={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                          isSelected
                            ? field.fieldType === 'VALUE_TYPE'
                              ? 'bg-indigo-950 text-indigo-200 border border-indigo-600 ring-1 ring-indigo-500/60 shadow-sm'
                              : 'bg-teal-950 text-teal-200 border border-teal-600 ring-1 ring-teal-500/60 shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <span>{optLabel}</span>
                        {#if field.fieldType === 'VALUE_TYPE' && optPower !== undefined}
                          <span class={`text-[9px] font-mono px-1 py-0.2 rounded ${isSelected ? 'bg-indigo-900 text-indigo-300 font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                            ⚡ {optPower}
                          </span>
                        {/if}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

          <!-- NUMBER FIELD -->
          {:else if field.fieldType === 'NUMBER'}
            <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <Hash class="w-3.5 h-3.5 text-emerald-400" />
                  <span>{field.label}</span>
                  {#if field.unit}<span class="text-zinc-500 font-mono">({field.unit})</span>{/if}
                </Label>
                {#if field.min !== undefined && field.max !== undefined}
                  <span class="text-[10px] font-mono text-zinc-500">[{field.min} - {field.max}]</span>
                {/if}
              </div>

              {#if field.description}
                <p class="text-[10px] text-zinc-400">{field.description}</p>
              {/if}

              <Input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step || 1}
                bind:value={properties[field.name]}
                class="text-xs font-mono"
              />
            </div>

          <!-- BOOLEAN FIELD -->
          {:else if field.fieldType === 'BOOLEAN'}
            <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-1.5">
              <span class="block text-xs font-medium text-zinc-200">{field.label}</span>
              <Select
                bind:value={properties[field.name]}
                options={[
                  { value: 'true', label: 'True / Enabled' },
                  { value: 'false', label: 'False / Disabled' },
                ]}
              />
            </div>

          <!-- STRING FIELD -->
          {:else}
            <div class="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-1.5">
              <span class="block text-xs font-medium text-zinc-200">{field.label}</span>
              {#if field.description}
                <p class="text-[10px] text-zinc-400">{field.description}</p>
              {/if}
              <Input
                bind:value={properties[field.name]}
                class="text-xs"
              />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- SECTION 3: Sub-Blueprint Systems & Scales (2nd-Class Schemas) -->
  {#if subBlueprintRefFields.length > 0}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Layers class="w-4 h-4 text-cyan-400" />
          <span>Sub-Blueprint Systems & Scales (2nd-Class Schemas)</span>
        </h3>
        <span class="text-[11px] text-cyan-400/80 font-mono">Nested Sub-Systems</span>
      </div>

      {#each subBlueprintRefFields as field}
        {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
        {#if targetBp}
          {@const subFormula = properties[field.name] ? getSubBlueprintComputedFormula(targetBp, field.name, properties[field.name]) : null}
          <div class="p-5 rounded-lg border border-cyan-900/60 bg-gradient-to-br from-cyan-950/20 via-zinc-900 to-zinc-900 space-y-4 shadow-sm shadow-cyan-950/30">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Link2 class="w-4 h-4 text-cyan-400" />
                  <span>{field.label}</span>
                  <span class="text-zinc-500 font-mono">({field.name})</span>
                </div>
                <p class="text-[11px] text-zinc-400">{targetBp.description}</p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                  Sub-Blueprint: {targetBp.name}
                </span>
                <a href={`/world/schemas/${targetBp.id}`} target="_blank">
                  <Button variant="outline" size="sm" class="h-6 text-[10px] px-2 text-cyan-300 border-cyan-800 hover:bg-cyan-950/50">
                    <Edit3 class="w-2.5 h-2.5" />
                    <span>Schema</span>
                  </Button>
                </a>
              </div>
            </div>

            <!-- Nested Sub-Blueprint Fields Grid -->
            {#if properties[field.name]}
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {#each targetBp.fields as subF}
                  {#if subF.fieldType !== 'FORMULA'}
                    <div class="space-y-2 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
                      <div class="flex items-center justify-between">
                        <span class="block text-[11px] font-medium text-zinc-200">
                          {subF.label}
                          {#if subF.unit}<span class="text-zinc-500 font-mono">({subF.unit})</span>{/if}
                        </span>
                        {#if subF.min !== undefined && subF.max !== undefined}
                          <span class="text-[9px] font-mono text-zinc-500">[{subF.min}-{subF.max}]</span>
                        {/if}
                      </div>

                      {#if subF.fieldType === 'ENUM' || subF.fieldType === 'VALUE_TYPE'}
                        <div class="space-y-1.5">
                          <Select
                            bind:value={properties[field.name][subF.name]}
                            options={formatEnumOptions(subF.options)}
                          />
                          {#if subF.options && subF.options.length > 0}
                            <div class="flex flex-wrap gap-1 pt-0.5">
                              {#each subF.options as opt}
                                {@const optVal = typeof opt === 'string' ? opt : opt.value}
                                {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                                {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                                {@const isSelected = properties[field.name][subF.name] === optVal || properties[field.name][subF.name] === optLabel}
                                <button
                                  type="button"
                                  onclick={() => (properties[field.name][subF.name] = optVal)}
                                  class={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
                                    isSelected
                                      ? subF.fieldType === 'VALUE_TYPE'
                                        ? 'bg-indigo-950 text-indigo-200 border border-indigo-600 ring-1 ring-indigo-500/50'
                                        : 'bg-cyan-950 text-cyan-200 border border-cyan-600 ring-1 ring-cyan-500/50'
                                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  <span>{optLabel}</span>
                                  {#if subF.fieldType === 'VALUE_TYPE' && optPower !== undefined}
                                    <span class="text-[8px] font-mono opacity-90">⚡{optPower}</span>
                                  {/if}
                                </button>
                              {/each}
                            </div>
                          {/if}
                        </div>
                      {:else if subF.fieldType === 'NUMBER'}
                        <Input
                          type="number"
                          min={subF.min}
                          max={subF.max}
                          step={subF.step || 1}
                          bind:value={properties[field.name][subF.name]}
                          class="text-xs font-mono"
                        />
                      {:else if subF.fieldType === 'BOOLEAN'}
                        <Select
                          bind:value={properties[field.name][subF.name]}
                          options={[
                            { value: 'true', label: 'True / Enabled' },
                            { value: 'false', label: 'False / Disabled' },
                          ]}
                        />
                      {:else}
                        <Input
                          bind:value={properties[field.name][subF.name]}
                          class="text-xs"
                        />
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>

              {#if subFormula}
                <div class="p-2.5 rounded bg-cyan-950/40 border border-cyan-900/50 flex items-center justify-between text-xs">
                  <span class="text-cyan-300 font-medium">{subFormula.label}:</span>
                  <div class="flex items-center gap-2 font-mono">
                    <span class="text-[10px] text-cyan-400/70">{subFormula.expr}</span>
                    <span class="px-2 py-0.5 rounded bg-cyan-900/60 font-bold text-cyan-200">{subFormula.formatted}</span>
                  </div>
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/if}

  <!-- SECTION 4: 1st-Class Relational Entity Links (Entity Graph Connections) -->
  {#if relationalEntityRefFields.length > 0}
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h3 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Link2 class="w-4 h-4 text-purple-400" />
            <span>1st-Class Relational Entity Connections</span>
          </h3>
          <p class="text-xs text-zinc-500 mt-0.5">
            Connect this entity to other 1st-class entity objects (e.g. character owning a weapon, belonging to a faction).
          </p>
        </div>
        <span class="text-[11px] text-purple-400/80 font-mono">1st-Class Links</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each relationalEntityRefFields as field}
          {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
          {@const candidateEntities = targetBp ? worldStore.entities.filter((e) => e.blueprintId === targetBp.id) : worldStore.entities}
          <div class="p-4 rounded-lg border border-purple-950/70 bg-purple-950/15 space-y-2.5">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-medium text-purple-200 flex items-center gap-1.5">
                <Link2 class="w-3.5 h-3.5 text-purple-400" />
                <span>{field.label}</span>
              </Label>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                Target: {targetBp ? targetBp.name : '1st-Class Entity'}
              </span>
            </div>

            {#if field.description}
              <p class="text-[11px] text-zinc-400">{field.description}</p>
            {/if}

            <div class="space-y-2">
              <Select
                bind:value={properties[field.name]}
                options={[
                  { value: '', label: 'None (Unassigned)' },
                  ...candidateEntities.map((e) => ({
                    value: e.id,
                    label: `${e.name} (${e.category})`,
                  })),
                ]}
              />

              {#if candidateEntities.length > 0}
                <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span class="text-[10px] text-zinc-500 mr-1">Quick Link:</span>
                  <button
                    type="button"
                    onclick={() => (properties[field.name] = '')}
                    class={`px-2 py-0.5 rounded text-[10px] transition ${
                      !properties[field.name]
                        ? 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700'
                        : 'bg-zinc-950 text-zinc-500 border border-zinc-850 hover:text-zinc-300'
                    }`}
                  >
                    None
                  </button>
                  {#each candidateEntities as cand}
                    <button
                      type="button"
                      onclick={() => (properties[field.name] = cand.id)}
                      class={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
                        properties[field.name] === cand.id
                          ? 'bg-purple-950 text-purple-200 border border-purple-600 ring-1 ring-purple-500/50'
                          : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span>{cand.name}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- SECTION 5: Live Evaluated Mathematical Formulas (Sandbox) -->
  {#if Object.keys(liveComputedFormulas).length > 0}
    <div class="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 rounded-lg border border-amber-900/50 p-6 space-y-4 shadow-md shadow-amber-950/20">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Calculator class="w-4 h-4 text-amber-400" />
          <span>Live Evaluated Mathematical Formulas</span>
        </h3>
        <span class="text-[10px] text-amber-400/90 font-mono bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-800/70">
          Auto-evaluates instantly as you adjust any option above
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {#each Object.entries(liveComputedFormulas) as [fKey, fData]}
          <div class="p-4 rounded-lg bg-black/60 border border-amber-900/70 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-zinc-100">{fData.label}</span>
              <div class="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950 border border-amber-600 text-amber-300 font-mono text-base font-bold shadow-sm">
                <span>{fData.formatted}</span>
              </div>
            </div>
            <div class="text-[11px] font-mono text-amber-400/80 pt-1" title={fData.expr}>
              Formula: {fData.expr}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- SECTION 6: Actions -->
  <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
    <a href="/world/entities">
      <Button variant="outline" size="sm">Cancel</Button>
    </a>
    <Button variant="default" size="sm" onclick={handleCreateEntity}>
      <Check class="w-3.5 h-3.5" />
      <span>Instantiate {archetypeContext.archetypeLabel}</span>
    </Button>
  </div>
</div>
