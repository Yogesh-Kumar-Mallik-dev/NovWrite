import React, {
  useSyncExternalStore,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { mobileStore } from "../../src/lib/mobileStore.ts";
import { EmptyState } from "../../src/components/EmptyState.tsx";
import type {
  ChapterItem,
  SceneItem,
  SceneStatus,
} from "../../src/lib/types.ts";
import {
  BookOpen,
  Edit3,
  ListTree,
  BarChart3,
  Plus,
  Sparkles,
  Clock,
  Target,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  FileText,
  Flame,
  TrendingUp,
  Trash2,
  Pencil,
  List,
  SlidersHorizontal,
} from "lucide-react-native";

type ProseSubTab = "OVERVIEW" | "EDITOR" | "OUTLINE" | "STATS";

export default function NovelScreen() {
  const router = useRouter();
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState(),
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [activeTab, setActiveTab] = useState<ProseSubTab>("OVERVIEW");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<
    Record<string, boolean>
  >({});

  // Chapter Modals & State
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterTitleInput, setChapterTitleInput] = useState("");
  const [chapterSynopsisInput, setChapterSynopsisInput] = useState("");
  const [chapterToDelete, setChapterToDelete] = useState<{
    id: string;
    title: string;
    sceneCount: number;
  } | null>(null);

  // Scene Modals & State
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [targetChapterIdForScene, setTargetChapterIdForScene] =
    useState<string>("");
  const [sceneTitleInput, setSceneTitleInput] = useState("");
  const [sceneTargetWordsInput, setSceneTargetWordsInput] = useState("1500");
  const [sceneSynopsisInput, setSceneSynopsisInput] = useState("");
  const [sceneStatusInput, setSceneStatusInput] =
    useState<SceneStatus>("DRAFT");
  const [sceneToDelete, setSceneToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  // Editor State
  const [proseInputText, setProseInputText] = useState("");
  const [autoSaveMessage, setAutoSaveMessage] = useState("All changes saved");
  const saveTimerRef = useRef<any>(null);

  // Stats goal editing
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState("1000");

  const activeProject = mobileStore.getActiveProject();
  const activeScene = mobileStore.getActiveScene();
  const activeChapter = mobileStore.getActiveChapter();
  const chapters = mobileStore.getChapters();
  const totalWords = mobileStore.getTotalWordCount();
  const totalChapters = mobileStore.getTotalChaptersCount();
  const totalScenes = mobileStore.getTotalScenesCount();
  const readingTimeMin = mobileStore.getReadingTimeMin();
  const readingTimeHours = (totalWords / (200 * 60)).toFixed(1);
  const todayWords = state.todayWordsWritten;
  const dailyGoal = state.dailyWordGoal || 1000;
  const goalProgress = mobileStore.getDailyGoalProgress();
  const avgSceneWords =
    totalScenes > 0 ? Math.round(totalWords / totalScenes) : 0;

  // Sync editor content when active scene changes
  useEffect(() => {
    if (activeScene) {
      setProseInputText(activeScene.proseContent || "");
      setAutoSaveMessage("All changes saved");
    } else {
      setProseInputText("");
    }
  }, [activeScene?.id]);

  function toggleChapterExpand(id: string) {
    setExpandedChapters((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  }

  function handleContentChange(text: string) {
    setProseInputText(text);
    setAutoSaveMessage("Saving changes...");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (activeScene) {
        mobileStore.updateSceneContent(activeScene.id, text);
        const now = new Date();
        setAutoSaveMessage(
          `Saved at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
        );
      }
    }, 400);
  }

  function openCreateChapter() {
    router.push("/novel/chapters/create");
  }

  function openEditChapter(chap: ChapterItem) {
    router.push(`/novel/chapters/${chap.id}`);
  }

  function handleDeleteChapter() {
    if (!chapterToDelete) return;
    mobileStore.deleteChapter(chapterToDelete.id);
    setChapterToDelete(null);
  }

  function openCreateScene(chapId?: string) {
    const targetId = chapId || chapters[0]?.id || "";
    router.push(
      targetId
        ? `/novel/scenes/create?chapterId=${targetId}`
        : "/novel/scenes/create",
    );
  }

  function openEditScene(sc: SceneItem) {
    router.push(`/novel/scenes/${sc.id}`);
  }

  function handleDeleteScene() {
    if (!sceneToDelete) return;
    mobileStore.deleteScene(sceneToDelete.id);
    setSceneToDelete(null);
  }

  function handleStatusChange(status: SceneStatus) {
    if (activeScene) {
      mobileStore.updateScene(activeScene.id, { status });
    }
    setIsStatusPickerOpen(false);
  }

  function handleSaveGoal() {
    const parsed = parseInt(goalInputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      mobileStore.setDailyGoal(parsed);
    }
    setIsEditingGoal(false);
  }

  // If no project is active, show the authoritative empty state
  if (!activeProject) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#09090b",
          padding: 16,
          justifyContent: "center",
        }}
      >
        <EmptyState
          icon={BookOpen}
          title="No Active Novel Project"
          description="Prose Studio requires an active novel project workspace. Select or create a project from the Projects Hub to begin writing."
          actionText="Go to Projects Hub"
          onAction={() => router.push("/")}
        />
      </View>
    );
  }

  const editorWordCount = proseInputText.trim()
    ? proseInputText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const editorCharCount = proseInputText.length;
  const editorReadingTime = Math.max(1, Math.ceil(editorWordCount / 200));
  const editorTargetWords = activeScene?.targetWordCount || 1500;
  const editorProgressPercent = Math.min(
    100,
    Math.round((editorWordCount / editorTargetWords) * 100),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      {/* Sub-Header Section Switcher (Exact formula from web: Overview, Canvas Editor, Manuscript Outline, Writing Telemetry) */}
      <View
        style={{
          backgroundColor: "#121215",
          borderBottomWidth: 1,
          borderBottomColor: "#27272a",
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("OVERVIEW")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "OVERVIEW"
                  ? "rgba(124, 58, 237, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "OVERVIEW"
                  ? "rgba(124, 58, 237, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <BookOpen
              size={14}
              color={activeTab === "OVERVIEW" ? "#7c3aed" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "OVERVIEW" ? "#7c3aed" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "OVERVIEW" ? "bold" : "500",
              }}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("EDITOR")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "EDITOR"
                  ? "rgba(124, 58, 237, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "EDITOR"
                  ? "rgba(124, 58, 237, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <Edit3
              size={14}
              color={activeTab === "EDITOR" ? "#7c3aed" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "EDITOR" ? "#7c3aed" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "EDITOR" ? "bold" : "500",
              }}
            >
              Canvas Editor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("OUTLINE")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "OUTLINE"
                  ? "rgba(124, 58, 237, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "OUTLINE"
                  ? "rgba(124, 58, 237, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <ListTree
              size={14}
              color={activeTab === "OUTLINE" ? "#7c3aed" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "OUTLINE" ? "#7c3aed" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "OUTLINE" ? "bold" : "500",
              }}
            >
              Outline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("STATS")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "STATS"
                  ? "rgba(124, 58, 237, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "STATS"
                  ? "rgba(124, 58, 237, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <BarChart3
              size={14}
              color={activeTab === "STATS" ? "#7c3aed" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "STATS" ? "#7c3aed" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "STATS" ? "bold" : "500",
              }}
            >
              Writing Telemetry
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ========================================== */}
      {/* TAB 1: MANUSCRIPT OVERVIEW */}
      {/* ========================================== */}
      {activeTab === "OVERVIEW" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
        >
          {/* Hero Section: Novel Identity & Quick Stats */}
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 12,
              padding: isTabletOrWide ? 20 : 16,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(124, 58, 237, 0.15)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(124, 58, 237, 0.3)",
                }}
              >
                <Sparkles size={12} color="#7c3aed" />
                <Text
                  style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}
                >
                  {activeProject.genre || "Creative Fiction"}
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                Created on{" "}
                {activeProject.createdAt
                  ? new Date(activeProject.createdAt).toLocaleDateString()
                  : "Recent"}
              </Text>
            </View>

            <Text
              style={{
                color: "#fafafa",
                fontSize: isTabletOrWide ? 22 : 18,
                fontWeight: "bold",
              }}
            >
              {activeProject.name || "Untitled Novel"}
            </Text>

            <Text style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 18 }}>
              {activeProject.description ||
                "No universe synopsis provided yet. Define your world canon and write captivating prose."}
            </Text>

            {/* Quick Action Buttons Tray */}
            <View
              style={{
                flexDirection: isTabletOrWide ? "row" : "column",
                gap: 8,
                paddingTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveTab("EDITOR")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: "#7c3aed",
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 40,
                }}
              >
                <Edit3 size={15} color="#ffffff" />
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Open Canvas Editor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openCreateChapter}
                style={{
                  flex: isTabletOrWide ? undefined : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: "#1e1e24",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 40,
                }}
              >
                <Plus size={15} color="#7c3aed" />
                <Text
                  style={{ color: "#fafafa", fontSize: 13, fontWeight: "bold" }}
                >
                  New Chapter
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Metric Cards Strip */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: "#27272a",
                paddingTop: 12,
                marginTop: 4,
              }}
            >
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Total Words
                </Text>
                <Text
                  style={{
                    color: "#fafafa",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginTop: 2,
                  }}
                >
                  {totalWords.toLocaleString()}
                </Text>
              </View>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Chapters
                </Text>
                <Text
                  style={{
                    color: "#fafafa",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginTop: 2,
                  }}
                >
                  {totalChapters}
                </Text>
              </View>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Scenes
                </Text>
                <Text
                  style={{
                    color: "#fafafa",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginTop: 2,
                  }}
                >
                  {totalScenes}
                </Text>
              </View>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Est. Read Time
                </Text>
                <Text
                  style={{
                    color: "#fafafa",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginTop: 2,
                  }}
                >
                  {readingTimeMin} min
                </Text>
              </View>
            </View>
          </View>

          {/* Studio Quick Navigation Cards (Faithfully Recreated from web novel/+page.svelte) */}
          <View
            style={{
              gap: 12,
              flexDirection: isTabletOrWide ? "row" : "column",
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("EDITOR")}
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Edit3 size={18} color="#7c3aed" />
                </View>
                <Text
                  style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}
                >
                  Canvas Prose Editor
                </Text>
                <Text
                  style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}
                >
                  Distraction-free canvas with live word counts, entity mention
                  autocomplete, and real-time auto-saving.
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderTopWidth: 1,
                  borderTopColor: "#27272a",
                  paddingTop: 8,
                }}
              >
                <Text
                  style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}
                >
                  Enter Canvas
                </Text>
                <ChevronRight size={14} color="#7c3aed" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("OUTLINE")}
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ListTree size={18} color="#7c3aed" />
                </View>
                <Text
                  style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}
                >
                  Manuscript Outline
                </Text>
                <Text
                  style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}
                >
                  Architect acts, chapters, and scene beats. Reorder plot
                  threads and map causal timeline sequences.
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderTopWidth: 1,
                  borderTopColor: "#27272a",
                  paddingTop: 8,
                }}
              >
                <Text
                  style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}
                >
                  View Outline
                </Text>
                <ChevronRight size={14} color="#7c3aed" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("STATS")}
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3 size={18} color="#7c3aed" />
                </View>
                <Text
                  style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}
                >
                  Writing Telemetry
                </Text>
                <Text
                  style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}
                >
                  Monitor writing output, daily word milestones, pacing
                  distribution, and manuscript velocity metrics.
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderTopWidth: 1,
                  borderTopColor: "#27272a",
                  paddingTop: 8,
                }}
              >
                <Text
                  style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}
                >
                  Open Analytics
                </Text>
                <ChevronRight size={14} color="#7c3aed" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Chapters & Manuscript Breakdown */}
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 12,
              padding: isTabletOrWide ? 20 : 16,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <BookOpen size={16} color="#7c3aed" />
                <Text
                  style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
                >
                  Manuscript Chapters
                </Text>
              </View>
              <TouchableOpacity onPress={openCreateChapter}>
                <Text
                  style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}
                >
                  + Add Chapter
                </Text>
              </TouchableOpacity>
            </View>

            {chapters.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Chapters Created Yet"
                description="Every great epic begins with Chapter One. Scaffold your first chapter to start writing scenes."
                actionText="Create Chapter 1"
                onAction={openCreateChapter}
              />
            ) : (
              <View style={{ gap: 8 }}>
                {chapters.map((chapter, idx) => {
                  const scenes = mobileStore.getScenesForChapter(chapter.id);
                  const chapterWords = scenes.reduce(
                    (acc, s) => acc + (s.wordCount || 0),
                    0,
                  );
                  return (
                    <View
                      key={chapter.id}
                      style={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#7c3aed",
                                fontSize: 11,
                                fontWeight: "bold",
                              }}
                            >
                              #{idx + 1}
                            </Text>
                            <Text
                              style={{
                                color: "#fafafa",
                                fontSize: 14,
                                fontWeight: "bold",
                              }}
                            >
                              {chapter.title}
                            </Text>
                          </View>
                          {chapter.synopsis ? (
                            <Text
                              style={{ color: "#a1a1aa", fontSize: 12 }}
                              numberOfLines={1}
                            >
                              {chapter.synopsis}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            mobileStore.selectChapter(chapter.id);
                            setActiveTab("EDITOR");
                          }}
                          style={{
                            backgroundColor: "#27272a",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fafafa",
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            Open in Editor
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          borderTopWidth: 1,
                          borderTopColor: "#27272a",
                          paddingTop: 6,
                        }}
                      >
                        <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                          {scenes.length} scene{scenes.length === 1 ? "" : "s"}
                        </Text>
                        <Text
                          style={{
                            color: "#fafafa",
                            fontSize: 11,
                            fontWeight: "bold",
                          }}
                        >
                          {chapterWords.toLocaleString()} words
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* TAB 2: CANVAS PROSE EDITOR */}
      {/* ========================================== */}
      {activeTab === "EDITOR" && (
        <View style={{ flex: 1 }}>
          {/* Top Editor Utility Strip */}
          <View
            style={{
              height: 44,
              borderBottomWidth: 1,
              borderBottomColor: "#27272a",
              backgroundColor: "#121215",
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flex: 1,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ padding: 4 }}
                accessibilityLabel="Toggle Manuscript Sidebar"
              >
                <List size={18} color="#a1a1aa" />
              </TouchableOpacity>
              <Text
                style={{
                  color: "#fafafa",
                  fontSize: 13,
                  fontWeight: "bold",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {activeChapter ? `${activeChapter.title} / ` : ""}
                {activeScene?.title || "No Scene Selected"}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text
                style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}
              >
                {editorWordCount}w · {editorReadingTime}m
              </Text>

              {activeScene && (
                <TouchableOpacity
                  onPress={() => setIsStatusPickerOpen(true)}
                  style={{
                    backgroundColor: "#1e1e24",
                    borderColor: "#27272a",
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        activeScene.status === "COMPLETED"
                          ? "#22c55e"
                          : activeScene.status === "REVISED"
                            ? "#3b82f6"
                            : activeScene.status === "IN_PROGRESS"
                              ? "#f59e0b"
                              : "#a1a1aa",
                    }}
                  />
                  <Text
                    style={{
                      color: "#fafafa",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {activeScene.status}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Editor Workspace Split View */}
          <View
            style={{
              flex: 1,
              flexDirection: isTabletOrWide ? "row" : "column",
            }}
          >
            {/* Manuscript Tree Drawer / Panel */}
            {isSidebarOpen && (
              <View
                style={{
                  width: isTabletOrWide ? 260 : "100%",
                  maxHeight: isTabletOrWide ? undefined : 150,
                  backgroundColor: "#121215",
                  borderRightWidth: isTabletOrWide ? 1 : 0,
                  borderBottomWidth: isTabletOrWide ? 0 : 1,
                  borderColor: "#27272a",
                  padding: 10,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#a1a1aa",
                      fontSize: 10,
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    Manuscript Scenes
                  </Text>
                  <TouchableOpacity onPress={() => openCreateScene()}>
                    <Text
                      style={{
                        color: "#7c3aed",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      + Scene
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal={!isTabletOrWide}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {chapters.length === 0 ? (
                    <TouchableOpacity onPress={openCreateChapter}>
                      <Text style={{ color: "#7c3aed", fontSize: 12 }}>
                        + Create Chapter 1
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    chapters.map((ch) => {
                      const chScenes = mobileStore.getScenesForChapter(ch.id);
                      return (
                        <View
                          key={ch.id}
                          style={{
                            gap: 4,
                            minWidth: isTabletOrWide ? undefined : 140,
                          }}
                        >
                          <Text
                            style={{
                              color: "#a1a1aa",
                              fontSize: 11,
                              fontWeight: "bold",
                            }}
                            numberOfLines={1}
                          >
                            {ch.title}
                          </Text>
                          {chScenes.map((sc) => {
                            const isSelected = activeScene?.id === sc.id;
                            return (
                              <TouchableOpacity
                                key={sc.id}
                                onPress={() => {
                                  mobileStore.selectScene(sc.id);
                                  if (!isTabletOrWide) setIsSidebarOpen(false);
                                }}
                                style={{
                                  paddingHorizontal: 8,
                                  paddingVertical: 6,
                                  borderRadius: 6,
                                  backgroundColor: isSelected
                                    ? "#7c3aed"
                                    : "#1e1e24",
                                  borderWidth: 1,
                                  borderColor: isSelected
                                    ? "#7c3aed"
                                    : "#27272a",
                                }}
                              >
                                <Text
                                  style={{
                                    color: isSelected ? "#ffffff" : "#fafafa",
                                    fontSize: 12,
                                    fontWeight: isSelected ? "bold" : "500",
                                  }}
                                  numberOfLines={1}
                                >
                                  {sc.title}
                                </Text>
                                <Text
                                  style={{
                                    color: isSelected
                                      ? "rgba(255,255,255,0.8)"
                                      : "#a1a1aa",
                                    fontSize: 10,
                                  }}
                                >
                                  {sc.wordCount} words
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {/* Prose Canvas Center */}
            <View
              style={{ flex: 1, padding: isTabletOrWide ? 20 : 12, gap: 10 }}
            >
              {!activeScene ? (
                <EmptyState
                  icon={Edit3}
                  title="No Scene Selected"
                  description="Select a scene from the left navigation tree or create a new scene to start drafting prose."
                  actionText="+ Create New Scene"
                  onAction={() => openCreateScene(chapters[0]?.id || "")}
                />
              ) : (
                <View style={{ flex: 1, gap: 8 }}>
                  {/* Scene Title Input */}
                  <TextInput
                    value={activeScene.title}
                    onChangeText={(t) =>
                      mobileStore.updateScene(activeScene.id, { title: t })
                    }
                    placeholder="Scene Title..."
                    placeholderTextColor="#71717a"
                    style={{
                      color: "#fafafa",
                      fontSize: isTabletOrWide ? 20 : 17,
                      fontWeight: "bold",
                      borderBottomWidth: 1,
                      borderBottomColor: "#27272a",
                      paddingBottom: 6,
                    }}
                  />

                  {/* Target Progress Bar */}
                  <View style={{ gap: 4 }}>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: "#27272a",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${editorProgressPercent}%`,
                          height: "100%",
                          backgroundColor: "#7c3aed",
                        }}
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ color: "#a1a1aa", fontSize: 10 }}>
                        {editorWordCount} / {editorTargetWords} words (
                        {editorProgressPercent}%)
                      </Text>
                      <Text style={{ color: "#a1a1aa", fontSize: 10 }}>
                        {autoSaveMessage}
                      </Text>
                    </View>
                  </View>

                  {/* Prose Editor Textarea */}
                  <TextInput
                    value={proseInputText}
                    onChangeText={handleContentChange}
                    placeholder="Begin drafting your scene prose here... Write freely and let your story unfold."
                    placeholderTextColor="#71717a"
                    multiline
                    textAlignVertical="top"
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      color: "#fafafa",
                      fontSize: 15,
                      lineHeight: 24,
                      padding: 4,
                    }}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ========================================== */}
      {/* TAB 3: MANUSCRIPT OUTLINE */}
      {/* ========================================== */}
      {activeTab === "OUTLINE" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 14 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ gap: 2 }}>
              <Text
                style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
              >
                Manuscript Outline
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                Structure your narrative arcs, sequence scenes, and track
                progression across chapters.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsChapterModalOpen(true)}
              style={{
                backgroundColor: "#7c3aed",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                minHeight: 38,
              }}
            >
              <Plus size={14} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
              >
                Add Chapter
              </Text>
            </TouchableOpacity>
          </View>

          {chapters.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Your Outline is Empty"
              description="Add your first chapter to begin scaffolding your novel's manuscript outline."
              actionText="Create Chapter 1"
              onAction={openCreateChapter}
            />
          ) : (
            <View style={{ gap: 12 }}>
              {chapters.map((chapter, cIdx) => {
                const scenes = mobileStore.getScenesForChapter(chapter.id);
                const isExpanded = expandedChapters[chapter.id] ?? true;
                const chapterWordCount = scenes.reduce(
                  (acc, s) => acc + (s.wordCount || 0),
                  0,
                );

                return (
                  <View
                    key={chapter.id}
                    style={{
                      backgroundColor: "#121215",
                      borderColor: "#27272a",
                      borderWidth: 1,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    {/* Chapter Header Row */}
                    <View
                      style={{
                        padding: 14,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottomWidth: isExpanded ? 1 : 0,
                        borderBottomColor: "#27272a",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleChapterExpand(chapter.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} color="#a1a1aa" />
                        ) : (
                          <ChevronRight size={16} color="#a1a1aa" />
                        )}
                        <View style={{ flex: 1, gap: 2 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#7c3aed",
                                fontSize: 12,
                                fontWeight: "bold",
                              }}
                            >
                              Chapter {cIdx + 1}
                            </Text>
                            <Text
                              style={{
                                color: "#fafafa",
                                fontSize: 15,
                                fontWeight: "bold",
                              }}
                            >
                              {chapter.title}
                            </Text>
                          </View>
                          {chapter.synopsis ? (
                            <Text
                              style={{ color: "#a1a1aa", fontSize: 12 }}
                              numberOfLines={1}
                            >
                              {chapter.synopsis}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                          {scenes.length} scenes ·{" "}
                          {chapterWordCount.toLocaleString()}w
                        </Text>
                        <TouchableOpacity
                          onPress={() => openEditChapter(chapter)}
                          style={{
                            backgroundColor: "#1e1e24",
                            borderColor: "#27272a",
                            borderWidth: 1,
                            padding: 6,
                            borderRadius: 6,
                          }}
                          accessibilityLabel="Edit Chapter Details"
                        >
                          <Pencil size={13} color="#a1a1aa" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => openCreateScene(chapter.id)}
                          style={{
                            backgroundColor: "rgba(124, 58, 237, 0.15)",
                            padding: 6,
                            borderRadius: 6,
                          }}
                          accessibilityLabel="Add Scene to Chapter"
                        >
                          <Plus size={14} color="#7c3aed" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setChapterToDelete({
                              id: chapter.id,
                              title: chapter.title,
                              sceneCount: scenes.length,
                            })
                          }
                          style={{ padding: 6 }}
                          accessibilityLabel="Delete Chapter"
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Scenes inside Chapter */}
                    {isExpanded && (
                      <View
                        style={{
                          padding: 12,
                          gap: 8,
                          backgroundColor: "#09090b",
                        }}
                      >
                        {scenes.length === 0 ? (
                          <View style={{ padding: 12, alignItems: "center" }}>
                            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                              No scenes in this chapter yet.
                            </Text>
                            <TouchableOpacity
                              onPress={() => openCreateScene(chapter.id)}
                              style={{ marginTop: 4 }}
                            >
                              <Text
                                style={{
                                  color: "#7c3aed",
                                  fontSize: 12,
                                  fontWeight: "bold",
                                }}
                              >
                                + Add first scene
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          scenes.map((scene, sIdx) => (
                            <View
                              key={scene.id}
                              style={{
                                backgroundColor: "#121215",
                                borderColor: "#27272a",
                                borderWidth: 1,
                                borderRadius: 8,
                                padding: 12,
                                gap: 6,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#a1a1aa",
                                    fontSize: 11,
                                    fontWeight: "bold",
                                  }}
                                >
                                  Scene #{sIdx + 1}
                                </Text>
                                <TouchableOpacity
                                  onPress={() => {
                                    const nextStatus: Record<
                                      SceneStatus,
                                      SceneStatus
                                    > = {
                                      DRAFT: "IN_PROGRESS",
                                      IN_PROGRESS: "REVISED",
                                      REVISED: "COMPLETED",
                                      COMPLETED: "DRAFT",
                                    };
                                    mobileStore.updateScene(scene.id, {
                                      status:
                                        nextStatus[scene.status] || "DRAFT",
                                    });
                                  }}
                                  style={{
                                    backgroundColor:
                                      scene.status === "COMPLETED"
                                        ? "rgba(34, 197, 94, 0.15)"
                                        : scene.status === "REVISED"
                                          ? "rgba(59, 130, 246, 0.15)"
                                          : scene.status === "IN_PROGRESS"
                                            ? "rgba(245, 158, 11, 0.15)"
                                            : "rgba(255, 255, 255, 0.08)",
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color:
                                        scene.status === "COMPLETED"
                                          ? "#22c55e"
                                          : scene.status === "REVISED"
                                            ? "#3b82f6"
                                            : scene.status === "IN_PROGRESS"
                                              ? "#f59e0b"
                                              : "#a1a1aa",
                                      fontSize: 10,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {scene.status}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <Text
                                style={{
                                  color: "#fafafa",
                                  fontSize: 14,
                                  fontWeight: "bold",
                                }}
                              >
                                {scene.title}
                              </Text>
                              {scene.synopsis ? (
                                <Text
                                  style={{ color: "#a1a1aa", fontSize: 12 }}
                                >
                                  {scene.synopsis}
                                </Text>
                              ) : null}

                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  borderTopWidth: 1,
                                  borderTopColor: "#1e1e24",
                                  paddingTop: 8,
                                }}
                              >
                                <Text
                                  style={{ color: "#a1a1aa", fontSize: 11 }}
                                >
                                  {scene.wordCount} /{" "}
                                  {scene.targetWordCount || 1500} words
                                </Text>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <TouchableOpacity
                                    onPress={() => openEditScene(scene)}
                                    style={{ padding: 4 }}
                                    accessibilityLabel="Edit Scene Details"
                                  >
                                    <Pencil size={13} color="#a1a1aa" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => {
                                      mobileStore.selectScene(scene.id);
                                      setActiveTab("EDITOR");
                                    }}
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 2,
                                      backgroundColor:
                                        "rgba(124, 58, 237, 0.15)",
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 4,
                                    }}
                                  >
                                    <Edit3 size={12} color="#7c3aed" />
                                    <Text
                                      style={{
                                        color: "#7c3aed",
                                        fontSize: 11,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Write
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() =>
                                      setSceneToDelete({
                                        id: scene.id,
                                        title: scene.title,
                                      })
                                    }
                                    style={{ padding: 4 }}
                                    accessibilityLabel="Delete Scene"
                                  >
                                    <Trash2 size={13} color="#ef4444" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* TAB 4: WRITING TELEMETRY & STATS */}
      {/* ========================================== */}
      {activeTab === "STATS" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
        >
          <View style={{ gap: 2 }}>
            <Text
              style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
            >
              Writing Telemetry & Analytics
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
              Live productivity telemetry, chapter word distributions, and
              pacing velocity.
            </Text>
          </View>

          {/* Key Telemetry Metrics Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <View
              style={{
                flex: 1,
                minWidth: 140,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Total Manuscript
                </Text>
                <FileText size={14} color="#7c3aed" />
              </View>
              <Text
                style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}
              >
                {totalWords.toLocaleString()}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 11 }}>
                {totalChapters} chapters · {totalScenes} scenes
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 140,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Today's Output
                </Text>
                <Flame size={14} color="#f59e0b" />
              </View>
              <Text
                style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}
              >
                {todayWords.toLocaleString()}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 11 }}>
                Goal: {dailyGoal.toLocaleString()}w ({goalProgress}%)
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 140,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Avg Scene Density
                </Text>
                <TrendingUp size={14} color="#10b981" />
              </View>
              <Text
                style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}
              >
                {avgSceneWords.toLocaleString()}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 11 }}>
                words per scene avg
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 140,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Reading Duration
                </Text>
                <Clock size={14} color="#3b82f6" />
              </View>
              <Text
                style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}
              >
                {readingTimeHours} hrs
              </Text>
              <Text style={{ color: "#71717a", fontSize: 11 }}>
                at standard 200 wpm
              </Text>
            </View>
          </View>

          {/* Daily Target Progress Card */}
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Target size={16} color="#7c3aed" />
                <Text
                  style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
                >
                  Daily Writing Target
                </Text>
              </View>
              {!isEditingGoal ? (
                <TouchableOpacity onPress={() => setIsEditingGoal(true)}>
                  <Text
                    style={{
                      color: "#7c3aed",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    Change Goal ({dailyGoal}w)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <TextInput
                    value={goalInputValue}
                    onChangeText={setGoalInputValue}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: "#09090b",
                      color: "#fafafa",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                      width: 60,
                      fontSize: 12,
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleSaveGoal}
                    style={{
                      backgroundColor: "#7c3aed",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View
              style={{
                height: 10,
                backgroundColor: "#27272a",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${goalProgress}%`,
                  height: "100%",
                  backgroundColor: "#7c3aed",
                }}
              />
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                {todayWords.toLocaleString()} words completed today
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                {goalProgress}% of {dailyGoal.toLocaleString()} word goal
              </Text>
            </View>
          </View>

          {/* Chapter Word Distribution */}
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <BookOpen size={16} color="#7c3aed" />
                <Text
                  style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
                >
                  Chapter Word Distribution
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                {chapters.length} chapters total
              </Text>
            </View>

            {chapters.length === 0 ? (
              <Text
                style={{
                  color: "#a1a1aa",
                  fontSize: 12,
                  textAlign: "center",
                  paddingVertical: 12,
                }}
              >
                No chapter data available. Create chapters in your manuscript to
                view distribution charts.
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {chapters.map((chapter, idx) => {
                  const scenes = mobileStore.getScenesForChapter(chapter.id);
                  const chapterWords = scenes.reduce(
                    (acc, s) => acc + (s.wordCount || 0),
                    0,
                  );
                  const percentOfTotal =
                    totalWords > 0
                      ? Math.round((chapterWords / totalWords) * 100)
                      : 0;

                  return (
                    <View
                      key={chapter.id}
                      style={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 10,
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fafafa",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          Ch. {idx + 1} {chapter.title}
                        </Text>
                        <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                          {scenes.length} scenes ·{" "}
                          {chapterWords.toLocaleString()}w ({percentOfTotal}%)
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#27272a",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${percentOfTotal}%`,
                            height: "100%",
                            backgroundColor: "#7c3aed",
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Delete Chapter Confirmation Modal */}
      <Modal visible={!!chapterToDelete} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "rgba(239, 68, 68, 0.4)",
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              width: "100%",
              maxWidth: 450,
              gap: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text
                style={{ color: "#ef4444", fontSize: 16, fontWeight: "bold" }}
              >
                Delete Chapter
              </Text>
            </View>
            <Text style={{ color: "#fafafa", fontSize: 13, lineHeight: 18 }}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "bold" }}>
                {chapterToDelete?.title}
              </Text>
              ?
            </Text>
            {chapterToDelete && chapterToDelete.sceneCount > 0 && (
              <View
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <Text style={{ color: "#ef4444", fontSize: 12 }}>
                  ⚠️ This chapter contains {chapterToDelete.sceneCount} scene
                  {chapterToDelete.sceneCount === 1 ? "" : "s"}. All scenes and
                  prose inside will be permanently removed.
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setChapterToDelete(null)}
                style={{
                  backgroundColor: "#27272a",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteChapter}
                style={{
                  backgroundColor: "#ef4444",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Delete Chapter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Scene Confirmation Modal */}
      <Modal visible={!!sceneToDelete} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "rgba(239, 68, 68, 0.4)",
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              width: "100%",
              maxWidth: 450,
              gap: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text
                style={{ color: "#ef4444", fontSize: 16, fontWeight: "bold" }}
              >
                Delete Scene
              </Text>
            </View>
            <Text style={{ color: "#fafafa", fontSize: 13, lineHeight: 18 }}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "bold" }}>{sceneToDelete?.title}</Text>
              ? All prose content in this scene will be deleted.
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setSceneToDelete(null)}
                style={{
                  backgroundColor: "#27272a",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteScene}
                style={{
                  backgroundColor: "#ef4444",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Delete Scene
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Status Picker Modal */}
      <Modal visible={isStatusPickerOpen} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              width: "100%",
              maxWidth: 350,
              gap: 12,
            }}
          >
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Set Scene Status
            </Text>
            <View style={{ gap: 8 }}>
              {(
                [
                  "DRAFT",
                  "IN_PROGRESS",
                  "REVISED",
                  "COMPLETED",
                ] as SceneStatus[]
              ).map((st) => {
                const isSelected = activeScene?.status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => handleStatusChange(st)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: isSelected
                        ? "rgba(124, 58, 237, 0.2)"
                        : "#18181b",
                      borderColor: isSelected ? "#7c3aed" : "#27272a",
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#7c3aed" : "#fafafa",
                        fontSize: 13,
                        fontWeight: "bold",
                      }}
                    >
                      {st}
                    </Text>
                    {isSelected && <CheckCircle2 size={16} color="#7c3aed" />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => setIsStatusPickerOpen(false)}
              style={{
                backgroundColor: "#27272a",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 4,
                minHeight: 40,
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
