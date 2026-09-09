<script lang="ts">
  import {
    BarChart3,
    BookOpen,
    Target,
    Clock,
    Flame,
    TrendingUp,
    FileText,
    CheckCircle2,
  } from "lucide-svelte";
  import { projectStore } from "$lib/stores/projectStore.svelte";
  import { proseStore } from "$lib/stores/proseStore.svelte";

  const project = $derived(projectStore.activeProject);
  const totalWords = $derived(proseStore.totalWordCount);
  const totalChapters = $derived(proseStore.totalChaptersCount);
  const totalScenes = $derived(proseStore.totalScenesCount);
  const todayWords = $derived(proseStore.todayWordsWritten);
  const dailyGoal = $derived(proseStore.dailyWordGoal);
  const goalProgress = $derived(Math.min(100, Math.round((todayWords / dailyGoal) * 100)));
  const avgSceneWords = $derived(totalScenes > 0 ? Math.round(totalWords / totalScenes) : 0);
  const readingTimeHours = $derived((totalWords / (200 * 60)).toFixed(1));
  const chapters = $derived(proseStore.sortedChapters);

  let editingGoal = $state(false);
  let goalInput = $state(1000);

  function startEditingGoal() {
    goalInput = proseStore.dailyWordGoal;
    editingGoal = true;
  }

  function saveGoal() {
    proseStore.setDailyGoal(goalInput);
    editingGoal = false;
  }
</script>

<svelte:head>
  <title>Writing Telemetry & Stats | NovWrite</title>
</svelte:head>

<div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
    <div class="space-y-1 min-w-0">
      <div class="flex items-center gap-2">
        <BarChart3 class="w-5 h-5 text-primary shrink-0" />
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
          Writing Telemetry & Analytics
        </h1>
      </div>
      <p class="text-xs sm:text-sm text-muted-foreground">
        Live productivity telemetry, chapter word distributions, and pacing velocity.
      </p>
    </div>
  </div>

  <!-- Key Telemetry Metrics Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="p-5 bg-card border border-border rounded-xl shadow-xs space-y-2">
      <div class="flex items-center justify-between text-muted-foreground">
        <span class="text-xs uppercase font-bold tracking-wider">Total Manuscript Words</span>
        <FileText class="w-4 h-4 text-primary" />
      </div>
      <div class="text-2xl sm:text-3xl font-bold text-foreground">{totalWords.toLocaleString()}</div>
      <p class="text-xs text-muted-foreground">{totalChapters} chapters · {totalScenes} scenes</p>
    </div>

    <div class="p-5 bg-card border border-border rounded-xl shadow-xs space-y-2">
      <div class="flex items-center justify-between text-muted-foreground">
        <span class="text-xs uppercase font-bold tracking-wider">Today's Output</span>
        <Flame class="w-4 h-4 text-amber-500" />
      </div>
      <div class="text-2xl sm:text-3xl font-bold text-foreground">{todayWords.toLocaleString()}</div>
      <p class="text-xs text-muted-foreground">Goal: {dailyGoal.toLocaleString()} words ({goalProgress}%)</p>
    </div>

    <div class="p-5 bg-card border border-border rounded-xl shadow-xs space-y-2">
      <div class="flex items-center justify-between text-muted-foreground">
        <span class="text-xs uppercase font-bold tracking-wider">Avg Scene Density</span>
        <TrendingUp class="w-4 h-4 text-emerald-500" />
      </div>
      <div class="text-2xl sm:text-3xl font-bold text-foreground">{avgSceneWords.toLocaleString()}</div>
      <p class="text-xs text-muted-foreground">words per scene average</p>
    </div>

    <div class="p-5 bg-card border border-border rounded-xl shadow-xs space-y-2">
      <div class="flex items-center justify-between text-muted-foreground">
        <span class="text-xs uppercase font-bold tracking-wider">Reading Duration</span>
        <Clock class="w-4 h-4 text-blue-500" />
      </div>
      <div class="text-2xl sm:text-3xl font-bold text-foreground">{readingTimeHours} hrs</div>
      <p class="text-xs text-muted-foreground">at standard 200 wpm reading speed</p>
    </div>
  </div>

  <!-- Daily Target Progress Card -->
  <div class="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <Target class="w-5 h-5 text-primary shrink-0" />
        <h2 class="text-base sm:text-lg font-bold">Daily Writing Target</h2>
      </div>

      {#if !editingGoal}
        <button
          type="button"
          onclick={startEditingGoal}
          class="text-xs text-primary font-semibold hover:underline cursor-pointer"
        >
          Change Daily Goal ({dailyGoal} words)
        </button>
      {:else}
        <div class="flex items-center gap-2">
          <input
            type="number"
            bind:value={goalInput}
            min="100"
            step="100"
            class="px-2.5 py-1 text-xs rounded border border-input bg-background w-28"
          />
          <button
            type="button"
            onclick={saveGoal}
            class="px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onclick={() => (editingGoal = false)}
            class="px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-xs hover:bg-muted cursor-pointer"
          >
            Cancel
          </button>
        </div>
      {/if}
    </div>

    <div class="space-y-2">
      <div class="h-3 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full bg-primary transition-all duration-500 rounded-full"
          style="width: {goalProgress}%"
        ></div>
      </div>
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{todayWords.toLocaleString()} words completed today</span>
        <span>{goalProgress}% of {dailyGoal.toLocaleString()} word goal</span>
      </div>
    </div>
  </div>

  <!-- Chapter Word Distribution Table & Visual Breakdown -->
  <div class="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2.5">
        <BookOpen class="w-5 h-5 text-primary shrink-0" />
        <h2 class="text-base sm:text-lg font-bold">Chapter Word Distribution</h2>
      </div>
      <span class="text-xs text-muted-foreground">{chapters.length} chapters total</span>
    </div>

    {#if chapters.length === 0}
      <div class="py-8 text-center text-xs text-muted-foreground">
        No chapter data available. Create chapters in your manuscript to view distribution charts.
      </div>
    {:else}
      <div class="space-y-3">
        {#each chapters as chapter, idx}
          {@const scenes = proseStore.getScenesForChapter(chapter.id)}
          {@const chapterWords = scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0)}
          {@const percentOfTotal = totalWords > 0 ? Math.round((chapterWords / totalWords) * 100) : 0}

          <div class="p-3.5 bg-muted/20 border border-border rounded-lg space-y-2">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div class="flex items-center gap-2 font-medium">
                <span class="font-mono text-primary font-bold">Ch. {idx + 1}</span>
                <span class="text-foreground truncate">{chapter.title}</span>
              </div>
              <div class="flex items-center gap-3 text-muted-foreground font-mono">
                <span>{scenes.length} scene{scenes.length === 1 ? '' : 's'}</span>
                <span>{chapterWords.toLocaleString()} words ({percentOfTotal}%)</span>
              </div>
            </div>

            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-primary/70 transition-all rounded-full"
                style="width: {percentOfTotal}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
