<script lang="ts">
  import {
    BookOpen,
    Edit3,
    ListTree,
    BarChart3,
    Plus,
    Clock,
    FileText,
    Sparkles,
    ChevronRight,
    Globe2,
  } from "lucide-svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { proseStore } from "$lib/stores/proseStore.svelte";

  let isNewChapterModalOpen = $state(false);
  let newChapterTitle = $state("");
  let newChapterSynopsis = $state("");

  const project = $derived(projectStore.activeProject);
  const totalWords = $derived(proseStore.totalWordCount);
  const totalChapters = $derived(proseStore.totalChaptersCount);
  const totalScenes = $derived(proseStore.totalScenesCount);
  const readingTimeMin = $derived(Math.ceil(totalWords / 200));

  function handleCreateChapter(e: Event) {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    proseStore.createChapter({
      title: newChapterTitle.trim(),
      synopsis: newChapterSynopsis.trim() || undefined,
    });
    newChapterTitle = "";
    newChapterSynopsis = "";
    isNewChapterModalOpen = false;
  }
</script>

<svelte:head>
  <title>{project ? `${project.name} - Prose Studio` : "Prose Studio"} | NovWrite</title>
</svelte:head>

<div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0">
  <!-- Hero Section: Novel Identity & Quick Stats -->
  <div class="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-2 min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles class="w-3 h-3" />
            {project?.genre || "Creative Fiction"}
          </span>
          <span class="text-xs text-muted-foreground">
            Created on {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Recent"}
          </span>
        </div>

        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
          {project?.name || "Untitled Novel"}
        </h1>

        <p class="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-3xl">
          {project?.description || "No universe synopsis provided yet. Define your world canon and write captivating prose."}
        </p>
      </div>

      <!-- Quick Action Buttons Tray -->
      <div class="flex flex-wrap items-center gap-2.5 shrink-0">
        <a
          href="/novel/editor"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs min-h-[40px]"
        >
          <Edit3 class="w-4 h-4" />
          <span>Open Canvas Editor</span>
        </a>
        <button
          type="button"
          onclick={() => (isNewChapterModalOpen = true)}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground border border-border text-xs sm:text-sm font-semibold hover:bg-muted transition-colors min-h-[40px] cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>New Chapter</span>
        </button>
      </div>
    </div>

    <!-- Quick Metric Cards Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border">
      <div class="bg-muted/40 p-3 rounded-lg border border-border/50">
        <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Total Words</span>
        <span class="text-lg sm:text-xl font-bold text-foreground mt-0.5 block">{totalWords.toLocaleString()}</span>
      </div>
      <div class="bg-muted/40 p-3 rounded-lg border border-border/50">
        <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Chapters</span>
        <span class="text-lg sm:text-xl font-bold text-foreground mt-0.5 block">{totalChapters}</span>
      </div>
      <div class="bg-muted/40 p-3 rounded-lg border border-border/50">
        <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Scenes</span>
        <span class="text-lg sm:text-xl font-bold text-foreground mt-0.5 block">{totalScenes}</span>
      </div>
      <div class="bg-muted/40 p-3 rounded-lg border border-border/50">
        <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Est. Reading Time</span>
        <span class="text-lg sm:text-xl font-bold text-foreground mt-0.5 block">{readingTimeMin} min</span>
      </div>
    </div>
  </div>

  <!-- Studio Quick Navigation Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <a
      href="/novel/editor"
      class="group p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between space-y-4"
    >
      <div class="space-y-2">
        <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Edit3 class="w-4 h-4" />
        </div>
        <h2 class="text-sm sm:text-base font-bold text-foreground">Canvas Prose Editor</h2>
        <p class="text-xs text-muted-foreground">
          Distraction-free canvas with live word counts, entity mention autocomplete, and real-time auto-saving.
        </p>
      </div>
      <div class="flex items-center text-xs font-semibold text-primary pt-2">
        <span>Enter Canvas</span>
        <ChevronRight class="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </a>

    <a
      href="/novel/outline"
      class="group p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between space-y-4"
    >
      <div class="space-y-2">
        <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <ListTree class="w-4 h-4" />
        </div>
        <h2 class="text-sm sm:text-base font-bold text-foreground">Manuscript Outline</h2>
        <p class="text-xs text-muted-foreground">
          Architect acts, chapters, and scene beats. Reorder plot threads and map causal timeline sequences.
        </p>
      </div>
      <div class="flex items-center text-xs font-semibold text-primary pt-2">
        <span>View Outline</span>
        <ChevronRight class="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </a>

    <a
      href="/novel/stats"
      class="group p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between space-y-4"
    >
      <div class="space-y-2">
        <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <BarChart3 class="w-4 h-4" />
        </div>
        <h2 class="text-sm sm:text-base font-bold text-foreground">Writing Telemetry</h2>
        <p class="text-xs text-muted-foreground">
          Monitor writing output, daily word milestones, pacing distribution, and manuscript velocity metrics.
        </p>
      </div>
      <div class="flex items-center text-xs font-semibold text-primary pt-2">
        <span>Open Analytics</span>
        <ChevronRight class="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </a>
  </div>

  <!-- Chapters & Manuscript Breakdown -->
  <div class="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2.5">
        <BookOpen class="w-5 h-5 text-primary shrink-0" />
        <h2 class="text-base sm:text-lg font-bold tracking-tight">Manuscript Chapters</h2>
      </div>

      <button
        type="button"
        onclick={() => (isNewChapterModalOpen = true)}
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Chapter</span>
      </button>
    </div>

    {#if proseStore.chapters.length === 0}
      <div class="text-center py-10 px-4 border border-dashed border-border rounded-lg space-y-3 bg-muted/20">
        <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <FileText class="w-5 h-5" />
        </div>
        <h3 class="text-sm font-semibold">No Chapters Created Yet</h3>
        <p class="text-xs text-muted-foreground max-w-sm mx-auto">
          Every great epic begins with Chapter One. Scaffold your first chapter to start writing scenes.
        </p>
        <button
          type="button"
          onclick={() => (isNewChapterModalOpen = true)}
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer min-h-[38px]"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Create Chapter 1</span>
        </button>
      </div>
    {:else}
      <div class="space-y-3">
        {#each proseStore.sortedChapters as chapter, idx}
          {@const scenes = proseStore.getScenesForChapter(chapter.id)}
          {@const chapterWords = scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0)}
          <div class="p-4 bg-muted/30 border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-muted-foreground">#{idx + 1}</span>
                <h3 class="text-sm font-bold text-foreground truncate">{chapter.title}</h3>
              </div>
              {#if chapter.synopsis}
                <p class="text-xs text-muted-foreground line-clamp-1">{chapter.synopsis}</p>
              {/if}
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0 text-xs">
              <span class="text-muted-foreground">{scenes.length} scene{scenes.length === 1 ? '' : 's'}</span>
              <span class="font-medium text-foreground">{chapterWords.toLocaleString()} words</span>
              <a
                href="/novel/editor"
                onclick={() => proseStore.selectChapter(chapter.id)}
                class="px-2.5 py-1.5 rounded-md bg-secondary text-secondary-foreground font-semibold hover:bg-muted border border-border transition-colors shrink-0"
              >
                Open in Editor
              </a>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Modal: New Chapter Dialog (Viewport-Safe & Zero-Close-Button Rule) -->
{#if isNewChapterModalOpen}
  <div
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    onclick={() => (isNewChapterModalOpen = false)}
    onkeydown={(e) => e.key === 'Escape' && (isNewChapterModalOpen = false)}
    role="button"
    tabindex="0"
    aria-label="Close Backdrop"
  >
    <div
      class="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[min(90dvh,600px)] flex flex-col overflow-hidden text-left"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Create Chapter"
      tabindex="-1"
    >
      <div class="p-5 border-b border-border shrink-0">
        <h3 class="text-base font-bold text-foreground">Create New Chapter</h3>
        <p class="text-xs text-muted-foreground mt-0.5">Scaffold a new chapter in your manuscript.</p>
      </div>

      <form onsubmit={handleCreateChapter} class="p-5 overflow-y-auto flex-1 space-y-4">
        <div class="space-y-1.5">
          <label for="chapter-title" class="text-xs font-semibold text-foreground">Chapter Title *</label>
          <input
            id="chapter-title"
            type="text"
            bind:value={newChapterTitle}
            placeholder="e.g. Chapter 1: The Gathering Storm"
            required
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px]"
          />
        </div>

        <div class="space-y-1.5">
          <label for="chapter-synopsis" class="text-xs font-semibold text-foreground">Chapter Synopsis / Arc</label>
          <textarea
            id="chapter-synopsis"
            bind:value={newChapterSynopsis}
            rows="3"
            placeholder="Brief description of what occurs in this chapter..."
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          ></textarea>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2.5 sticky bottom-0 bg-card">
          <button
            type="button"
            onclick={() => (isNewChapterModalOpen = false)}
            class="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-muted transition-colors min-h-[38px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newChapterTitle.trim()}
            class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 min-h-[38px] cursor-pointer"
          >
            Create Chapter
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
