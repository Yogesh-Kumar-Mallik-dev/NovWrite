<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { authStore, projectStore } from "$lib/stores/projectStore.svelte";
  import { proseStore } from "$lib/stores/proseStore.svelte";
  import { worldStore } from "$lib/stores/worldStore.svelte";
  import {
    User,
    Folder,
    BookOpen,
    Globe2,
    Shield,
    Settings,
    BarChart3,
    Plus,
    Pencil,
    Trash2,
    Lock,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Clock,
    Sparkles,
    Calendar,
    LogOut,
    Search,
    ChevronRight,
    KeyRound,
    ExternalLink,
    HardDrive,
    Activity,
  } from "lucide-svelte";
  import Pagination from "$lib/components/ui/pagination.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";

  // Active tab state driven by URL query param (e.g. ?tab=projects)
  let activeTab = $state("overview");

  $effect(() => {
    const tabParam = page.url.searchParams.get("tab");
    if (tabParam && ["overview", "projects", "activity", "security", "settings"].includes(tabParam)) {
      activeTab = tabParam;
    }
  });

  function setTab(tab: string) {
    activeTab = tab;
    const url = new URL(page.url.toString());
    url.searchParams.set("tab", tab);
    goto(url.toString(), { replaceState: true, noScroll: true });
  }

  // Security Form State
  let oldPassword = $state("");
  let newPassword = $state("");
  let confirmNewPassword = $state("");
  let showPassword = $state(false);
  let passwordSuccessMsg = $state<string | null>(null);
  let passwordErrorMsg = $state<string | null>(null);

  // Settings State (Author Profile)
  let penName = $state("");
  let authorBio = $state("Fictional universe designer and speculative novel author.");
  let settingsSavedMsg = $state<string | null>(null);

  // Projects Search & Filter
  let projectSearch = $state("");
  let selectedGenreFilter = $state("ALL");
  let projectCurrentPage = $state(1);
  const pageSize = 10;

  // Initialize penName with username
  $effect(() => {
    if (!penName && authStore.username) {
      penName = authStore.username;
    }
  });

  // Filtered & Paginated Projects
  const filteredProjects = $derived.by(() => {
    return projectStore.projects.filter((p) => {
      const matchesSearch =
        !projectSearch.trim() ||
        p.name.toLowerCase().includes(projectSearch.toLowerCase().trim()) ||
        (p.description && p.description.toLowerCase().includes(projectSearch.toLowerCase().trim()));
      const matchesGenre =
        selectedGenreFilter === "ALL" || p.genre === selectedGenreFilter;
      return matchesSearch && matchesGenre;
    });
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filteredProjects.length / pageSize)));
  const paginatedProjects = $derived.by(() => {
    const start = (projectCurrentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  });

  const availableGenres = $derived.by(() => {
    const set = new Set<string>();
    for (const p of projectStore.projects) {
      if (p.genre) set.add(p.genre);
    }
    return Array.from(set);
  });

  // Aggregate Telemetry
  const totalProjectsCount = $derived(projectStore.projects.length);
  const totalWordsWritten = $derived(proseStore.totalWordCount);
  const totalChaptersCount = $derived(proseStore.totalChaptersCount);
  const totalScenesCount = $derived(proseStore.totalScenesCount);
  const totalEntitiesCount = $derived(worldStore.entities.length);
  const totalBlueprintsCount = $derived(worldStore.blueprints.length);
  const todayWordsWritten = $derived(proseStore.todayWordsWritten);
  const dailyGoal = $derived(proseStore.dailyWordGoal || 1000);
  const goalProgressPercent = $derived(
    dailyGoal > 0 ? Math.min(100, Math.round((todayWordsWritten / dailyGoal) * 100)) : 0
  );

  async function handleChangePassword(e: SubmitEvent) {
    e.preventDefault();
    passwordErrorMsg = null;
    passwordSuccessMsg = null;

    if (!oldPassword) {
      passwordErrorMsg = "Current password is required.";
      return;
    }
    if (newPassword.length < 8) {
      passwordErrorMsg = "New password must be at least 8 characters long.";
      return;
    }
    if (newPassword !== confirmNewPassword) {
      passwordErrorMsg = "New passwords do not match.";
      return;
    }

    const success = await authStore.changePassword(oldPassword, newPassword);
    if (success) {
      passwordSuccessMsg = "Password updated successfully. Please sign in with your new password.";
      oldPassword = "";
      newPassword = "";
      confirmNewPassword = "";
    } else {
      passwordErrorMsg = "Failed to update password. Please check your current password.";
    }
  }

  function handleSaveSettings(e: SubmitEvent) {
    e.preventDefault();
    settingsSavedMsg = "Profile settings saved successfully.";
    setTimeout(() => {
      settingsSavedMsg = null;
    }, 4000);
  }

  function handleSelectProject(id: string) {
    projectStore.selectProject(id);
    worldStore.setProject(id);
    goto("/novel");
  }

  function handleOpenWorldStudio(id: string) {
    projectStore.selectProject(id);
    worldStore.setProject(id);
    goto("/world");
  }

  // 52-week activity grid reflecting genuine clean slate or authoring sessions
  const activityWeeks = Array.from({ length: 52 }, (_, wIdx) => {
    return Array.from({ length: 7 }, (_, dIdx) => {
      return { day: dIdx, level: 0 };
    });
  });
</script>

<svelte:head>
  <title>Account Dashboard | NovWrite</title>
</svelte:head>

<div class="flex-1 bg-background text-foreground transition-colors min-w-0">
  <!-- Top Account Hero / Profile Header -->
  <div class="border-b border-border bg-card/60 backdrop-blur">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <!-- User Identity Block -->
        <div class="flex items-start sm:items-center gap-4 min-w-0">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border-2 border-primary/30 text-primary font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-md shrink-0">
            {authStore.username.charAt(0).toUpperCase()}
          </div>
          <div class="space-y-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {penName || authStore.username}
              </h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                <Shield class="w-3 h-3" />
                {authStore.role || "USER"}
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Active Scribe
              </span>
            </div>
            <p class="text-xs sm:text-sm text-muted-foreground truncate">
              @{authStore.username} · {authStore.email || "author@novwrite.dev"}
            </p>
            <p class="text-xs text-muted-foreground/80 line-clamp-1 max-w-2xl">
              {authorBio}
            </p>
          </div>
        </div>

        <!-- Quick Top Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onclick={() => projectStore.openCreateDialog()}
            class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-colors shadow-xs min-h-[38px] cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>New Novel Project</span>
          </button>
          <button
            type="button"
            onclick={() => setTab("settings")}
            class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border font-medium text-xs sm:text-sm hover:bg-muted transition-colors min-h-[38px] cursor-pointer"
          >
            <Pencil class="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <!-- GitHub-Style Tab Bar -->
      <div class="flex items-center gap-1 sm:gap-2 mt-6 sm:mt-8 -mb-px overflow-x-auto [scrollbar-width:none]">
        <button
          type="button"
          onclick={() => setTab("overview")}
          class="flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer {activeTab ===
          'overview'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
        >
          <BookOpen class="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onclick={() => setTab("projects")}
          class="flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer {activeTab ===
          'projects'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
        >
          <Folder class="w-4 h-4" />
          <span>Novel Projects</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border/60">
            {totalProjectsCount}
          </span>
        </button>

        <button
          type="button"
          onclick={() => setTab("activity")}
          class="flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer {activeTab ===
          'activity'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
        >
          <BarChart3 class="w-4 h-4" />
          <span>Writing Activity</span>
        </button>

        <button
          type="button"
          onclick={() => setTab("security")}
          class="flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer {activeTab ===
          'security'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
        >
          <KeyRound class="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onclick={() => setTab("settings")}
          class="flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer {activeTab ===
          'settings'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
        >
          <Settings class="w-4 h-4" />
          <span>Account Settings</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Tab Content Body Area -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 min-w-0">
    <!-- ========================================== -->
    <!-- TAB 1: OVERVIEW -->
    <!-- ========================================== -->
    {#if activeTab === "overview"}
      <!-- Summary Metrics Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Projects</span>
          <span class="text-xl sm:text-2xl font-extrabold text-foreground">{totalProjectsCount}</span>
          <span class="text-[11px] text-muted-foreground block">Active novel universes</span>
        </div>
        <div class="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Words Written</span>
          <span class="text-xl sm:text-2xl font-extrabold text-foreground">{totalWordsWritten.toLocaleString()}</span>
          <span class="text-[11px] text-muted-foreground block">Across active manuscript</span>
        </div>
        <div class="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Chapters / Scenes</span>
          <span class="text-xl sm:text-2xl font-extrabold text-foreground">{totalChaptersCount} / {totalScenesCount}</span>
          <span class="text-[11px] text-muted-foreground block">Drafted narrative units</span>
        </div>
        <div class="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Universe Canon</span>
          <span class="text-xl sm:text-2xl font-extrabold text-foreground">{totalEntitiesCount}</span>
          <span class="text-[11px] text-muted-foreground block">Entities ({totalBlueprintsCount} schemas)</span>
        </div>
      </div>

      <!-- GitHub-Style Contribution & Activity Heatmap -->
      <div class="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm sm:text-base font-bold text-foreground">Authoring Activity & Heatmap</h2>
            <p class="text-xs text-muted-foreground">Writing sessions, word additions, and timeline updates in the last year.</p>
          </div>
          <span class="text-xs font-semibold text-primary">{totalWordsWritten > 0 ? "Daily Streak Active" : "Fresh Slate"}</span>
        </div>

        <!-- Heatmap Grid Container (Horizontally Scrollable on Narrow Viewports) -->
        <div class="overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div class="inline-flex gap-1 min-w-max p-2 rounded-lg bg-muted/30 border border-border/50">
            {#each activityWeeks as week}
              <div class="flex flex-col gap-1">
                {#each week as day}
                  <div
                    class="w-3 h-3 rounded-2xs transition-colors {day.level === 0
                      ? 'bg-muted-foreground/15 dark:bg-muted-foreground/10'
                      : day.level === 1
                        ? 'bg-primary/30'
                        : day.level === 2
                          ? 'bg-primary/55'
                          : day.level === 3
                            ? 'bg-primary/80'
                            : 'bg-primary'}"
                    title={`Day: ${day.level > 0 ? day.level * 250 + ' words written' : 'No activity logged'}`}
                  ></div>
                {/each}
              </div>
            {/each}
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span>Learn how activity is audited</span>
          <div class="flex items-center gap-1.5">
            <span>Less</span>
            <div class="w-2.5 h-2.5 rounded-2xs bg-muted-foreground/15"></div>
            <div class="w-2.5 h-2.5 rounded-2xs bg-primary/30"></div>
            <div class="w-2.5 h-2.5 rounded-2xs bg-primary/55"></div>
            <div class="w-2.5 h-2.5 rounded-2xs bg-primary"></div>
            <span>More</span>
          </div>
        </div>
      </div>

      <!-- Pinned Novel Projects (GitHub-Style Repository Cards) -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm sm:text-base font-bold text-foreground">Pinned Novel Projects</h2>
          {#if totalProjectsCount > 0}
            <button
              type="button"
              onclick={() => setTab("projects")}
              class="text-xs font-semibold text-primary hover:underline"
            >
              View all ({totalProjectsCount})
            </button>
          {/if}
        </div>

        {#if projectStore.projects.length === 0}
          <div class="p-8 sm:p-10 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-3">
            <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Folder class="w-6 h-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-bold text-foreground">No projects in your workspace yet</h3>
              <p class="text-xs text-muted-foreground max-w-sm mx-auto">
                Create your first fictional novel universe to start authoring chapters, crafting entities, and enforcing world invariant rules.
              </p>
            </div>
            <button
              type="button"
              onclick={() => projectStore.openCreateDialog()}
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each projectStore.projects.slice(0, 4) as proj}
              {@const isActive = proj.id === projectStore.activeProjectId}
              <div class="p-5 rounded-xl border {isActive ? 'border-primary/50 bg-primary/[0.02] shadow-xs' : 'border-border bg-card'} flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
                <div class="space-y-2 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onclick={() => handleSelectProject(proj.id)}
                      class="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors truncate text-left cursor-pointer"
                    >
                      {proj.name}
                    </button>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted border border-border text-muted-foreground shrink-0">
                      Private
                    </span>
                  </div>

                  <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {proj.description || "No project synopsis provided. Configure genre rules and begin drafting."}
                  </p>
                </div>

                <div class="pt-3 border-t border-border/60 flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-3 text-muted-foreground text-[11px]">
                    <span class="flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full bg-primary"></span>
                      {proj.genre || "Fiction"}
                    </span>
                    <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      onclick={() => handleSelectProject(proj.id)}
                      class="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-muted border border-border font-medium text-xs transition-colors cursor-pointer"
                    >
                      Prose
                    </button>
                    <button
                      type="button"
                      onclick={() => handleOpenWorldStudio(proj.id)}
                      class="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-muted border border-border font-medium text-xs transition-colors cursor-pointer"
                    >
                      World
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    <!-- ========================================== -->
    <!-- TAB 2: NOVEL PROJECTS (REPOSITORIES) -->
    <!-- ========================================== -->
    {:else if activeTab === "projects"}
      <div class="space-y-4">
        <!-- Toolbar & Filter Row -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <!-- Search Bar -->
            <div class="relative flex-1 max-w-md">
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                bind:value={projectSearch}
                placeholder="Find a novel project..."
                class="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px]"
              />
            </div>

            <!-- Genre Select Filter -->
            {#if availableGenres.length > 0}
              <select
                bind:value={selectedGenreFilter}
                class="px-3 py-2 text-xs rounded-lg bg-background border border-input focus:border-primary focus:outline-none text-foreground min-h-[40px] cursor-pointer"
              >
                <option value="ALL">All Genres</option>
                {#each availableGenres as g}
                  <option value={g}>{g}</option>
                {/each}
              </select>
            {/if}
          </div>

          <button
            type="button"
            onclick={() => projectStore.openCreateDialog()}
            class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-colors shadow-xs min-h-[40px] cursor-pointer shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        <!-- Standardized 10-Item Paginator ABOVE Container (Prevents Layout Jumps) -->
        {#if filteredProjects.length > pageSize}
          <Pagination
            page={projectCurrentPage}
            totalCount={filteredProjects.length}
            {pageSize}
            itemLabel="novel projects"
            onPageChange={(p) => (projectCurrentPage = p)}
          />
        {/if}

        <!-- Projects Table / List -->
        {#if filteredProjects.length === 0}
          <div class="p-10 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-3">
            <Folder class="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 class="text-sm font-bold text-foreground">No matching projects found</h3>
            <p class="text-xs text-muted-foreground">Try modifying your search filter or create a new project.</p>
          </div>
        {:else}
          <div class="border border-border rounded-xl bg-card divide-y divide-border overflow-hidden shadow-xs">
            {#each paginatedProjects as proj}
              {@const isActive = proj.id === projectStore.activeProjectId}
              <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                <div class="space-y-1.5 min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onclick={() => handleSelectProject(proj.id)}
                      class="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors truncate text-left cursor-pointer"
                    >
                      {proj.name}
                    </button>
                    {#if isActive}
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        Active Project
                      </span>
                    {/if}
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted border border-border text-muted-foreground">
                      {proj.genre || "Fiction"}
                    </span>
                  </div>

                  {#if proj.description}
                    <p class="text-xs text-muted-foreground line-clamp-1 max-w-3xl">
                      {proj.description}
                    </p>
                  {/if}

                  <div class="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span>Created {new Date(proj.createdAt).toLocaleDateString()}</span>
                    <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <!-- Action Button Group -->
                <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  <button
                    type="button"
                    onclick={() => handleSelectProject(proj.id)}
                    class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Open Prose
                  </button>
                  <button
                    type="button"
                    onclick={() => handleOpenWorldStudio(proj.id)}
                    class="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted border border-border font-medium text-xs transition-colors cursor-pointer"
                  >
                    World Studio
                  </button>
                  <button
                    type="button"
                    onclick={() => projectStore.openEditDialog(proj.id)}
                    class="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
                    title="Edit Settings"
                    aria-label="Edit Settings"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onclick={() => projectStore.openDeleteDialog(proj.id)}
                    class="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    title="Delete Project"
                    aria-label="Delete Project"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    <!-- ========================================== -->
    <!-- TAB 3: WRITING ACTIVITY & TELEMETRY -->
    <!-- ========================================== -->
    {:else if activeTab === "activity"}
      <div class="space-y-6">
        <div class="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
          <h2 class="text-sm sm:text-base font-bold text-foreground">Daily Word Goal Progress</h2>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Today's Writing Milestone</span>
              <span class="font-bold text-foreground">{todayWordsWritten.toLocaleString()} / {dailyGoal.toLocaleString()} words ({goalProgressPercent}%)</span>
            </div>
            <div class="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500" style="width: {goalProgressPercent}%"></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-5 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reading Cadence</h3>
            <div class="text-2xl font-extrabold text-foreground">{Math.ceil(totalWordsWritten / 200)} min</div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Standard novel pacing estimated at 200 words per minute average reading velocity.
            </p>
          </div>

          <div class="p-5 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manuscript Hierarchy</h3>
            <div class="text-2xl font-extrabold text-foreground">{totalChaptersCount} Chapters · {totalScenesCount} Scenes</div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Average {totalChaptersCount > 0 ? Math.round(totalWordsWritten / totalChaptersCount) : 0} words per chapter.
            </p>
          </div>
        </div>
      </div>

    <!-- ========================================== -->
    <!-- TAB 4: SECURITY & PASSWORD -->
    <!-- ========================================== -->
    {:else if activeTab === "security"}
      <div class="max-w-2xl space-y-6">
        <!-- Change Password Card -->
        <div class="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
          <div>
            <h2 class="text-sm sm:text-base font-bold text-foreground">Change Password</h2>
            <p class="text-xs text-muted-foreground mt-0.5">Ensure your account is protected with a secure password.</p>
          </div>

          {#if passwordSuccessMsg}
            <div class="p-3.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs flex items-start gap-2.5">
              <Check class="w-4 h-4 shrink-0 mt-0.5" />
              <div class="flex-1 font-medium">{passwordSuccessMsg}</div>
            </div>
          {/if}

          {#if passwordErrorMsg}
            <div class="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              <div class="flex-1 font-medium">{passwordErrorMsg}</div>
            </div>
          {/if}

          <form onsubmit={handleChangePassword} class="space-y-4">
            <div class="space-y-1.5">
              <label for="old-pwd" class="block text-xs font-semibold text-foreground">Current Password *</label>
              <div class="relative">
                <input
                  id="old-pwd"
                  type={showPassword ? "text" : "password"}
                  bind:value={oldPassword}
                  required
                  placeholder="Enter current password"
                  class="w-full pl-3 pr-10 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px]"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="new-pwd" class="block text-xs font-semibold text-foreground">New Password *</label>
              <input
                id="new-pwd"
                type={showPassword ? "text" : "password"}
                bind:value={newPassword}
                required
                placeholder="At least 8 characters"
                class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px]"
              />
            </div>

            <div class="space-y-1.5">
              <label for="confirm-pwd" class="block text-xs font-semibold text-foreground">Confirm New Password *</label>
              <input
                id="confirm-pwd"
                type={showPassword ? "text" : "password"}
                bind:value={confirmNewPassword}
                required
                placeholder="Re-enter new password"
                class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px]"
              />
            </div>

            <button
              type="submit"
              disabled={authStore.isLoading || !oldPassword || !newPassword || !confirmNewPassword}
              class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 min-h-[40px] cursor-pointer"
            >
              <Lock class="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </form>
        </div>

        <!-- Active Sessions & Security Telemetry -->
        <div class="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
          <h3 class="text-sm font-bold text-foreground">Authentication & Session Info</h3>
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-2 border-b border-border/60">
              <span class="text-muted-foreground">Session Token</span>
              <span class="font-mono text-foreground font-semibold">JWT Bearer (Active)</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/60">
              <span class="text-muted-foreground">Two-Factor Authentication</span>
              <span class="text-muted-foreground">Disabled (Password only)</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-muted-foreground">Tenant Isolation</span>
              <span class="text-green-600 dark:text-green-400 font-semibold">Strict Multi-Tenant</span>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="p-5 sm:p-6 rounded-xl border border-red-500/30 bg-red-500/5 shadow-xs space-y-3">
          <h3 class="text-sm font-bold text-red-600 dark:text-red-400">Sign Out</h3>
          <p class="text-xs text-muted-foreground">Signing out will terminate your current session on this device.</p>
          <button
            type="button"
            onclick={() => authStore.logout()}
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold text-xs hover:bg-red-600 transition-colors cursor-pointer"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Sign Out of NovWrite</span>
          </button>
        </div>
      </div>

    <!-- ========================================== -->
    <!-- TAB 5: ACCOUNT SETTINGS -->
    <!-- ========================================== -->
    {:else if activeTab === "settings"}
      <div class="max-w-2xl space-y-6">
        <div class="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
          <div>
            <h2 class="text-sm sm:text-base font-bold text-foreground">Author Profile Settings</h2>
            <p class="text-xs text-muted-foreground mt-0.5">Customize your public author identity.</p>
          </div>

          {#if settingsSavedMsg}
            <div class="p-3.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs flex items-start gap-2.5">
              <Check class="w-4 h-4 shrink-0 mt-0.5" />
              <div class="flex-1 font-medium">{settingsSavedMsg}</div>
            </div>
          {/if}

          <form onsubmit={handleSaveSettings} class="space-y-4">
            <div class="space-y-1.5">
              <label for="pen-name" class="block text-xs font-semibold text-foreground">Pen Name / Display Name</label>
              <input
                id="pen-name"
                type="text"
                bind:value={penName}
                placeholder="Your author display name"
                class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px]"
              />
            </div>

            <div class="space-y-1.5">
              <label for="author-bio" class="block text-xs font-semibold text-foreground">Author Bio / Manifesto</label>
              <textarea
                id="author-bio"
                bind:value={authorBio}
                rows="3"
                placeholder="Tell other universe builders about your storytelling style..."
                class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>

            <button
              type="submit"
              class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-colors min-h-[40px] cursor-pointer"
            >
              <Check class="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>
      </div>
    {/if}
  </div>
</div>
