import { Tabs } from "expo-router";
import React, { useSyncExternalStore, useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, useWindowDimensions, ScrollView } from "react-native";
import { BookOpen, Globe2, FolderGit2, Sparkles, ChevronDown, Plus, CheckCircle2, Trash2, Pencil } from "lucide-react-native";
import { mobileStore } from "../../src/lib/mobileStore.ts";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGenre, setNewProjectGenre] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const activeProject = mobileStore.getActiveProject();

  function handleCreateProject() {
    if (!newProjectName.trim()) return;
    mobileStore.createProject({
      name: newProjectName.trim(),
      genre: newProjectGenre.trim() || undefined,
      description: newProjectDesc.trim() || undefined,
    });
    setNewProjectName("");
    setNewProjectGenre("");
    setNewProjectDesc("");
    setIsNewProjectModalOpen(false);
    setIsSwitcherOpen(false);
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#7c3aed",
          tabBarInactiveTintColor: "#a1a1aa",
          tabBarStyle: {
            backgroundColor: "#121215",
            borderTopColor: "#27272a",
            height: isTabletOrWide ? 64 : 56,
            paddingBottom: isTabletOrWide ? 8 : 4,
            paddingTop: 4,
          },
          headerStyle: {
            backgroundColor: "#121215",
            borderBottomColor: "#27272a",
            borderBottomWidth: 1,
            height: 56,
          },
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 12 }}>
              {/* Brand Identity */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: "#7c3aed",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#fafafa" }}>
                  <Text style={{ color: "#7c3aed" }}>Nov</Text>Write
                </Text>
              </View>

              {/* Active Project Switcher Chip */}
              <TouchableOpacity
                onPress={() => setIsSwitcherOpen(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(124, 58, 237, 0.12)",
                  borderColor: "rgba(124, 58, 237, 0.3)",
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  maxWidth: 180,
                }}
              >
                <Text
                  style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}
                  numberOfLines={1}
                >
                  {activeProject?.name || "Select Project"}
                </Text>
                <ChevronDown size={12} color="#7c3aed" />
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Projects",
            tabBarIcon: ({ color, size }) => <FolderGit2 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="novel"
          options={{
            title: "Prose Studio",
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="world"
          options={{
            title: "World Studio",
            tabBarIcon: ({ color, size }) => <Globe2 color={color} size={size} />,
          }}
        />
      </Tabs>

      {/* Global Project Switcher Modal */}
      <Modal visible={isSwitcherOpen} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              maxHeight: "80%",
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>
                Switch Novel Workspace
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSwitcherOpen(false);
                  setIsNewProjectModalOpen(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#7c3aed",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Plus size={14} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>New</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 8 }}>
              {state.projects.map((proj) => {
                const isActive = proj.id === state.activeProjectId;
                return (
                  <TouchableOpacity
                    key={proj.id}
                    onPress={() => {
                      mobileStore.setActiveProject(proj.id);
                      setIsSwitcherOpen(false);
                    }}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: isActive ? "rgba(124, 58, 237, 0.15)" : "#18181b",
                      borderColor: isActive ? "#7c3aed" : "#27272a",
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          color: isActive ? "#7c3aed" : "#fafafa",
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                        numberOfLines={1}
                      >
                        {proj.name}
                      </Text>
                      <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                        {proj.genre || "Fiction"}
                      </Text>
                    </View>
                    {isActive && <CheckCircle2 size={16} color="#7c3aed" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsSwitcherOpen(false)}
              style={{
                backgroundColor: "#27272a",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Project Modal */}
      <Modal visible={isNewProjectModalOpen} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              gap: 12,
            }}
          >
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>
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
                }}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Synopsis</Text>
              <TextInput
                value={newProjectDesc}
                onChangeText={setNewProjectDesc}
                placeholder="Brief premise..."
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
                  minHeight: 60,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setIsNewProjectModalOpen(false)}
                style={{
                  backgroundColor: "#27272a",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateProject}
                style={{
                  backgroundColor: "#7c3aed",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

