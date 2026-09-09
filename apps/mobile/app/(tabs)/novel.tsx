import React, { useSyncExternalStore, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  useWindowDimensions,
} from "react-native";
import { mobileStore } from "../../src/lib/mobileStore.ts";
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
  FileText,
  Layers,
} from "lucide-react-native";

type ProseSubTab = "OVERVIEW" | "EDITOR" | "OUTLINE" | "STATS";

export default function NovelScreen() {
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [activeTab, setActiveTab] = useState<ProseSubTab>("OVERVIEW");

  // Modals
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterSynopsis, setNewChapterSynopsis] = useState("");

  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [newSceneTargetWords, setNewSceneTargetWords] = useState("1500");

  const activeProject = mobileStore.getActiveProject();
  const activeScene = mobileStore.getActiveScene();
  const chapters = mobileStore.getChaptersForActiveProject();
  const totalWords = mobileStore.getTotalWordCount();
  const readingTimeMin = mobileStore.getReadingTimeMin();
  const dailyProgress = mobileStore.getDailyGoalProgress();

  function openNewScene(chapId: string) {
    setSelectedChapterId(chapId);
    setNewSceneTitle("");
    setNewSceneTargetWords("1500");
    setIsSceneModalOpen(true);
  }

  function handleCreateChapter() {
    if (!newChapterTitle.trim()) return;
    mobileStore.createChapter(newChapterTitle.trim(), newChapterSynopsis.trim() || undefined);
    setNewChapterTitle("");
    setNewChapterSynopsis("");
    setIsChapterModalOpen(false);
  }

  function handleCreateScene() {
    if (!newSceneTitle.trim() || !selectedChapterId) return;
    const targetWords = parseInt(newSceneTargetWords, 10) || 1500;
    mobileStore.createScene(selectedChapterId, newSceneTitle.trim(), targetWords);
    setIsSceneModalOpen(false);
    setActiveTab("EDITOR");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      {/* Sub-Header Section Switcher (Formula from web: Overview, Editor, Outline, Stats) */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#121215",
          borderBottomWidth: 1,
          borderBottomColor: "#27272a",
          paddingHorizontal: 12,
          paddingVertical: 6,
          gap: 6,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("OVERVIEW")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: activeTab === "OVERVIEW" ? "rgba(124, 58, 237, 0.15)" : "transparent",
            borderColor: activeTab === "OVERVIEW" ? "rgba(124, 58, 237, 0.4)" : "transparent",
            borderWidth: 1,
            minHeight: 36,
          }}
        >
          <BookOpen size={14} color={activeTab === "OVERVIEW" ? "#7c3aed" : "#a1a1aa"} />
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
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: activeTab === "EDITOR" ? "rgba(124, 58, 237, 0.15)" : "transparent",
            borderColor: activeTab === "EDITOR" ? "rgba(124, 58, 237, 0.4)" : "transparent",
            borderWidth: 1,
            minHeight: 36,
          }}
        >
          <Edit3 size={14} color={activeTab === "EDITOR" ? "#7c3aed" : "#a1a1aa"} />
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
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: activeTab === "OUTLINE" ? "rgba(124, 58, 237, 0.15)" : "transparent",
            borderColor: activeTab === "OUTLINE" ? "rgba(124, 58, 237, 0.4)" : "transparent",
            borderWidth: 1,
            minHeight: 36,
          }}
        >
          <ListTree size={14} color={activeTab === "OUTLINE" ? "#7c3aed" : "#a1a1aa"} />
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
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: activeTab === "STATS" ? "rgba(124, 58, 237, 0.15)" : "transparent",
            borderColor: activeTab === "STATS" ? "rgba(124, 58, 237, 0.4)" : "transparent",
            borderWidth: 1,
            minHeight: 36,
          }}
        >
          <BarChart3 size={14} color={activeTab === "STATS" ? "#7c3aed" : "#a1a1aa"} />
          <Text
            style={{
              color: activeTab === "STATS" ? "#7c3aed" : "#a1a1aa",
              fontSize: 12,
              fontWeight: activeTab === "STATS" ? "bold" : "500",
            }}
          >
            Telemetry
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
        >
          {/* Hero Section */}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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
                <Text style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}>
                  {activeProject?.genre || "Creative Fiction"}
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 11 }}>Manuscript Overview</Text>
            </View>

            <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>
              {activeProject?.name || "Untitled Novel"}
            </Text>

            <Text style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 18 }}>
              {activeProject?.description || "Define your manuscript outline and craft captivating prose."}
            </Text>

            {/* Metrics */}
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
                <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>Words</Text>
                <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 2 }}>{totalWords.toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>Chapters</Text>
                <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 2 }}>{chapters.length}</Text>
              </View>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>Scenes</Text>
                <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 2 }}>{state.scenes.length}</Text>
              </View>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>Read Time</Text>
                <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 2 }}>{readingTimeMin}m</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, paddingTop: 4 }}>
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
                  minHeight: 44,
                }}
              >
                <Edit3 size={16} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Open Canvas Editor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsChapterModalOpen(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: "#1e1e24",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                }}
              >
                <Plus size={16} color="#7c3aed" />
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "bold" }}>Add Chapter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chapters List */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Manuscript Chapters</Text>
              <TouchableOpacity onPress={() => setIsChapterModalOpen(true)}>
                <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}>+ New Chapter</Text>
              </TouchableOpacity>
            </View>

            {chapters.map((ch, idx) => {
              const chScenes = mobileStore.getScenesForChapter(ch.id);
              const chWords = chScenes.reduce((acc, s) => acc + (s.wordCount || 0), 0);
              return (
                <View
                  key={ch.id}
                  style={{
                    backgroundColor: "#121215",
                    borderColor: "#27272a",
                    borderWidth: 1,
                    borderRadius: 10,
                    padding: 14,
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}>#{idx + 1}</Text>
                        <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}>{ch.title}</Text>
                      </View>
                      {ch.synopsis ? (
                        <Text style={{ color: "#a1a1aa", fontSize: 12 }} numberOfLines={2}>{ch.synopsis}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => openNewScene(ch.id)}
                      style={{
                        backgroundColor: "rgba(124, 58, 237, 0.15)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}>+ Scene</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#1e1e24", paddingTop: 8 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                      {chScenes.length} scene{chScenes.length === 1 ? "" : "s"} · {chWords.toLocaleString()} words
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (chScenes[0]) mobileStore.selectScene(chScenes[0].id);
                        setActiveTab("EDITOR");
                      }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                    >
                      <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}>Edit</Text>
                      <ChevronRight size={14} color="#7c3aed" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* TAB 2: CANVAS EDITOR */}
      {activeTab === "EDITOR" && (
        <View style={{ flex: 1, flexDirection: isTabletOrWide ? "row" : "column" }}>
          {/* Chapter & Scene Tree Selector Bar */}
          <View
            style={{
              width: isTabletOrWide ? 260 : "100%",
              backgroundColor: "#121215",
              borderRightWidth: isTabletOrWide ? 1 : 0,
              borderBottomWidth: isTabletOrWide ? 0 : 1,
              borderColor: "#27272a",
              padding: 10,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>
                Manuscript Tree
              </Text>
              <TouchableOpacity
                onPress={() => setIsChapterModalOpen(true)}
                style={{ backgroundColor: "rgba(124, 58, 237, 0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}
              >
                <Text style={{ color: "#7c3aed", fontSize: 10, fontWeight: "bold" }}>+ Chapter</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal={!isTabletOrWide}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {chapters.map((ch) => {
                const chScenes = mobileStore.getScenesForChapter(ch.id);
                return (
                  <View key={ch.id} style={{ gap: 6, minWidth: isTabletOrWide ? undefined : 150 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "bold" }} numberOfLines={1}>
                      {ch.title}
                    </Text>
                    {chScenes.map((sc) => {
                      const isSelected = activeScene?.id === sc.id;
                      return (
                        <TouchableOpacity
                          key={sc.id}
                          onPress={() => mobileStore.selectScene(sc.id)}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: 6,
                            backgroundColor: isSelected ? "#7c3aed" : "#1e1e24",
                            minHeight: 38,
                            justifyContent: "center",
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
                          <Text style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#a1a1aa", fontSize: 10 }}>
                            {sc.wordCount} words
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Canvas Prose Drafting Area */}
          <View style={{ flex: 1, padding: isTabletOrWide ? 20 : 12, gap: 10 }}>
            {/* Telemetry Strip */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#27272a",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }} numberOfLines={1}>
                  {activeScene?.title || "No Scene Selected"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}>
                  {activeScene?.wordCount || 0} words
                </Text>
                <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                  Goal: {activeScene?.targetWordCount || 1500}w
                </Text>
              </View>
            </View>

            {/* Prose Editor Input */}
            <TextInput
              value={activeScene?.proseContent || ""}
              onChangeText={(text) => {
                if (activeScene) {
                  mobileStore.updateSceneContent(activeScene.id, text);
                }
              }}
              placeholder="Begin drafting your scene prose on mobile... Ideas flow freely into the canvas."
              placeholderTextColor="#71717a"
              multiline
              textAlignVertical="top"
              style={{
                flex: 1,
                backgroundColor: "transparent",
                color: "#fafafa",
                fontSize: 15,
                lineHeight: 24,
                fontFamily: "serif",
                padding: 4,
              }}
            />
          </View>
        </View>
      )}

      {/* TAB 3: OUTLINE */}
      {activeTab === "OUTLINE" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 14 }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Manuscript Outline</Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
              Architect chapters, scenes, and dramatic pacing beats.
            </Text>
          </View>

          {chapters.map((ch, cIdx) => {
            const chScenes = mobileStore.getScenesForChapter(ch.id);
            return (
              <View
                key={ch.id}
                style={{
                  backgroundColor: "#121215",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 14,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}>
                    Chapter {cIdx + 1}: {ch.title}
                  </Text>
                  <TouchableOpacity onPress={() => openNewScene(ch.id)}>
                    <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}>+ Add Scene</Text>
                  </TouchableOpacity>
                </View>

                {ch.synopsis ? (
                  <Text style={{ color: "#a1a1aa", fontSize: 12, fontStyle: "italic" }}>{ch.synopsis}</Text>
                ) : null}

                {/* Scenes breakdown */}
                <View style={{ gap: 6, marginTop: 4 }}>
                  {chScenes.map((sc, sIdx) => (
                    <TouchableOpacity
                      key={sc.id}
                      onPress={() => {
                        mobileStore.selectScene(sc.id);
                        setActiveTab("EDITOR");
                      }}
                      style={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 10,
                        gap: 4,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>
                          {sIdx + 1}. {sc.title}
                        </Text>
                        <View
                          style={{
                            backgroundColor: "rgba(124, 58, 237, 0.15)",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ color: "#7c3aed", fontSize: 10, fontWeight: "bold" }}>
                            {sc.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                        {sc.wordCount} / {sc.targetWordCount || 1500} words · {sc.synopsis || "No synopsis"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* TAB 4: TELEMETRY / STATS */}
      {activeTab === "STATS" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Writing Telemetry</Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
              Daily word counts, manuscript pacing, and writing velocity analytics.
            </Text>
          </View>

          {/* Daily Goal Card */}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}>Daily Output Target</Text>
              <Text style={{ color: "#7c3aed", fontSize: 13, fontWeight: "bold" }}>{dailyProgress}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={{ height: 8, backgroundColor: "#27272a", borderRadius: 999, overflow: "hidden" }}>
              <View style={{ width: `${dailyProgress}%`, height: "100%", backgroundColor: "#7c3aed" }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                Written Today: <Text style={{ color: "#fafafa", fontWeight: "bold" }}>{state.todayWordsWritten}w</Text>
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                Goal: <Text style={{ color: "#fafafa", fontWeight: "bold" }}>{state.dailyWordGoal}w</Text>
              </Text>
            </View>
          </View>

          {/* Metric Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <View style={{ flex: 1, minWidth: 140, backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 10, padding: 14, gap: 4 }}>
              <Text style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>Total Manuscript</Text>
              <Text style={{ color: "#fafafa", fontSize: 20, fontWeight: "bold" }}>{totalWords.toLocaleString()}</Text>
              <Text style={{ color: "#71717a", fontSize: 11 }}>words drafted</Text>
            </View>

            <View style={{ flex: 1, minWidth: 140, backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 10, padding: 14, gap: 4 }}>
              <Text style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>Est. Reading Time</Text>
              <Text style={{ color: "#fafafa", fontSize: 20, fontWeight: "bold" }}>{readingTimeMin} min</Text>
              <Text style={{ color: "#71717a", fontSize: 11 }}>at 200 wpm cadence</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* New Chapter Modal */}
      <Modal visible={isChapterModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Create Chapter</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Chapter Title *</Text>
              <TextInput
                value={newChapterTitle}
                onChangeText={setNewChapterTitle}
                placeholder="e.g. Chapter 3: The Astral Convergence"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Synopsis</Text>
              <TextInput
                value={newChapterSynopsis}
                onChangeText={setNewChapterSynopsis}
                placeholder="Brief plot outline..."
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={2}
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14, minHeight: 50 }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setIsChapterModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateChapter} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Add Chapter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Scene Modal */}
      <Modal visible={isSceneModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Add Scene Beat</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Scene Title *</Text>
              <TextInput
                value={newSceneTitle}
                onChangeText={setNewSceneTitle}
                placeholder="e.g. Scene 1: Arrival at the Gates"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Target Word Count</Text>
              <TextInput
                value={newSceneTargetWords}
                onChangeText={setNewSceneTargetWords}
                keyboardType="numeric"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setIsSceneModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateScene} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Add Scene</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

