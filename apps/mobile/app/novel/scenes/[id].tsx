import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  FileEdit,
  Sparkles,
  AlertCircle,
  Check,
  Target,
  Folder,
  Trash2,
} from "lucide-react-native";
import { mobileStore } from "../../../src/lib/mobileStore.ts";
import { SceneStatus } from "../../../src/lib/types.ts";

const WORD_PRESETS = [500, 1000, 1500, 2000, 3000, 5000];

const STATUSES: { value: SceneStatus; label: string; color: string }[] = [
  { value: "DRAFT", label: "Draft", color: "text-zinc-400" },
  { value: "IN_PROGRESS", label: "In Progress", color: "text-amber-400" },
  { value: "REVISED", label: "Revised", color: "text-blue-400" },
  { value: "COMPLETED", label: "Completed", color: "text-emerald-400" },
];

export default function EditSceneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scene, setScene] = useState(() =>
    id ? mobileStore.getScene(id) : undefined,
  );
  const chapters = mobileStore.getState().chapters;

  const [chapterId, setChapterId] = useState<string>(scene?.chapterId || "");
  const [title, setTitle] = useState(scene?.title || "");
  const [targetWords, setTargetWords] = useState(
    String(scene?.targetWordCount || 1500),
  );
  const [status, setStatus] = useState<SceneStatus>(scene?.status || "DRAFT");
  const [synopsis, setSynopsis] = useState(scene?.synopsis || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const sc = mobileStore.getScene(id);
      if (sc) {
        setScene(sc);
        setChapterId(sc.chapterId);
        setTitle(sc.title);
        setTargetWords(String(sc.targetWordCount || 1500));
        setStatus(sc.status);
        setSynopsis(sc.synopsis || "");
      }
    }
  }, [id]);

  if (!scene) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 px-4 py-8 items-center justify-center">
        <AlertCircle size={32} color="#ef4444" />
        <Text className="mt-3 text-base font-bold text-zinc-100">
          Scene Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5"
        >
          <Text className="text-xs text-zinc-300">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    const finalTitle = title.trim();
    if (!finalTitle) {
      setError("Scene title is required.");
      return;
    }

    if (!chapterId) {
      setError("Please select a parent chapter.");
      return;
    }

    const tWords = Number(targetWords) || 1500;

    if (id) {
      mobileStore.updateScene(id, {
        chapterId,
        title: finalTitle,
        targetWordCount: tWords,
        status,
        synopsis: synopsis.trim(),
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Scene",
      `Are you sure you want to delete "${scene.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Scene",
          style: "destructive",
          onPress: () => {
            mobileStore.deleteScene(id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3.5">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950"
          >
            <ArrowLeft size={20} color="#a1a1aa" />
          </TouchableOpacity>
          <View className="flex-1 items-center px-3">
            <Text className="text-base font-bold text-zinc-100">
              Edit Scene
            </Text>
            <Text className="text-xs text-zinc-400">
              {scene.title} ({scene.wordCount} words)
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2"
          >
            <Sparkles size={16} color="#09090b" />
            <Text className="text-xs font-bold text-zinc-950">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 py-5"
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View className="mb-5 flex-row items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5">
              <AlertCircle size={18} color="#ef4444" />
              <Text className="flex-1 text-xs text-red-300">{error}</Text>
            </View>
          ) : null}

          {/* Parent Chapter Picker */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Folder size={16} color="#f59e0b" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Parent Chapter <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2"
            >
              {chapters.map((ch) => {
                const isSelected = chapterId === ch.id;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    onPress={() => setChapterId(ch.id)}
                    activeOpacity={0.7}
                    className={`mr-2 rounded-xl border px-3.5 py-2.5 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/20"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-amber-400" : "text-zinc-300"
                      }`}
                    >
                      {ch.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Scene Title */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <FileEdit size={16} color="#3b82f6" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Scene Title <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError(null);
              }}
              placeholder="Scene title..."
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Target Word Count */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Target size={16} color="#10b981" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Target Word Count
              </Text>
            </View>
            <TextInput
              value={targetWords}
              onChangeText={setTargetWords}
              keyboardType="numeric"
              placeholder="1500"
              placeholderTextColor="#71717a"
              className="mb-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 font-mono"
            />
            <View className="flex-row flex-wrap gap-2">
              {WORD_PRESETS.map((p) => {
                const isSelected = targetWords === String(p);
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setTargetWords(String(p))}
                    activeOpacity={0.7}
                    className={`rounded-lg border px-3 py-1.5 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/20"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? "text-emerald-400" : "text-zinc-400"
                      }`}
                    >
                      {p} words
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Scene Status */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Workflow Status
            </Text>
            <View className="flex-row gap-2">
              {STATUSES.map((s) => {
                const isSelected = status === s.value;
                return (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setStatus(s.value)}
                    activeOpacity={0.7}
                    className={`flex-1 rounded-xl border p-2.5 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/20"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-center text-xs font-bold ${
                        isSelected ? "text-amber-400" : "text-zinc-400"
                      }`}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Synopsis */}
          <View className="mb-6">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Scene Synopsis & Narrative Beats
            </Text>
            <TextInput
              value={synopsis}
              onChangeText={setSynopsis}
              placeholder="What happens in this specific scene beat..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[100px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5"
            >
              <Check size={18} color="#09090b" />
              <Text className="text-sm font-bold text-zinc-950">
                Save Scene Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 py-3.5"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-400">
                Delete Scene
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-3.5"
            >
              <Text className="text-sm font-medium text-zinc-400">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
