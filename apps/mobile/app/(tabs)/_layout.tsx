import { Tabs, useRouter } from "expo-router";
import React, { useSyncExternalStore, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpen,
  Globe2,
  Folder,
  FolderPlus,
  ChevronDown,
  Plus,
  CheckCircle2,
  Trash2,
  Pencil,
} from "lucide-react-native";
import { mobileStore } from "../../src/lib/mobileStore.ts";

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [descInput, setDescInput] = useState("");

  const [isDeleteAcknowledged, setIsDeleteAcknowledged] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");

  const activeProject = mobileStore.getActiveProject();
  const isDeleteTitleMatched = activeProject ? deleteConfirmTitle.trim() === activeProject.name : false;
  const isDeleteReady = isDeleteAcknowledged && isDeleteTitleMatched;

  function openCreate() {
    setIsSwitcherOpen(false);
    router.push("/projects/create");
  }

  function openEdit() {
    if (!activeProject) return;
    setNameInput(activeProject.name);
    setGenreInput(activeProject.genre || "");
    setDescInput(activeProject.description || "");
    setIsEditModalOpen(true);
  }

  function openDelete() {
    setIsDeleteAcknowledged(false);
    setDeleteConfirmTitle("");
    setIsDeleteModalOpen(true);
  }

  function handleEdit() {
    if (!activeProject || !nameInput.trim()) return;
    mobileStore.updateProject(activeProject.id, {
      name: nameInput.trim(),
      genre: genreInput.trim() || undefined,
      description: descInput.trim() || undefined,
    });
    setIsEditModalOpen(false);
  }

  function handleDelete() {
    if (!activeProject || !isDeleteReady) return;
    mobileStore.deleteProject(activeProject.id);
    setIsDeleteModalOpen(false);
    setIsSwitcherOpen(false);
    setIsDeleteAcknowledged(false);
    setDeleteConfirmTitle("");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      {/* Dedicated App Top Header (Safe Area Aware) */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 8),
          backgroundColor: "#121215",
          borderBottomColor: "#27272a",
          borderBottomWidth: 1,
        }}
      >
        <View
          style={{
            height: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
        >
          {/* Brand Identity: Real Logo + NovWrite text */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={require("../../assets/logo.png")}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#27272a",
              }}
              resizeMode="contain"
            />
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
              minHeight: 32,
            }}
          >
            <Folder size={12} color="#7c3aed" />
            <Text
              style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}
              numberOfLines={1}
            >
              {activeProject?.name || "Select Project"}
            </Text>
            <ChevronDown size={12} color="#7c3aed" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Screen Content & Bottom Navigation */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#7c3aed",
            tabBarInactiveTintColor: "#a1a1aa",
            tabBarStyle: {
              backgroundColor: "#121215",
              borderTopColor: "#27272a",
              borderTopWidth: 1,
              height: 54 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 6),
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "600",
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Projects",
              tabBarIcon: ({ color, size }) => <Folder color={color} size={size - 2} />,
            }}
          />
          <Tabs.Screen
            name="novel"
            options={{
              title: "Prose Studio",
              tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size - 2} />,
            }}
          />
          <Tabs.Screen
            name="world"
            options={{
              title: "World Studio",
              tabBarIcon: ({ color, size }) => <Globe2 color={color} size={size - 2} />,
            }}
          />
        </Tabs>
      </View>

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
                  openCreate();
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

            {state.projects.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: "center", gap: 6 }}>
                <Folder size={28} color="#a1a1aa" />
                <Text style={{ color: "#a1a1aa", fontSize: 13 }}>No novel projects created yet.</Text>
              </View>
            ) : (
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
            )}

            <TouchableOpacity
              onPress={() => setIsSwitcherOpen(false)}
              style={{
                backgroundColor: "#27272a",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 4,
                minHeight: 40,
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Project Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Edit Project Details</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Novel Title *</Text>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Genre / Setting</Text>
              <TextInput
                value={genreInput}
                onChangeText={setGenreInput}
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Synopsis</Text>
              <TextInput
                value={descInput}
                onChangeText={setDescInput}
                multiline
                numberOfLines={3}
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14, minHeight: 60 }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEdit} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Project Modal (3-Step Irreversible Deletion Standard) */}
      <Modal visible={isDeleteModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.8)", justifyContent: "center", alignItems: "center", padding: 16 }}>
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "rgba(239, 68, 68, 0.4)",
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              width: "100%",
              maxWidth: 450,
              maxHeight: "90%",
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontSize: 17, fontWeight: "bold" }}>Delete Novel Project</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 12 }}>
              {/* Step 1: Scope & Impact Assessment */}
              <View style={{ backgroundColor: "#18181b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 }}>
                <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "bold" }}>
                  Step 1: Scope & Impact Assessment
                </Text>
                <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
                  Permanently destroys <Text style={{ color: "#fafafa", fontWeight: "bold" }}>{activeProject?.name}</Text> along with:
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  <View style={{ backgroundColor: "#27272a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>{state.chapters.length} Chapters</Text>
                  </View>
                  <View style={{ backgroundColor: "#27272a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>{state.scenes.length} Scenes</Text>
                  </View>
                  <View style={{ backgroundColor: "#27272a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>{state.entities.length} Entities</Text>
                  </View>
                  <View style={{ backgroundColor: "#27272a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>{state.blueprints.length} Blueprints</Text>
                  </View>
                  <View style={{ backgroundColor: "#27272a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>{state.timelineEvents.length} Timeline Events</Text>
                  </View>
                </View>
              </View>

              {/* Step 2: Irreversibility Acknowledgment */}
              <TouchableOpacity
                onPress={() => setIsDeleteAcknowledged(!isDeleteAcknowledged)}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  backgroundColor: isDeleteAcknowledged ? "rgba(239, 68, 68, 0.1)" : "#18181b",
                  borderColor: isDeleteAcknowledged ? "rgba(239, 68, 68, 0.4)" : "#27272a",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: isDeleteAcknowledged ? "#ef4444" : "#71717a",
                    backgroundColor: isDeleteAcknowledged ? "#ef4444" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  {isDeleteAcknowledged && <CheckCircle2 size={14} color="#ffffff" />}
                </View>
                <Text style={{ color: "#fafafa", fontSize: 12, flex: 1, lineHeight: 16 }}>
                  <Text style={{ fontWeight: "bold" }}>Step 2: </Text>I acknowledge that this action cannot be undone and permanently destroys all prose and world lore.
                </Text>
              </TouchableOpacity>

              {/* Step 3: Exact Title Verification */}
              <View style={{ gap: 4 }}>
                <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "bold" }}>
                  Step 3: Type project title to verify
                </Text>
                <Text style={{ color: "#71717a", fontSize: 11 }}>
                  Type <Text style={{ color: "#fafafa", fontFamily: "monospace" }}>{activeProject?.name}</Text> below:
                </Text>
                <TextInput
                  value={deleteConfirmTitle}
                  onChangeText={setDeleteConfirmTitle}
                  placeholder={activeProject?.name || "Project title"}
                  placeholderTextColor="#71717a"
                  style={{
                    backgroundColor: "#09090b",
                    borderColor: isDeleteTitleMatched ? "#22c55e" : "#27272a",
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 10,
                    color: "#fafafa",
                    fontSize: 13,
                  }}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setIsDeleteModalOpen(false)}
                style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, minHeight: 44, justifyContent: "center" }}
              >
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={!isDeleteReady}
                style={{
                  backgroundColor: isDeleteReady ? "#ef4444" : "rgba(239, 68, 68, 0.3)",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: isDeleteReady ? "#ffffff" : "#a1a1aa", fontSize: 13, fontWeight: "bold" }}>
                  Delete Project Forever
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
