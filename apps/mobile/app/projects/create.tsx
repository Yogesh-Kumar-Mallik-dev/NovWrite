import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Layers,
  AlertCircle,
  Check,
} from "lucide-react-native";
import { mobileStore } from "../../src/lib/mobileStore.ts";

const GENRE_PRESETS = [
  "Cultivation / Xianxia",
  "Progression Fantasy",
  "LitRPG / GameLit",
  "Dark Fantasy / Grimdark",
  "Hard Sci-Fi / Space Opera",
  "Cyberpunk / Dystopian",
  "Urban Fantasy / Mystery",
  "High Fantasy / Epic",
  "Historical Fiction",
  "Romance / Drama",
];

export default function CreateProjectScreen() {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("Cultivation / Xianxia");
  const [customGenre, setCustomGenre] = useState("");
  const [description, setDescription] = useState("");
  const [isCustomGenre, setIsCustomGenre] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    const finalName = name.trim();
    if (!finalName) {
      setError("Project title is required.");
      return;
    }

    const finalGenre = (isCustomGenre ? customGenre : genre).trim() || "General Fiction";

    const newProject = mobileStore.createProject({
      name: finalName,
      genre: finalGenre,
      description: description.trim(),
    });

    mobileStore.setActiveProject(newProject.id);
    router.replace("/(tabs)/");
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top Header */}
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
              Create New Project
            </Text>
            <Text className="text-xs text-zinc-400">
              Initialize Authoring & Lore Canvas
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2"
          >
            <Sparkles size={16} color="#09090b" />
            <Text className="text-xs font-bold text-zinc-950">Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 py-5"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View className="mb-5 flex-row items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5">
              <AlertCircle size={18} color="#ef4444" />
              <Text className="flex-1 text-xs text-red-300">{error}</Text>
            </View>
          ) : null}

          {/* Project Title */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <BookOpen size={16} color="#f59e0b" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Project Title <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError(null);
              }}
              placeholder="e.g., Starfall Vanguard, Celestial Dao"
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Genre Selection */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Layers size={16} color="#3b82f6" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Genre Preset
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {GENRE_PRESETS.map((g) => {
                const isSelected = !isCustomGenre && genre === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      setIsCustomGenre(false);
                      setGenre(g);
                    }}
                    activeOpacity={0.7}
                    className={`rounded-lg border px-3 py-2 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/20"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? "text-amber-400" : "text-zinc-400"
                      }`}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setIsCustomGenre(true)}
                activeOpacity={0.7}
                className={`rounded-lg border px-3 py-2 ${
                  isCustomGenre
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isCustomGenre ? "text-amber-400" : "text-zinc-400"
                  }`}
                >
                  Custom Genre...
                </Text>
              </TouchableOpacity>
            </View>

            {isCustomGenre && (
              <TextInput
                value={customGenre}
                onChangeText={setCustomGenre}
                placeholder="Enter custom genre string..."
                placeholderTextColor="#71717a"
                className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
              />
            )}
          </View>

          {/* Description & World Logline */}
          <View className="mb-6">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Universe Logline & Premise
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="High-level narrative logline, core premise, or worldbuilding overview..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[110px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleCreate}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5"
            >
              <Check size={18} color="#09090b" />
              <Text className="text-sm font-bold text-zinc-950">
                Initialize Project
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
