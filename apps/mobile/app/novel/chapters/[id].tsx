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
  FolderEdit,
  Sparkles,
  AlertCircle,
  Check,
  Trash2,
} from "lucide-react-native";
import { mobileStore } from "../../../src/lib/mobileStore.ts";

export default function EditChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chapter, setChapter] = useState(() =>
    id ? mobileStore.getChapter(id) : undefined,
  );

  const [title, setTitle] = useState(chapter?.title || "");
  const [synopsis, setSynopsis] = useState(chapter?.synopsis || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const c = mobileStore.getChapter(id);
      if (c) {
        setChapter(c);
        setTitle(c.title);
        setSynopsis(c.synopsis || "");
      }
    }
  }, [id]);

  if (!chapter) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 px-4 py-8 items-center justify-center">
        <AlertCircle size={32} color="#ef4444" />
        <Text className="mt-3 text-base font-bold text-zinc-100">
          Chapter Not Found
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

  const scenes = mobileStore.getScenesForChapter(chapter.id);

  const handleSave = () => {
    const finalTitle = title.trim();
    if (!finalTitle) {
      setError("Chapter title is required.");
      return;
    }

    if (id) {
      mobileStore.updateChapter(id, {
        title: finalTitle,
        synopsis: synopsis.trim(),
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Chapter",
      `Are you sure you want to delete "${chapter.title}"? This will delete ${scenes.length} scene(s) contained within this chapter.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Chapter",
          style: "destructive",
          onPress: () => {
            mobileStore.deleteChapter(id);
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
              Edit Chapter
            </Text>
            <Text className="text-xs text-zinc-400">{chapter.title}</Text>
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

          {/* Chapter Title */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <FolderEdit size={16} color="#f59e0b" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Chapter Title <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError(null);
              }}
              placeholder="Chapter Title..."
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Synopsis */}
          <View className="mb-6">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Chapter Synopsis & Plot Beats
            </Text>
            <TextInput
              value={synopsis}
              onChangeText={setSynopsis}
              placeholder="Summary of character motivations, central conflict..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[120px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
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
                Save Chapter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 py-3.5"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-400">
                Delete Chapter ({scenes.length} Scenes)
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
