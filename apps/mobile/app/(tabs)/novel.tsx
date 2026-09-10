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
  Trash2,
  CheckCircle2,
} from "lucide-react-native";

import { NovelOverviewTab } from "../../src/components/novel/NovelOverviewTab.tsx";
import { NovelEditorTab } from "../../src/components/novel/NovelEditorTab.tsx";
import { NovelOutlineTab } from "../../src/components/novel/NovelOutlineTab.tsx";
import { NovelStatsTab } from "../../src/components/novel/NovelStatsTab.tsx";

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

  // Chapter Deletion State
  const [chapterToDelete, setChapterToDelete] = useState<{
    id: string;
    title: string;
    sceneCount: number;
  } | null>(null);

  // Scene Deletion State
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
  const editorReadingTime = Math.max(1, Math.ceil(editorWordCount / 200));
  const editorTargetWords = activeScene?.targetWordCount || 1500;
  const editorProgressPercent = Math.min(
    100,
    Math.round((editorWordCount / editorTargetWords) * 100),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      {/* Sub-Header Section Switcher */}
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

      {/* Sub-Tab Rendering */}
      {activeTab === "OVERVIEW" && (
        <NovelOverviewTab
          activeProject={activeProject}
          chapters={chapters}
          totalWords={totalWords}
          totalChapters={totalChapters}
          totalScenes={totalScenes}
          readingTimeMin={readingTimeMin}
          isTabletOrWide={isTabletOrWide}
          onOpenEditor={() => setActiveTab("EDITOR")}
          onOpenOutline={() => setActiveTab("OUTLINE")}
          onOpenStats={() => setActiveTab("STATS")}
          onOpenCreateChapter={openCreateChapter}
          onOpenChapterInEditor={(chapterId) => {
            mobileStore.selectChapter(chapterId);
            setActiveTab("EDITOR");
          }}
        />
      )}

      {activeTab === "EDITOR" && (
        <NovelEditorTab
          activeScene={activeScene}
          activeChapter={activeChapter}
          chapters={chapters}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isTabletOrWide={isTabletOrWide}
          proseInputText={proseInputText}
          onContentChange={handleContentChange}
          autoSaveMessage={autoSaveMessage}
          editorWordCount={editorWordCount}
          editorReadingTime={editorReadingTime}
          editorProgressPercent={editorProgressPercent}
          editorTargetWords={editorTargetWords}
          onOpenStatusPicker={() => setIsStatusPickerOpen(true)}
          onOpenCreateScene={openCreateScene}
          onOpenCreateChapter={openCreateChapter}
          onSelectScene={(sceneId) => {
            mobileStore.selectScene(sceneId);
            if (!isTabletOrWide) setIsSidebarOpen(false);
          }}
        />
      )}

      {activeTab === "OUTLINE" && (
        <NovelOutlineTab
          chapters={chapters}
          expandedChapters={expandedChapters}
          onToggleChapterExpand={toggleChapterExpand}
          isTabletOrWide={isTabletOrWide}
          onOpenChapterModal={openCreateChapter}
          onOpenCreateChapter={openCreateChapter}
          onOpenEditChapter={openEditChapter}
          onOpenCreateScene={openCreateScene}
          onOpenEditScene={openEditScene}
          onDeleteChapterPrompt={(chap) => setChapterToDelete(chap)}
          onDeleteScenePrompt={(sc) => setSceneToDelete(sc)}
          onSelectSceneForEditor={(sceneId) => {
            mobileStore.selectScene(sceneId);
            setActiveTab("EDITOR");
          }}
        />
      )}

      {activeTab === "STATS" && (
        <NovelStatsTab
          totalWords={totalWords}
          totalChapters={totalChapters}
          totalScenes={totalScenes}
          todayWords={todayWords}
          dailyGoal={dailyGoal}
          goalProgress={goalProgress}
          avgSceneWords={avgSceneWords}
          readingTimeHours={readingTimeHours}
          chapters={chapters}
          isTabletOrWide={isTabletOrWide}
          isEditingGoal={isEditingGoal}
          goalInputValue={goalInputValue}
          onChangeGoalInput={setGoalInputValue}
          onStartEditingGoal={() => setIsEditingGoal(true)}
          onSaveGoal={handleSaveGoal}
        />
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
