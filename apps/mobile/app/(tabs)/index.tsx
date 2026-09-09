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
import { useRouter } from "expo-router";
import { mobileStore } from "../../src/lib/mobileStore.ts";
import {
  Sparkles,
  Plus,
  BookOpen,
  Globe2,
  Folder,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react-native";

export default function ProjectsScreen() {
  const router = useRouter();
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [descInput, setDescInput] = useState("");

  const activeProject = mobileStore.getActiveProject();
  const totalWords = mobileStore.getTotalWordCount();
  const readingTimeMin = mobileStore.getReadingTimeMin();
  const chapters = mobileStore.getChaptersForActiveProject();
  const entities = mobileStore.getEntities();

  function openCreate() {
    setNameInput("");
    setGenreInput("");
    setDescInput("");
    setIsCreateModalOpen(true);
  }

  function openEdit() {
    if (!activeProject) return;
    setNameInput(activeProject.name);
    setGenreInput(activeProject.genre || "");
    setDescInput(activeProject.description || "");
    setIsEditModalOpen(true);
  }

  function handleCreate() {
    if (!nameInput.trim()) return;
    mobileStore.createProject({
      name: nameInput.trim(),
      genre: genreInput.trim() || undefined,
      description: descInput.trim() || undefined,
    });
    setIsCreateModalOpen(false);
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
    if (!activeProject) return;
    mobileStore.deleteProject(activeProject.id);
    setIsDeleteModalOpen(false);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#09090b" }}
      contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
    >
      {/* Active Project Hero Card (Formula Matched to Web) */}
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
              {activeProject?.genre || "Creative Fiction"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={openEdit}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#1e1e24",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Pencil size={12} color="#a1a1aa" />
              <Text style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "600" }}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsDeleteModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Trash2 size={12} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: "600" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{ color: "#fafafa", fontSize: isTabletOrWide ? 22 : 18, fontWeight: "bold" }}>
          {activeProject?.name || "Untitled Novel"}
        </Text>

        <Text style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
          {activeProject?.description || "No universe synopsis provided yet. Define your world canon and write captivating prose."}
        </Text>

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
            <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
              Words
            </Text>
            <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold", marginTop: 2 }}>
              {totalWords.toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
              Chapters
            </Text>
            <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold", marginTop: 2 }}>
              {chapters.length}
            </Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
              Entities
            </Text>
            <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold", marginTop: 2 }}>
              {entities.length}
            </Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>
              Read Time
            </Text>
            <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold", marginTop: 2 }}>
              {readingTimeMin}m
            </Text>
          </View>
        </View>

        {/* Quick Launch Action Buttons */}
        <View style={{ flexDirection: "row", gap: 10, paddingTop: 4 }}>
          <TouchableOpacity
            onPress={() => router.push("/novel")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: "#7c3aed",
              paddingVertical: 10,
              borderRadius: 8,
              minHeight: 44,
            }}
          >
            <BookOpen size={16} color="#ffffff" />
            <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Prose Studio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/world")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: "#1e1e24",
              borderColor: "#27272a",
              borderWidth: 1,
              paddingVertical: 10,
              borderRadius: 8,
              minHeight: 44,
            }}
          >
            <Globe2 size={16} color="#7c3aed" />
            <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "bold" }}>World Studio</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Projects List Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Folder size={18} color="#7c3aed" />
          <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Your Novel Projects</Text>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#7c3aed",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            minHeight: 40,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>New Project</Text>
        </TouchableOpacity>
      </View>

      {/* Projects Grid List */}
      <View style={{ gap: 10, flexDirection: isTabletOrWide ? "row" : "column", flexWrap: "wrap" }}>
        {state.projects.map((proj) => {
          const isActive = proj.id === state.activeProjectId;
          return (
            <TouchableOpacity
              key={proj.id}
              onPress={() => mobileStore.setActiveProject(proj.id)}
              style={{
                width: isTabletOrWide ? "48%" : "100%",
                backgroundColor: isActive ? "rgba(124, 58, 237, 0.12)" : "#121215",
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

              <Text style={{ color: "#a1a1aa", fontSize: 12 }} numberOfLines={2}>
                {proj.description || proj.genre || "Creative Fiction"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Create Project Modal */}
      <Modal visible={isCreateModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Create Novel Project</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Novel Title *</Text>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="e.g. Whispers of the Star Sea"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Genre / Setting</Text>
              <TextInput
                value={genreInput}
                onChangeText={setGenreInput}
                placeholder="e.g. Space Opera / Sci-Fi"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Synopsis</Text>
              <TextInput
                value={descInput}
                onChangeText={setDescInput}
                placeholder="Brief universe setting and core premise..."
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={3}
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14, minHeight: 60 }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Create</Text>
              </TouchableOpacity>
            </View>
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

      {/* Delete Project Modal */}
      <Modal visible={isDeleteModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "rgba(239, 68, 68, 0.4)", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#ef4444", fontSize: 16, fontWeight: "bold" }}>Delete Project</Text>
            <Text style={{ color: "#fafafa", fontSize: 13, lineHeight: 18 }}>
              Are you sure you want to delete <Text style={{ fontWeight: "bold" }}>{activeProject?.name}</Text>? All chapters, scenes, and associated entities will be removed.
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setIsDeleteModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={{ backgroundColor: "#ef4444", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Delete Permanently</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

