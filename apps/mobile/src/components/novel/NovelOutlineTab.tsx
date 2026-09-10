import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { EmptyState } from "../EmptyState.tsx";
import { mobileStore } from "../../lib/mobileStore.ts";
import type { ChapterItem, SceneItem, SceneStatus } from "../../lib/types.ts";
import {
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Edit3,
} from "lucide-react-native";

export interface NovelOutlineTabProps {
  chapters: ChapterItem[];
  expandedChapters: Record<string, boolean>;
  onToggleChapterExpand: (id: string) => void;
  isTabletOrWide: boolean;
  onOpenChapterModal: () => void;
  onOpenCreateChapter: () => void;
  onOpenEditChapter: (chap: ChapterItem) => void;
  onOpenCreateScene: (chapId?: string) => void;
  onOpenEditScene: (sc: SceneItem) => void;
  onDeleteChapterPrompt: (chap: {
    id: string;
    title: string;
    sceneCount: number;
  }) => void;
  onDeleteScenePrompt: (sc: { id: string; title: string }) => void;
  onSelectSceneForEditor: (sceneId: string) => void;
}

export function NovelOutlineTab({
  chapters,
  expandedChapters,
  onToggleChapterExpand,
  isTabletOrWide,
  onOpenChapterModal,
  onOpenCreateChapter,
  onOpenEditChapter,
  onOpenCreateScene,
  onOpenEditScene,
  onDeleteChapterPrompt,
  onDeleteScenePrompt,
  onSelectSceneForEditor,
}: NovelOutlineTabProps) {
  return (
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
          <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>
            Manuscript Outline
          </Text>
          <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
            Structure your narrative arcs, sequence scenes, and track
            progression across chapters.
          </Text>
        </View>
        <TouchableOpacity
          onPress={onOpenChapterModal}
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
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
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
          onAction={onOpenCreateChapter}
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
                    onPress={() => onToggleChapterExpand(chapter.id)}
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
                      onPress={() => onOpenEditChapter(chapter)}
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
                      onPress={() => onOpenCreateScene(chapter.id)}
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
                        onDeleteChapterPrompt({
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
                          onPress={() => onOpenCreateScene(chapter.id)}
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
                                  status: nextStatus[scene.status] || "DRAFT",
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
                            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
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
                            <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
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
                                onPress={() => onOpenEditScene(scene)}
                                style={{ padding: 4 }}
                                accessibilityLabel="Edit Scene Details"
                              >
                                <Pencil size={13} color="#a1a1aa" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => onSelectSceneForEditor(scene.id)}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 2,
                                  backgroundColor: "rgba(124, 58, 237, 0.15)",
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
                                  onDeleteScenePrompt({
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
  );
}
