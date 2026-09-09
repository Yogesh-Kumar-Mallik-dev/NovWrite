<script lang="ts">
  import {
    ListTree,
    BookOpen,
    Plus,
    Edit3,
    Trash2,
    Clock,
    ChevronDown,
    ChevronRight,
    Sparkles,
    FileText,
  } from "lucide-svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { proseStore, type SceneStatus } from "$lib/stores/proseStore.svelte";

  let expandedChapters = $state<Record<string, boolean>>({});
  let isNewChapterModalOpen = $state(false);
  let newChapterTitle = $state("");
  let newChapterSynopsis = $state("");

  let isNewSceneModalOpen = $state(false);
  let targetChapterIdForScene = $state("");
  let newSceneTitle = $state("");
  let newSceneSynopsis = $state("");
  let newSceneTargetWords = $state(1500);

  const chapters = $derived(proseStore.sortedChapters);

  // Default expand all chapters
  $effect(() => {
    const next: Record<string, boolean> = {};
    chapters.forEach((c) => {
      if (expandedChapters[c.id] === undefined) {
        next[c.id] = true;
      } else {
        next[c.id] = expandedChapters[c.id];
      }
    });
    expandedChapters = next;
  });

  function toggleChapter(id: string) {
    expandedChapters[id] = !expandedChapters[id];
  }

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

  function handleCreateScene(e: Event) {
    e.preventDefault();
    if (!newSceneTitle.trim() || !targetChapterIdForScene) return;
    proseStore.createScene({
      chapterId: targetChapterIdForScene,
      title: newSceneTitle.trim(),
      synopsis: newSceneSynopsis.trim() || undefined,
      targetWordCount: newSceneTargetWords || 1500,
    });
    newSceneTitle = "";
    newSceneSynopsis = "";
    isNewSceneModalOpen = false;
  }

  function openCreateScene(chapterId: string) {
    targetChapterIdForScene = chapterId;
    isNewSceneModalOpen = true;
  }
</script>

<svelte:head>
  <title>Manuscript Outline | NovWrite</title>
</svelte:head>

<div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0">
  <!-- Top Outline Bar -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
    <div class="space-y-1 min-w-0">
      <div class="flex items-center gap-2">
        <ListTree class="w-5 h-5 text-primary shrink-0" />
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
          Manuscript Outline
        </h1>
      </div>
      <p class="text-xs sm:text-sm text-muted-foreground">
        Structure your narrative arcs, sequence scenes, and track progression across chapters.
      </p>
    </div>

    <div class="flex items-center gap-2.5 shrink-0">
      <button
        type="button"
        onclick={() => (isNewChapterModalOpen = true)}
        class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer min-h-[38px]"
      >
        <Plus class="w-4 h-4" />
        <span>Add Chapter</span>
      </button>
    </div>
  </div>

  <!-- Chapters & Scene Cards Tree -->
  {#if chapters.length === 0}
    <div class="text-center py-16 px-4 border border-dashed border-border rounded-xl space-y-3 bg-muted/10">
      <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <BookOpen class="w-6 h-6" />
      </div>
      <h2 class="text-base font-bold">Your Outline is Empty</h2>
      <p class="text-xs text-muted-foreground max-w-md mx-auto">
        Add your first chapter to begin scaffolding your novel's manuscript outline.
      </p>
      <button
        type="button"
        onclick={() => (isNewChapterModalOpen = true)}
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer min-h-[40px]"
      >
        <Plus class="w-4 h-4" />
        <span>Create Chapter 1</span>
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each chapters as chapter, index}
        {@const scenes = proseStore.getScenesForChapter(chapter.id)}
        {@const isExpanded = expandedChapters[chapter.id] ?? true}
        {@const chapterWordCount = scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0)}

        <div class="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <!-- Chapter Header Row -->
          <div class="p-4 sm:p-5 bg-card/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70">
            <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onclick={() => toggleChapter(chapter.id)}
                class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                aria-label="Toggle Chapter"
              >
                {#if isExpanded}
                  <ChevronDown class="w-4 h-4" />
                {:else}
                  <ChevronRight class="w-4 h-4" />
                {/if}
              </button>

              <div class="space-y-0.5 min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-primary">Chapter {index + 1}</span>
                  <h3 class="text-sm sm:text-base font-bold text-foreground truncate">{chapter.title}</h3>
                </div>
                {#if chapter.synopsis}
                  <p class="text-xs text-muted-foreground line-clamp-1">{chapter.synopsis}</p>
                {/if}
              </div>
            </div>

            <!-- Chapter Actions & Counters -->
            <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 text-xs">
              <span class="text-muted-foreground font-mono">{scenes.length} scenes · {chapterWordCount.toLocaleString()} words</span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  onclick={() => openCreateScene(chapter.id)}
                  class="p-1.5 rounded-md hover:bg-muted text-primary transition-colors cursor-pointer"
                  title="Add Scene to Chapter"
                >
                  <Plus class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onclick={() => proseStore.deleteChapter(chapter.id)}
                  class="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                  title="Delete Chapter"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Scenes Grid / List inside Chapter -->
          {#if isExpanded}
            <div class="p-3 sm:p-4 bg-muted/20 space-y-2">
              {#if scenes.length === 0}
                <div class="py-6 text-center text-xs text-muted-foreground">
                  <span>No scenes in this chapter yet.</span>
                  <button
                    type="button"
                    onclick={() => openCreateScene(chapter.id)}
                    class="text-primary font-semibold hover:underline ml-1 cursor-pointer"
                  >
                    + Add first scene
                  </button>
                </div>
              {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {#each scenes as scene, sceneIdx}
                    <div class="p-3.5 bg-card border border-border rounded-lg shadow-2xs hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3">
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[10px] font-mono font-bold text-muted-foreground">Scene #{sceneIdx + 1}</span>
                          <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full {scene.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : scene.status === 'REVISED'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-muted text-muted-foreground border border-border'}">
                            {scene.status}
                          </span>
                        </div>

                        <h4 class="text-xs sm:text-sm font-bold text-foreground line-clamp-1">{scene.title}</h4>
                        {#if scene.synopsis}
                          <p class="text-xs text-muted-foreground line-clamp-2">{scene.synopsis}</p>
                        {/if}
                      </div>

                      <div class="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                        <span class="text-muted-foreground font-mono text-[11px]">{scene.wordCount} / {scene.targetWordCount || 1500}w</span>
                        <div class="flex items-center gap-1">
                          <a
                            href="/novel/editor"
                            onclick={() => proseStore.selectScene(scene.id)}
                            class="p-1 rounded hover:bg-muted text-primary transition-colors"
                            title="Open in Canvas Editor"
                          >
                            <Edit3 class="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onclick={() => proseStore.deleteScene(scene.id)}
                            class="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                            title="Delete Scene"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal: New Chapter Dialog -->
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
        <p class="text-xs text-muted-foreground mt-0.5">Scaffold a new chapter in your outline.</p>
      </div>

      <form onsubmit={handleCreateChapter} class="p-5 overflow-y-auto flex-1 space-y-4">
        <div class="space-y-1.5">
          <label for="ch-title" class="text-xs font-semibold text-foreground">Chapter Title *</label>
          <input
            id="ch-title"
            type="text"
            bind:value={newChapterTitle}
            placeholder="e.g. Chapter 2: Shadows in the Mist"
            required
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none min-h-[40px]"
          />
        </div>

        <div class="space-y-1.5">
          <label for="ch-synopsis" class="text-xs font-semibold text-foreground">Chapter Synopsis / Arc</label>
          <textarea
            id="ch-synopsis"
            bind:value={newChapterSynopsis}
            rows="3"
            placeholder="Brief plot outline for this chapter..."
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none"
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

<!-- Modal: New Scene Dialog -->
{#if isNewSceneModalOpen}
  <div
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    onclick={() => (isNewSceneModalOpen = false)}
    onkeydown={(e) => e.key === 'Escape' && (isNewSceneModalOpen = false)}
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
      aria-label="Create Scene"
      tabindex="-1"
    >
      <div class="p-5 border-b border-border shrink-0">
        <h3 class="text-base font-bold text-foreground">Create New Scene</h3>
        <p class="text-xs text-muted-foreground mt-0.5">Scaffold a new scene beat in this chapter.</p>
      </div>

      <form onsubmit={handleCreateScene} class="p-5 overflow-y-auto flex-1 space-y-4">
        <div class="space-y-1.5">
          <label for="sc-title" class="text-xs font-semibold text-foreground">Scene Title *</label>
          <input
            id="sc-title"
            type="text"
            bind:value={newSceneTitle}
            placeholder="e.g. Discovery of the Ancient Shrine"
            required
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none min-h-[40px]"
          />
        </div>

        <div class="space-y-1.5">
          <label for="sc-target" class="text-xs font-semibold text-foreground">Target Word Count</label>
          <input
            id="sc-target"
            type="number"
            bind:value={newSceneTargetWords}
            min="100"
            step="100"
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none min-h-[40px]"
          />
        </div>

        <div class="space-y-1.5">
          <label for="sc-synopsis" class="text-xs font-semibold text-foreground">Scene Synopsis / Objective</label>
          <textarea
            id="sc-synopsis"
            bind:value={newSceneSynopsis}
            rows="3"
            placeholder="Plot beat description..."
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none"
          ></textarea>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2.5 sticky bottom-0 bg-card">
          <button
            type="button"
            onclick={() => (isNewSceneModalOpen = false)}
            class="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-muted transition-colors min-h-[38px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newSceneTitle.trim()}
            class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 min-h-[38px] cursor-pointer"
          >
            Create Scene
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
