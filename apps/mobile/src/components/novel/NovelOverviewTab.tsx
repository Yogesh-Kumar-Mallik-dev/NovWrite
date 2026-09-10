import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { EmptyState } from "../EmptyState.tsx";
import { mobileStore } from "../../lib/mobileStore.ts";
import type { ProjectItem, ChapterItem } from "../../lib/types.ts";
import {
  BookOpen,
  Edit3,
  ListTree,
  BarChart3,
  Plus,
  Sparkles,
  ChevronRight,
  FileText,
} from "lucide-react-native";

export interface NovelOverviewTabProps {
  activeProject: ProjectItem;
  chapters: ChapterItem[];
  totalWords: number;
  totalChapters: number;
  totalScenes: number;
  readingTimeMin: number;
  isTabletOrWide: boolean;
  onOpenEditor: () => void;
  onOpenOutline: () => void;
  onOpenStats: () => void;
  onOpenCreateChapter: () => void;
  onOpenChapterInEditor: (chapterId: string) => void;
}

export function NovelOverviewTab({
  activeProject,
  chapters,
  totalWords,
  totalChapters,
  totalScenes,
  readingTimeMin,
  isTabletOrWide,
  onOpenEditor,
  onOpenOutline,
  onOpenStats,
  onOpenCreateChapter,
  onOpenChapterInEditor,
}: NovelOverviewTabProps) {
  return (
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
            onPress={onOpenEditor}
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
            onPress={onOpenCreateChapter}
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

      {/* Studio Quick Navigation Cards */}
      <View
        style={{
          gap: 12,
          flexDirection: isTabletOrWide ? "row" : "column",
        }}
      >
        <TouchableOpacity
          onPress={onOpenEditor}
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
            <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
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
          onPress={onOpenOutline}
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
            <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
              Architect acts, chapters, and scene beats. Reorder plot threads
              and map causal timeline sequences.
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
          onPress={onOpenStats}
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
            <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BookOpen size={16} color="#7c3aed" />
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Manuscript Chapters
            </Text>
          </View>
          <TouchableOpacity onPress={onOpenCreateChapter}>
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
            onAction={onOpenCreateChapter}
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
                      onPress={() => onOpenChapterInEditor(chapter.id)}
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
  );
}
