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
import { Sparkles, Plus, BookOpen, Globe2, Layers, CheckCircle2 } from "lucide-react-native";

export default function ProjectsScreen() {
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGenre, setNewProjectGenre] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const activeProject = mobileStore.getActiveProject();
  const totalWords = mobileStore.getTotalWordCount();

  function handleCreate() {
    if (!newProjectName.trim()) return;
    mobileStore.createProject({
      name: newProjectName.trim(),
      genre: newProjectGenre.trim() || undefined,
      description: newProjectDescription.trim() || undefined,
    });
    setNewProjectName("");
    setNewProjectGenre("");
    setNewProjectDescription("");
    setIsModalOpen(false);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#09090b" }}
      contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
    >
      {/* Active Project Hero Card */}
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
              {activeProject?.genre || "Fiction"}
            </Text>
          </View>

          <Text style={{ color: "#a1a1aa", fontSize: 11 }}>Active Universe</Text>
        </View>

        <Text style={{ color: "#fafafa", fontSize: isTabletOrWide ? 22 : 18, fontWeight: "bold" }}>
          {activeProject?.name || "Untitled Novel"}
        </Text>

        {activeProject?.description ? (
          <Text style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
            {activeProject.description}
          </Text>
        ) : null}

        {/* Telemetry Strip */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            borderTopWidth: 1,
            borderTopColor: "#27272a",
            paddingTop: 12,
            marginTop: 4,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
              Total Words
            </Text>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 2 }}>
              {totalWords.toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
              Chapters
            </Text>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 2 }}>
              {state.chapters.length}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
              Entities
            </Text>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 2 }}>
              {state.entities.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Projects List Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Your Novel Projects</Text>
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#7c3aed",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            minHeight: 44,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>New Project</Text>
        </TouchableOpacity>
      </View>

      {/* Projects List Grid */}
      <View style={{ gap: 10, flexDirection: isTabletOrWide ? "row" : "column", flexWrap: "wrap" }}>
        {state.projects.map((proj) => {
          const isActive = proj.id === state.activeProjectId;
          return (
            <TouchableOpacity
              key={proj.id}
              onPress={() => mobileStore.setActiveProject(proj.id)}
              style={{
                width: isTabletOrWide ? "48%" : "100%",
                backgroundColor: isActive ? "rgba(124, 58, 237, 0.1)" : "#121215",
                borderColor: isActive ? "#7c3aed" : "#27272a",
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                gap: 8,
                minHeight: 44,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text
                  style={{
                    color: isActive ? "#7c3aed" : "#fafafa",
                    fontSize: 15,
                    fontWeight: "bold",
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {proj.name}
                </Text>
                {isActive && <CheckCircle2 size={16} color="#7c3aed" />}
              </View>

              <Text style={{ color: "#a1a1aa", fontSize: 12 }} numberOfLines={1}>
                {proj.genre || "Fiction"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Create Project Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade">
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
              Create Novel Project
            </Text>

            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Novel Title *</Text>
              <TextInput
                value={newProjectName}
                onChangeText={setNewProjectName}
                placeholder="e.g. Whispers of the Star Sea"
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
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Genre / Setting</Text>
              <TextInput
                value={newProjectGenre}
                onChangeText={setNewProjectGenre}
                placeholder="e.g. Space Opera / Sci-Fi"
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
                value={newProjectDescription}
                onChangeText={setNewProjectDescription}
                placeholder="Brief universe setting and core premise..."
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 10,
                  color: "#fafafa",
                  fontSize: 14,
                  minHeight: 64,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
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
                onPress={handleCreate}
                style={{
                  backgroundColor: "#7c3aed",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Create Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
