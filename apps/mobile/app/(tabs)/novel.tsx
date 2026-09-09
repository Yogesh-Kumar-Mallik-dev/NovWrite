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
import { mobileStore } from "../../src/lib/mobileStore";
import { Edit3, Plus, BookOpen, Clock, Target, List } from "lucide-react-native";

export default function NovelScreen() {
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterSynopsis, setNewChapterSynopsis] = useState("");

  const activeScene = mobileStore.getActiveScene();
  const chapters = mobileStore.getChaptersForActiveProject();
  const totalWords = mobileStore.getTotalWordCount();

  function handleCreateChapter() {
    if (!newChapterTitle.trim()) return;
    mobileStore.createChapter(newChapterTitle.trim(), newChapterSynopsis.trim() || undefined);
    setNewChapterTitle("");
    setNewChapterSynopsis("");
    setIsChapterModalOpen(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b", flexDirection: isTabletOrWide ? "row" : "column" }}>
      {/* Chapter & Scene Selector Bar / Left Drawer on Tablet */}
      <View
        style={{
          width: isTabletOrWide ? 280 : "100%",
          backgroundColor: "#121215",
          borderRightWidth: isTabletOrWide ? 1 : 0,
          borderBottomWidth: isTabletOrWide ? 0 : 1,
          borderColor: "#27272a",
          padding: 12,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>
            Manuscript Tree
          </Text>
          <TouchableOpacity
            onPress={() => setIsChapterModalOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: "rgba(124, 58, 237, 0.2)",
              minHeight: 36,
            }}
          >
            <Plus size={14} color="#7c3aed" />
            <Text style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}>Chapter</Text>
          </TouchableOpacity>
        </View>

        {/* Scene Chips Horizontal Scroll on Phone / Vertical on Tablet */}
        <ScrollView
          horizontal={!isTabletOrWide}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {chapters.map((ch) => {
            const chScenes = mobileStore.getScenesForChapter(ch.id);
            return (
              <View key={ch.id} style={{ gap: 6, minWidth: isTabletOrWide ? undefined : 160 }}>
                <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "bold" }} numberOfLines={1}>
                  {ch.title}
                </Text>
                {chScenes.map((sc) => {
                  const isSelected = activeScene?.id === sc.id;
                  return (
                    <TouchableOpacity
                      key={sc.id}
                      onPress={() => mobileStore.selectScene(sc.id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 6,
                        backgroundColor: isSelected ? "#7c3aed" : "#1e1e24",
                        minHeight: 44,
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
                      <Text
                        style={{
                          color: isSelected ? "rgba(255,255,255,0.8)" : "#a1a1aa",
                          fontSize: 10,
                          marginTop: 2,
                        }}
                      >
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

      {/* Main Prose Canvas Editor Area */}
      <View style={{ flex: 1, padding: isTabletOrWide ? 20 : 14, gap: 10 }}>
        {/* Editor Telemetry Header */}
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
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }} numberOfLines={1}>
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

        {/* Prose Drafting Input */}
        <TextInput
          value={activeScene?.proseContent || ""}
          onChangeText={(text) => {
            if (activeScene) {
              mobileStore.updateSceneContent(activeScene.id, text);
            }
          }}
          placeholder="Begin drafting your scene prose on mobile... Ideas flow freely."
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
            padding: 8,
          }}
        />
      </View>

      {/* New Chapter Modal */}
      <Modal visible={isChapterModalOpen} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 14,
              padding: 20,
              gap: 14,
            }}
          >
            <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>
              Add Chapter
            </Text>

            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Chapter Title *</Text>
              <TextInput
                value={newChapterTitle}
                onChangeText={setNewChapterTitle}
                placeholder="e.g. Chapter 2: The Whispering Woods"
                placeholderTextColor="#71717a"
                style={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 10,
                  color: "#fafafa",
                  fontSize: 14,
                  minHeight: 44,
                }}
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
                style={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 10,
                  color: "#fafafa",
                  fontSize: 14,
                  minHeight: 56,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setIsChapterModalOpen(false)}
                style={{
                  backgroundColor: "#1e1e24",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateChapter}
                style={{
                  backgroundColor: "#7c3aed",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Add Chapter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
