<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    ArrowLeft,
    Check,
    Boxes,
    Sparkles,
    Calculator,
    Link2,
    ListFilter,
    Shield,
    Hash,
    Layers,
    Edit3,
    User,
    Sword,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    X,
  } from 'lucide-svelte';
  import {
    Button,
    Input,
    Select,
    Label,
    Field,
    Textarea,
    Breadcrumb,
    EmptyState,
  } from '$lib/components/ui';
  import { toast } from '$lib/stores/toastStore.svelte';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card';
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
    ...Array.from(new Set<string>(firstClassBlueprints.map((b: BlueprintDef) => b.category))),
  ]);

  const filteredBlueprints = $derived(
    firstClassBlueprints.filter((bp: BlueprintDef) => {
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
      } else if (field.fieldType === 'ARRAY' || field.fieldType === 'ARRAY_REF') {
        initialProps[field.name] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
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

  // Categorize fields into direct attributes, sub-blueprint systems, relational links, multi-references, and formulas
  const directFields = $derived(
    selectedBlueprint
      ? selectedBlueprint.fields.filter(
          (f: DynamicFieldDef) =>
            f.fieldType !== 'BLUEPRINT_REF' &&
            f.fieldType !== 'ARRAY_REF' &&
            f.fieldType !== 'FORMULA'
        )
      : []
  );

  const subBlueprintRefFields = $derived(
    selectedBlueprint
      ? selectedBlueprint.fields.filter((f: DynamicFieldDef) => {
          if (f.fieldType !== 'BLUEPRINT_REF') return false;
          const target = worldStore.getBlueprint(f.targetBlueprintId);
          return target && target.blueprintClass === 'SECOND_CLASS';
        })
      : []
  );

  const relationalEntityRefFields = $derived(
    selectedBlueprint
      ? selectedBlueprint.fields.filter((f: DynamicFieldDef) => {
          if (f.fieldType !== 'BLUEPRINT_REF') return false;
          const target = worldStore.getBlueprint(f.targetBlueprintId);
          return !target || target.blueprintClass === 'FIRST_CLASS';
        })
      : []
  );

  const arrayRefFields = $derived(
    selectedBlueprint
      ? selectedBlueprint.fields.filter((f: DynamicFieldDef) => f.fieldType === 'ARRAY_REF')
      : []
  );

  function handleCreateEntity() {
    if (!name.trim()) {
      toast.error('Validation Error', `${archetypeContext.nameLabel} is required.`);
      return;
    }
    if (!selectedBlueprint) {
      toast.error('Validation Error', 'Please select a valid blueprint archetype.');
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

    toast.success("Entity Instantiated", `"${name.trim()}" was successfully created from blueprint "${selectedBlueprint.name}".`);
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
  <div class="flex items-center justify-between border-b border-border pb-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
        <Boxes class="w-5 h-5 text-primary" />
        <span>Instantiate Universe Entity</span>
      </h2>
      <p class="text-xs text-muted-foreground mt-1">
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
  <Card class="p-6 space-y-5 border-border bg-card">
    <!-- Carousel Header & Category Tabs -->
    <div class="space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Boxes class="w-4 h-4 text-primary" />
            <span>Select 1st-Class Blueprint Archetype</span>
          </h3>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            1st-Class Blueprints instantiate standalone universe entity objects. Use the carousel below to select an archetype.
          </p>
        </div>

        <span class="text-[10px] text-muted-foreground font-mono self-start sm:self-auto">
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
              class={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer shrink-0 ${
                selectedCategoryFilter === cat
                  ? 'bg-secondary text-secondary-foreground border border-border font-semibold shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat === 'ALL' ? 'All Archetypes' : cat}
            </button>
          {/each}
        </div>

        <div class="relative w-full sm:w-52 shrink-0">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
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
        class="absolute -left-3 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-card border border-border text-primary flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer hover:bg-secondary hover:border-primary hover:scale-105 active:scale-95 active:bg-secondary active:border-primary disabled:opacity-35 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:border-border/60 disabled:text-muted-foreground disabled:shadow-none disabled:scale-100 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Right Carousel Button (Always visible with distinct disabled, hover, and active states) -->
      <button
        type="button"
        onclick={() => scrollCarousel('right')}
        disabled={!canScrollRight}
        aria-label="Next Archetype"
        class="absolute -right-3 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-card border border-border text-primary flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer hover:bg-secondary hover:border-primary hover:scale-105 active:scale-95 active:bg-secondary active:border-primary disabled:opacity-35 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:border-border/60 disabled:text-muted-foreground disabled:shadow-none disabled:scale-100 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <!-- Carousel Cards Track (Exact Page Grid, No Cut-Offs, Invisible Scrollbar) -->
      <div
        bind:this={carouselEl}
        onscroll={updateScrollState}
        class="flex items-stretch gap-3 overflow-x-auto py-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {#each filteredBlueprints as bp (bp.id)}
          {@const Icon = getArchetypeIcon(bp)}
          {@const isSelected = selectedBlueprintId === bp.id}
          {@const formulaCount = bp.fields.filter((f: DynamicFieldDef) => f.fieldType === 'FORMULA').length}
          {@const subSystemCount = bp.fields.filter((f: DynamicFieldDef) => {
            if (f.fieldType !== 'BLUEPRINT_REF') return false;
            const target = worldStore.getBlueprint(f.targetBlueprintId);
            return target && target.blueprintClass === 'SECOND_CLASS';
          }).length}
          {@const relationalLinkCount = bp.fields.filter((f: DynamicFieldDef) => {
            if (f.fieldType !== 'BLUEPRINT_REF') return false;
            const target = worldStore.getBlueprint(f.targetBlueprintId);
            return !target || target.blueprintClass === 'FIRST_CLASS';
          }).length}

          <button
            type="button"
            onclick={() => handleSelectBlueprint(bp.id)}
            class={`w-full sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] shrink-0 snap-start p-4 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
              isSelected
                ? 'border-primary bg-secondary/80 ring-1 ring-ring shadow-md'
                : 'border-border bg-card/60 hover:border-border/80 hover:bg-muted/50'
            }`}
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div class={`p-1.5 rounded-lg ${isSelected ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                    <Icon class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="font-bold text-xs text-foreground">{bp.name}</div>
                    <span class="text-[10px] text-muted-foreground font-medium">{bp.category}</span>
                  </div>
                </div>
                {#if isSelected}
                  <span class="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    <Check class="w-3 h-3" />
                    <span>Selected</span>
                  </span>
                {/if}
              </div>

              <p class="text-[11px] text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">
                {bp.description}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-border/80 text-[10px] font-mono">
              <span class="px-1.5 py-0.5 rounded bg-muted border border-border text-primary font-medium">
                {bp.fields.length} fields
              </span>
              {#if formulaCount > 0}
                <span class="px-1.5 py-0.5 rounded bg-muted border border-border text-amber-500 font-medium">
                  {formulaCount} math
                </span>
              {/if}
              {#if subSystemCount > 0}
                <span class="px-1.5 py-0.5 rounded bg-muted border border-border text-cyan-500 font-medium">
                  {subSystemCount} sub-systems
                </span>
              {/if}
              {#if relationalLinkCount > 0}
                <span class="px-1.5 py-0.5 rounded bg-muted border border-border text-primary font-medium">
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
          class="w-full sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] shrink-0 snap-start p-4 rounded-xl border border-dashed border-border bg-card/40 hover:border-primary hover:bg-muted/40 transition flex flex-col justify-center items-center text-center space-y-2 text-muted-foreground hover:text-foreground min-h-[160px]"
        >
          <div class="p-2 rounded-full bg-muted border border-border">
            <Plus class="w-4 h-4 text-primary" />
          </div>
          <div class="font-bold text-xs text-foreground">Create 1st-Class Blueprint</div>
          <p class="text-[10px] text-muted-foreground max-w-[180px]">
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
              class={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeSlideIndex === idx
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Identity & Lore Inputs -->
    <div class="border-t border-border pt-5 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <ArchetypeIcon class="w-4 h-4 text-primary" />
          <span>{archetypeContext.archetypeLabel} Identity</span>
        </h3>
        {#if selectedBlueprint}
          <span class="text-[11px] text-primary font-medium px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20">
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
  </Card>

  <!-- SECTION 2: Dynamic Template Attributes (1st-Class Options & Enums) -->
  {#if selectedBlueprint && directFields.length > 0}
    <Card class="p-6 space-y-5 border-border bg-card">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-primary" />
            <span>Dynamic Template Attributes ({selectedBlueprint.name})</span>
          </h3>
          <p class="text-xs text-muted-foreground mt-0.5">
            Select concrete attributes defined directly in the <strong>{selectedBlueprint.name}</strong> template.
          </p>
        </div>

        <a href={`/world/schemas/${selectedBlueprint.id}`} target="_blank" class="shrink-0">
          <Button variant="outline" size="sm" class="h-7 text-[11px] px-2.5">
            <Edit3 class="w-3 h-3 text-primary" />
            <span>Edit Blueprint Schema</span>
          </Button>
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each directFields as field}
          <!-- ENUM / VALUE_TYPE FIELD -->
          {#if field.fieldType === 'ENUM' || field.fieldType === 'VALUE_TYPE'}
            <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5 col-span-1 md:col-span-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                  {#if field.fieldType === 'VALUE_TYPE'}
                    <Sparkles class="w-3.5 h-3.5 text-primary" />
                  {:else}
                    <ListFilter class="w-3.5 h-3.5 text-primary" />
                  {/if}
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-muted-foreground">({field.name})</span>
                </Label>
              </div>

              {#if field.description}
                <p class="text-[11px] text-muted-foreground">{field.description}</p>
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
                    <span class="text-[10px] text-muted-foreground mr-1 font-medium">Quick Select:</span>
                    {#each field.options as opt}
                      {@const optVal = typeof opt === 'string' ? opt : opt.value}
                      {@const optLabel = typeof opt === 'string' ? opt : opt.label}
                      {@const optPower = typeof opt === 'string' ? undefined : (opt.power ?? opt.numericValue)}
                      {@const isSelected = properties[field.name] === optVal || properties[field.name] === optLabel}
                      <button
                        type="button"
                        onclick={() => (properties[field.name] = optVal)}
                        class={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-secondary text-secondary-foreground border border-border ring-1 ring-ring shadow-xs'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{optLabel}</span>
                        {#if field.fieldType === 'VALUE_TYPE' && optPower !== undefined}
                          <span class={`text-[9px] font-mono px-1 py-0.2 rounded ${isSelected ? 'bg-primary/20 text-primary font-bold' : 'bg-muted text-muted-foreground'}`}>
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
            <div class="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Hash class="w-3.5 h-3.5 text-emerald-500" />
                  <span>{field.label}</span>
                  {#if field.unit}<span class="text-muted-foreground font-mono">({field.unit})</span>{/if}
                </Label>
                {#if field.min !== undefined && field.max !== undefined}
                  <span class="text-[10px] font-mono text-muted-foreground">[{field.min} - {field.max}]</span>
                {/if}
              </div>

              {#if field.description}
                <p class="text-[10px] text-muted-foreground">{field.description}</p>
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

          <!-- ARRAY FIELD (e.g. Titles, Attack Techniques, Aliases) -->
          {:else if field.fieldType === 'ARRAY'}
            <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5 col-span-1 md:col-span-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ListFilter class="w-3.5 h-3.5 text-indigo-500" />
                  <span>{field.label}</span>
                  <span class="text-[10px] font-mono text-muted-foreground">({field.name})</span>
                </Label>
                <span class="text-[10px] font-mono text-muted-foreground">
                  {(properties[field.name] || []).length} items
                </span>
              </div>

              {#if field.description}
                <p class="text-[11px] text-muted-foreground">{field.description}</p>
              {/if}

              <!-- Tag list / chip display -->
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 rounded-md bg-background border border-input">
                  {#if !properties[field.name] || properties[field.name].length === 0}
                    <span class="text-xs text-muted-foreground italic">No items added yet. Type below and press Enter or click Add.</span>
                  {:else}
                    {#each properties[field.name] as item, itemIdx}
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                        <span>{item}</span>
                        <button
                          type="button"
                          onclick={() => {
                            properties[field.name] = properties[field.name].filter((_: string, idx: number) => idx !== itemIdx);
                          }}
                          class="hover:text-destructive cursor-pointer"
                        >
                          <X class="w-3 h-3" />
                        </button>
                      </span>
                    {/each}
                  {/if}
                </div>

                <!-- Input to add item -->
                <div class="flex items-center gap-2 max-w-md">
                  <Input
                    id={`array-input-${field.name}`}
                    type="text"
                    placeholder="Type title, technique, or tag name..."
                    class="h-8 text-xs"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          properties[field.name] = [...(properties[field.name] || []), val];
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    class="h-8 text-xs shrink-0"
                    onclick={() => {
                      const input = document.getElementById(`array-input-${field.name}`) as HTMLInputElement;
                      if (input && input.value.trim()) {
                        properties[field.name] = [...(properties[field.name] || []), input.value.trim()];
                        input.value = '';
                      }
                    }}
                  >
                    <Plus class="w-3 h-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            </div>

          <!-- BOOLEAN FIELD -->
          {:else if field.fieldType === 'BOOLEAN'}
            <div class="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
              <span class="block text-xs font-medium text-foreground">{field.label}</span>
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
            <div class="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
              <span class="block text-xs font-medium text-foreground">{field.label}</span>
              {#if field.description}
                <p class="text-[10px] text-muted-foreground">{field.description}</p>
              {/if}
              <Input
                bind:value={properties[field.name]}
                class="text-xs"
              />
            </div>
          {/if}
        {/each}
      </div>
    </Card>
  {/if}

  <!-- SECTION 3: Sub-Blueprint Systems & Scales (2nd-Class Schemas) -->
  {#if subBlueprintRefFields.length > 0}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Layers class="w-4 h-4 text-cyan-500" />
          <span>Sub-Blueprint Systems & Scales (2nd-Class Schemas)</span>
        </h3>
        <span class="text-[11px] text-cyan-500 font-mono">Nested Sub-Systems</span>
      </div>

      {#each subBlueprintRefFields as field}
        {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
        {#if targetBp}
          {@const subFormula = properties[field.name] ? getSubBlueprintComputedFormula(targetBp, field.name, properties[field.name]) : null}
          <Card class="p-5 border-cyan-500/30 bg-card space-y-4 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  <Link2 class="w-4 h-4 text-cyan-500" />
                  <span>{field.label}</span>
                  <span class="text-muted-foreground font-mono">({field.name})</span>
                </div>
                <p class="text-[11px] text-muted-foreground">{targetBp.description}</p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                  Sub-Blueprint: {targetBp.name}
                </span>
                <a href={`/world/schemas/${targetBp.id}`} target="_blank">
                  <Button variant="outline" size="sm" class="h-6 text-[10px] px-2 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10">
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
                    <div class="space-y-2 p-3 rounded-lg bg-muted/40 border border-border">
                      <div class="flex items-center justify-between">
                        <span class="block text-[11px] font-medium text-foreground">
                          {subF.label}
                          {#if subF.unit}<span class="text-muted-foreground font-mono">({subF.unit})</span>{/if}
                        </span>
                        {#if subF.min !== undefined && subF.max !== undefined}
                          <span class="text-[9px] font-mono text-muted-foreground">[{subF.min}-{subF.max}]</span>
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
                                  class={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-secondary text-secondary-foreground border border-border ring-1 ring-ring'
                                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
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
                <div class="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs">
                  <span class="text-cyan-600 dark:text-cyan-300 font-medium">{subFormula.label}:</span>
                  <div class="flex items-center gap-2 font-mono">
                    <span class="text-[10px] text-cyan-600/80 dark:text-cyan-400/80">{subFormula.expr}</span>
                    <span class="px-2 py-0.5 rounded bg-cyan-500/20 font-bold text-cyan-700 dark:text-cyan-200">{subFormula.formatted}</span>
                  </div>
                </div>
              {/if}
            {/if}
          </Card>
        {/if}
      {/each}
    </div>
  {/if}

  <!-- SECTION 4: 1st-Class Relational Entity Links & Multi-References (Entity Graph Connections) -->
  {#if relationalEntityRefFields.length > 0 || arrayRefFields.length > 0}
    <Card class="p-6 space-y-4 border-border bg-card">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Link2 class="w-4 h-4 text-primary" />
            <span>1st-Class Relational Entity Connections & Multi-References</span>
          </h3>
          <p class="text-xs text-muted-foreground mt-0.5">
            Connect this entity to other 1st-class entity objects (e.g. character owning weapons, learned martial techniques, belonging to factions).
          </p>
        </div>
        <span class="text-[11px] text-primary font-mono">Entity Graph Links</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Single Entity Reference Fields -->
        {#each relationalEntityRefFields as field}
          {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
          {@const candidateEntities = targetBp ? worldStore.entities.filter((e: any) => e.blueprintId === targetBp.id) : worldStore.entities}
          <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2.5">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Link2 class="w-3.5 h-3.5 text-primary" />
                <span>{field.label}</span>
              </Label>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                Target: {targetBp ? targetBp.name : '1st-Class Entity'}
              </span>
            </div>

            {#if field.description}
              <p class="text-[11px] text-muted-foreground">{field.description}</p>
            {/if}

            <div class="space-y-2">
              <Select
                bind:value={properties[field.name]}
                options={[
                  { value: '', label: 'None (Unassigned)' },
                  ...candidateEntities.map((e: any) => ({
                    value: e.id,
                    label: `${e.name} (${e.category})`,
                  })),
                ]}
              />

              {#if candidateEntities.length > 0}
                <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span class="text-[10px] text-muted-foreground mr-1">Quick Link:</span>
                  <button
                    type="button"
                    onclick={() => (properties[field.name] = '')}
                    class={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      !properties[field.name]
                        ? 'bg-secondary text-secondary-foreground font-bold border border-border'
                        : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                    }`}
                  >
                    None
                  </button>
                  {#each candidateEntities as cand}
                    <button
                      type="button"
                      onclick={() => (properties[field.name] = cand.id)}
                      class={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                        properties[field.name] === cand.id
                          ? 'bg-secondary text-secondary-foreground border border-border ring-1 ring-ring'
                          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
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

        <!-- Multi-Reference Entity Fields (ARRAY_REF) -->
        {#each arrayRefFields as field}
          {@const targetBp = worldStore.getBlueprint(field.targetBlueprintId)}
          {@const candidateEntities = targetBp ? worldStore.entities.filter((e: any) => e.blueprintId === targetBp.id) : worldStore.entities}
          {@const selectedIds = properties[field.name] || []}
          {@const unselectedCandidates = candidateEntities.filter((e: any) => !selectedIds.includes(e.id))}
          <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-3 col-span-1 md:col-span-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Link2 class="w-3.5 h-3.5 text-cyan-500" />
                <span>{field.label}</span>
                <span class="text-[10px] font-mono text-muted-foreground">({field.name})</span>
              </Label>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                Multi-Ref: {targetBp ? targetBp.name : '1st-Class Entity'} ({selectedIds.length} linked)
              </span>
            </div>

            {#if field.description}
              <p class="text-[11px] text-muted-foreground">{field.description}</p>
            {/if}

            <!-- Selected linked entities chips -->
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 rounded-md bg-background border border-input">
                {#if selectedIds.length === 0}
                  <span class="text-xs text-muted-foreground italic">No linked entities attached. Select from the dropdown below to add.</span>
                {:else}
                  {#each selectedIds as linkedId}
                    {@const linkedEnt = worldStore.entities.find((e: any) => e.id === linkedId)}
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-700 dark:text-cyan-300 font-medium">
                      <span>{linkedEnt ? linkedEnt.name : linkedId}</span>
                      <button
                        type="button"
                        onclick={() => {
                          properties[field.name] = properties[field.name].filter((id: string) => id !== linkedId);
                        }}
                        class="hover:text-destructive cursor-pointer"
                      >
                        <X class="w-3 h-3" />
                      </button>
                    </span>
                  {/each}
                {/if}
              </div>

              <!-- Selector to attach more entities -->
              {#if unselectedCandidates.length > 0}
                <div class="max-w-md">
                  <Select
                    value=""
                    placeholder="Attach an entity reference..."
                    options={unselectedCandidates.map((e: any) => ({
                      value: e.id,
                      label: `${e.name} (${e.category})`,
                    }))}
                    onchange={(val) => {
                      if (val && !selectedIds.includes(val)) {
                        properties[field.name] = [...selectedIds, val];
                      }
                    }}
                  />
                </div>
              {:else if candidateEntities.length === 0}
                <p class="text-[11px] text-muted-foreground italic">
                  No {targetBp ? targetBp.name : 'matching'} entities created yet in the universe.
                </p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </Card>
  {/if}

  <!-- SECTION 5: Live Evaluated Mathematical Formulas (Sandbox) -->
  {#if Object.keys(liveComputedFormulas).length > 0}
    <Card class="p-6 space-y-4 border-amber-500/40 bg-card shadow-xs">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Calculator class="w-4 h-4 text-amber-500" />
          <span>Live Evaluated Mathematical Formulas</span>
        </h3>
        <span class="text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
          Auto-evaluates instantly as you adjust any option above
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {#each Object.entries(liveComputedFormulas) as [fKey, fData]}
          <div class="p-4 rounded-lg bg-muted/50 border border-amber-500/30 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-foreground">{fData.label}</span>
              <div class="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-mono text-base font-bold shadow-xs">
                <span>{fData.formatted}</span>
              </div>
            </div>
            <div class="text-[11px] font-mono text-muted-foreground pt-1" title={fData.expr}>
              Formula: {fData.expr}
            </div>
          </div>
        {/each}
      </div>
    </Card>
  {/if}

  <!-- SECTION 6: Actions -->
  <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
    <a href="/world/entities">
      <Button variant="outline" size="sm">Cancel</Button>
    </a>
    <Button variant="default" size="sm" onclick={handleCreateEntity}>
      <Check class="w-3.5 h-3.5" />
      <span>Instantiate {archetypeContext.archetypeLabel}</span>
    </Button>
  </div>
</div>

