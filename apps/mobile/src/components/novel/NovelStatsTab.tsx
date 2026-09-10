import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { mobileStore } from "../../lib/mobileStore.ts";
import type { ChapterItem } from "../../lib/types.ts";
import {
  FileText,
  Flame,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
} from "lucide-react-native";

export interface NovelStatsTabProps {
  totalWords: number;
  totalChapters: number;
  totalScenes: number;
  todayWords: number;
  dailyGoal: number;
  goalProgress: number;
  avgSceneWords: number;
  readingTimeHours: string;
  chapters: ChapterItem[];
  isTabletOrWide: boolean;
  isEditingGoal: boolean;
  goalInputValue: string;
  onChangeGoalInput: (val: string) => void;
  onStartEditingGoal: () => void;
  onSaveGoal: () => void;
}

export function NovelStatsTab({
  totalWords,
  totalChapters,
  totalScenes,
  todayWords,
  dailyGoal,
  goalProgress,
  avgSceneWords,
  readingTimeHours,
  chapters,
  isTabletOrWide,
  isEditingGoal,
  goalInputValue,
  onChangeGoalInput,
  onStartEditingGoal,
  onSaveGoal,
}: NovelStatsTabProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
    >
      <View style={{ gap: 2 }}>
        <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>
          Writing Telemetry & Analytics
        </Text>
        <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
          Live productivity telemetry, chapter word distributions, and pacing
          velocity.
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
          <Text style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>
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
          <Text style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>
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
          <Text style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>
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
          <Text style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Target size={16} color="#7c3aed" />
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Daily Writing Target
            </Text>
          </View>
          {!isEditingGoal ? (
            <TouchableOpacity onPress={onStartEditingGoal}>
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
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <TextInput
                value={goalInputValue}
                onChangeText={onChangeGoalInput}
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
                onPress={onSaveGoal}
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

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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
                      {scenes.length} scenes · {chapterWords.toLocaleString()}w
                      ({percentOfTotal}%)
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
  );
}
