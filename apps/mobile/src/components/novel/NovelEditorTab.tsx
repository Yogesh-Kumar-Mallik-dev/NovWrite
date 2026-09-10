import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { EmptyState } from "../EmptyState.tsx";
import { mobileStore } from "../../lib/mobileStore.ts";
import type { ChapterItem, SceneItem } from "../../lib/types.ts";
import { Edit3, List } from "lucide-react-native";

export interface NovelEditorTabProps {
  activeScene: SceneItem | null;
  activeChapter: ChapterItem | null;
  chapters: ChapterItem[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isTabletOrWide: boolean;
  proseInputText: string;
  onContentChange: (text: string) => void;
  autoSaveMessage: string;
  editorWordCount: number;
  editorReadingTime: number;
  editorProgressPercent: number;
  editorTargetWords: number;
  onOpenStatusPicker: () => void;
  onOpenCreateScene: (chapterId?: string) => void;
  onOpenCreateChapter: () => void;
  onSelectScene: (sceneId: string) => void;
}

export function NovelEditorTab({
  activeScene,
  activeChapter,
  chapters,
  isSidebarOpen,
  onToggleSidebar,
  isTabletOrWide,
  proseInputText,
  onContentChange,
  autoSaveMessage,
  editorWordCount,
  editorReadingTime,
  editorProgressPercent,
  editorTargetWords,
  onOpenStatusPicker,
  onOpenCreateScene,
  onOpenCreateChapter,
  onSelectScene,
}: NovelEditorTabProps) {
  return (
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
            onPress={onToggleSidebar}
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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}>
            {editorWordCount}w · {editorReadingTime}m
          </Text>

          {activeScene && (
            <TouchableOpacity
              onPress={onOpenStatusPicker}
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
              <TouchableOpacity onPress={() => onOpenCreateScene()}>
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
                <TouchableOpacity onPress={onOpenCreateChapter}>
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
                            onPress={() => onSelectScene(sc.id)}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              borderRadius: 6,
                              backgroundColor: isSelected
                                ? "#7c3aed"
                                : "#1e1e24",
                              borderWidth: 1,
                              borderColor: isSelected ? "#7c3aed" : "#27272a",
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
        <View style={{ flex: 1, padding: isTabletOrWide ? 20 : 12, gap: 10 }}>
          {!activeScene ? (
            <EmptyState
              icon={Edit3}
              title="No Scene Selected"
              description="Select a scene from the left navigation tree or create a new scene to start drafting prose."
              actionText="+ Create New Scene"
              onAction={() => onOpenCreateScene(chapters[0]?.id || "")}
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
                onChangeText={onContentChange}
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
  );
}
