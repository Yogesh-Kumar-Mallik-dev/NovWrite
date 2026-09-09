<script lang="ts">
  import {
    Edit3,
    BookOpen,
    Plus,
    Maximize2,
    Minimize2,
    Check,
    Clock,
    FileText,
    Users,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Save,
    Trash2,
    SlidersHorizontal,
    List,
  } from "lucide-svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { proseStore, type SceneStatus } from "$lib/stores/proseStore.svelte";
  import { worldStore } from "$lib/stores/worldStore.svelte";

  let isSidebarOpen = $state(true);
  let isFocusMode = $state(false);
  let isNewSceneModalOpen = $state(false);
  let isSceneSettingsOpen = $state(false);
  let newSceneTitle = $state("");
  let newSceneSynopsis = $state("");
  let newSceneTargetWords = $state(1500);
  let selectedChapterIdForNewScene = $state("");
  let autoSaveMessage = $state("All changes saved");
  let saveTimer: any = null;

  const project = $derived(projectStore.activeProject);
  const activeScene = $derived(proseStore.activeScene);
  const activeChapter = $derived(proseStore.activeChapter);
  const chapters = $derived(proseStore.sortedChapters);
  const entities = $derived(worldStore.entities);

  let proseText = $state("");

  // Sync editor content when active scene changes
  $effect(() => {
    if (activeScene) {
      proseText = activeScene.proseContent || "";
    } else {
      proseText = "";
    }
  });

  const wordCount = $derived.by(() => {
    if (!proseText.trim()) return 0;
    return proseText.trim().split(/\s+/).filter(Boolean).length;
  });

  const charCount = $derived(proseText.length);
  const readingTimeMin = $derived(Math.max(1, Math.ceil(wordCount / 200)));
  const targetWords = $derived(activeScene?.targetWordCount || 1500);
  const progressPercent = $derived(Math.min(100, Math.round((wordCount / targetWords) * 100)));

  function handleContentChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    proseText = target.value;
    autoSaveMessage = "Saving changes...";

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (activeScene) {
        proseStore.updateSceneContent(activeScene.id, proseText);
        const now = new Date();
        autoSaveMessage = `Saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }
    }, 400);
  }

  function handleCreateScene(e: Event) {
    e.preventDefault();
    if (!newSceneTitle.trim() || !selectedChapterIdForNewScene) return;
    const newScene = proseStore.createScene({
      chapterId: selectedChapterIdForNewScene,
      title: newSceneTitle.trim(),
      synopsis: newSceneSynopsis.trim() || undefined,
      targetWordCount: newSceneTargetWords || 1500,
    });
    newSceneTitle = "";
    newSceneSynopsis = "";
    isNewSceneModalOpen = false;
    proseStore.selectScene(newScene.id);
  }

  function handleStatusChange(status: SceneStatus) {
    if (activeScene) {
      proseStore.updateScene(activeScene.id, { status });
    }
  }

  function openCreateSceneModal(chapterId?: string) {
    selectedChapterIdForNewScene = chapterId || chapters[0]?.id || "";
    isNewSceneModalOpen = true;
  }
</script>

<svelte:head>
  <title>{activeScene ? `${activeScene.title} - Canvas Editor` : "Canvas Editor"} | NovWrite</title>
</svelte:head>

<div class="flex-1 flex flex-col h-[calc(100dvh-3.5rem)] overflow-hidden bg-background text-foreground min-w-0">
  <!-- Top Editor Utility Strip -->
  <div class="h-11 border-b border-border bg-card/80 px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 backdrop-blur z-10 text-xs">
    <!-- Left: Drawer Toggle & Scene Info -->
    <div class="flex items-center gap-2 min-w-0">
      <button
        type="button"
        onclick={() => (isSidebarOpen = !isSidebarOpen)}
        class="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        title="Toggle Scene Navigation"
        aria-label="Toggle Scene Sidebar"
      >
        <List class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-1.5 min-w-0">
        <span class="text-muted-foreground hidden sm:inline truncate">
          {activeChapter?.title || "No Chapter"} /
        </span>
        <span class="font-bold text-foreground truncate">
          {activeScene?.title || "Select or create a scene"}
        </span>
      </div>
    </div>

    <!-- Right: Telemetry & Controls -->
    <div class="flex items-center gap-2 sm:gap-4 shrink-0">
      <div class="hidden md:flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
        <span>{wordCount.toLocaleString()} words</span>
        <span>·</span>
        <span>{charCount.toLocaleString()} chars</span>
        <span>·</span>
        <span>{readingTimeMin} min read</span>
      </div>

      <span class="text-[11px] text-muted-foreground hidden lg:inline">
        {autoSaveMessage}
      </span>

      <!-- Status Selector -->
      {#if activeScene}
        <select
          value={activeScene.status}
          onchange={(e) => handleStatusChange((e.target as HTMLSelectElement).value as SceneStatus)}
          class="px-2 py-1 rounded bg-secondary border border-border text-[11px] font-semibold text-secondary-foreground cursor-pointer"
        >
          <option value="DRAFT">Draft</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVISED">Revised</option>
          <option value="COMPLETED">Completed</option>
        </select>
      {/if}

      <!-- Focus Mode Toggle -->
      <button
        type="button"
        onclick={() => (isFocusMode = !isFocusMode)}
        class="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
        aria-label="Toggle Focus Mode"
      >
        {#if isFocusMode}
          <Minimize2 class="w-4 h-4 text-primary" />
        {:else}
          <Maximize2 class="w-4 h-4" />
        {/if}
      </button>
    </div>
  </div>

  <!-- Main Split Editor Workspace -->
  <div class="flex-1 flex overflow-hidden relative min-w-0">
    <!-- Left Sidebar: Chapter & Scene Tree (Collapsible on mobile and desktop) -->
    {#if isSidebarOpen && !isFocusMode}
      <aside class="w-64 sm:w-72 bg-card border-r border-border flex flex-col shrink-0 h-full overflow-hidden absolute md:static z-20 shadow-xl md:shadow-none">
        <div class="p-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
          <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manuscript Scenes</span>
          <button
            type="button"
            onclick={() => openCreateSceneModal()}
            class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Scene</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-3 min-h-0 [scrollbar-width:thin]">
          {#if chapters.length === 0}
            <div class="p-4 text-center text-muted-foreground text-xs space-y-2">
              <p>No chapters or scenes yet.</p>
              <a href="/novel" class="text-primary font-semibold hover:underline block">Create Chapter</a>
            </div>
          {:else}
            {#each chapters as chapter}
              {@const chapterScenes = proseStore.getScenesForChapter(chapter.id)}
              <div class="space-y-1">
                <div class="px-2 py-1 flex items-center justify-between text-xs font-semibold text-foreground bg-muted/40 rounded">
                  <span class="truncate">{chapter.title}</span>
                  <button
                    type="button"
                    onclick={() => openCreateSceneModal(chapter.id)}
                    class="p-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Add scene to chapter"
                  >
                    <Plus class="w-3.5 h-3.5" />
                  </button>
                </div>

                {#if chapterScenes.length === 0}
                  <div class="px-3 py-1.5 text-[11px] text-muted-foreground italic">No scenes</div>
                {:else}
                  <div class="space-y-0.5 pl-2 border-l border-border/60 ml-2">
                    {#each chapterScenes as scene}
                      <button
                        type="button"
                        onclick={() => {
                          proseStore.selectScene(scene.id);
                          if (window.innerWidth < 768) isSidebarOpen = false;
                        }}
                        class="w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between gap-2 {activeScene?.id === scene.id
                          ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
                      >
                        <span class="truncate">{scene.title}</span>
                        <span class="text-[10px] font-mono opacity-70 shrink-0">{scene.wordCount}w</span>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </aside>
    {/if}

    <!-- Center Canvas: Distraction-Free Prose Area -->
    <main class="flex-1 flex flex-col h-full overflow-y-auto bg-background min-w-0 p-4 sm:p-8 lg:p-12 relative">
      {#if !activeScene}
        <div class="flex-1 flex items-center justify-center text-center p-6">
          <div class="max-w-md space-y-3">
            <Edit3 class="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <h2 class="text-base sm:text-lg font-bold">No Scene Selected</h2>
            <p class="text-xs sm:text-sm text-muted-foreground">
              Select a scene from the left navigation tree or create a new scene to start drafting prose.
            </p>
            {#if chapters.length > 0}
              <button
                type="button"
                onclick={() => openCreateSceneModal()}
                class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus class="w-4 h-4" />
                <span>Create New Scene</span>
              </button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="max-w-3xl w-full mx-auto flex-1 flex flex-col space-y-4">
          <!-- Scene Title & Target Progress -->
          <div class="space-y-2 pb-2 border-b border-border/40">
            <input
              type="text"
              value={activeScene.title}
              oninput={(e) => proseStore.updateScene(activeScene.id, { title: (e.target as HTMLInputElement).value })}
              placeholder="Scene Title..."
              class="w-full text-xl sm:text-2xl font-bold bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/50 tracking-tight"
            />

            <!-- Progress Bar -->
            <div class="flex items-center gap-3 text-xs text-muted-foreground">
              <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary transition-all duration-300 rounded-full"
                  style="width: {progressPercent}%"
                ></div>
              </div>
              <span class="font-mono text-[11px] shrink-0">{wordCount} / {targetWords} words ({progressPercent}%)</span>
            </div>
          </div>

          <!-- Distraction-Free Prose Textarea -->
          <textarea
            value={proseText}
            oninput={handleContentChange}
            placeholder="Begin drafting your scene prose here... Write freely and let your story unfold."
            class="w-full flex-1 min-h-[400px] bg-transparent border-none resize-none focus:outline-none text-foreground text-sm sm:text-base leading-relaxed font-serif tracking-wide placeholder:text-muted-foreground/40 placeholder:font-sans"
            spellcheck="true"
          ></textarea>
        </div>
      {/if}
    </main>
  </div>
</div>

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
        <p class="text-xs text-muted-foreground mt-0.5">Scaffold a new scene beat in your novel.</p>
      </div>

      <form onsubmit={handleCreateScene} class="p-5 overflow-y-auto flex-1 space-y-4">
        <div class="space-y-1.5">
          <label for="scene-chapter" class="text-xs font-semibold text-foreground">Target Chapter *</label>
          <select
            id="scene-chapter"
            bind:value={selectedChapterIdForNewScene}
            required
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none min-h-[40px]"
          >
            {#each chapters as ch}
              <option value={ch.id}>{ch.title}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1.5">
          <label for="scene-title" class="text-xs font-semibold text-foreground">Scene Title *</label>
          <input
            id="scene-title"
            type="text"
            bind:value={newSceneTitle}
            placeholder="e.g. Confrontation at Dawn"
            required
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none min-h-[40px]"
          />
        </div>

        <div class="space-y-1.5">
          <label for="scene-target" class="text-xs font-semibold text-foreground">Target Word Count</label>
          <input
            id="scene-target"
            type="number"
            bind:value={newSceneTargetWords}
            min="100"
            step="100"
            class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none min-h-[40px]"
          />
        </div>

        <div class="space-y-1.5">
          <label for="scene-synopsis" class="text-xs font-semibold text-foreground">Scene Synopsis / Objective</label>
          <textarea
            id="scene-synopsis"
            bind:value={newSceneSynopsis}
            rows="3"
            placeholder="What happens in this scene? Key plot beats or character transformations..."
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
            disabled={!newSceneTitle.trim() || !selectedChapterIdForNewScene}
            class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 min-h-[38px] cursor-pointer"
          >
            Create Scene
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
