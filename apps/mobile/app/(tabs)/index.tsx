import React, { useSyncExternalStore, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { mobileStore } from "../../src/lib/mobileStore.ts";
import { EmptyState } from "../../src/components/EmptyState.tsx";
import {
  Sparkles,
  Plus,
  BookOpen,
  Globe2,
  Folder,
  FolderPlus,
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
    () => mobileStore.getState(),
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [descInput, setDescInput] = useState("");

  const [isDeleteAcknowledged, setIsDeleteAcknowledged] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");

  const activeProject = mobileStore.getActiveProject();
  const totalWords = mobileStore.getTotalWordCount();
  const readingTimeMin = mobileStore.getReadingTimeMin();
  const chapters = mobileStore.getChaptersForActiveProject();
  const entities = mobileStore.getEntities();

  const isDeleteTitleMatched = activeProject
    ? deleteConfirmTitle.trim() === activeProject.name
    : false;
  const isDeleteReady = isDeleteAcknowledged && isDeleteTitleMatched;

  function openCreate() {
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
    setIsDeleteAcknowledged(false);
    setDeleteConfirmTitle("");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#09090b" }}
      contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 16 }}
    >
      {/* Top Hero Section (Faithfully Recreated from web +page.svelte) */}
      <View style={{ alignItems: "center", paddingVertical: 12, gap: 8 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "#121215",
            borderColor: "#27272a",
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#7c3aed",
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 42, height: 42, borderRadius: 10 }}
            resizeMode="contain"
          />
        </View>

        <Text
          style={{
            color: "#fafafa",
            fontSize: isTabletOrWide ? 26 : 20,
            fontWeight: "800",
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          NovWrite Authoring Workspace
        </Text>

        <Text
          style={{
            color: "#a1a1aa",
            fontSize: 13,
            textAlign: "center",
            lineHeight: 18,
            maxWidth: 500,
          }}
        >
          Professional fictional universe design studio powered by deterministic
          event folding, 1st-Class Blueprints, AST formulas, and causal timeline
          auditing.
        </Text>

        {/* Active Project Pill or Zero Project CTA */}
        {activeProject ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#1e1e24",
              borderColor: "#27272a",
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              marginTop: 4,
            }}
          >
            <Folder size={14} color="#7c3aed" />
            <Text style={{ color: "#fafafa", fontSize: 12 }}>
              Active Novel:{" "}
              <Text style={{ fontWeight: "bold" }}>{activeProject.name}</Text>
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
              ({activeProject.genre || "Fiction"})
            </Text>
            <TouchableOpacity onPress={openEdit} style={{ padding: 2 }}>
              <Pencil size={12} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={openCreate}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#7c3aed",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              marginTop: 4,
            }}
          >
            <Plus size={14} color="#ffffff" />
            <Text
              style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
            >
              Create Your First Novel Project
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2 Core Studio Cards (Faithfully Recreated from web +page.svelte) */}
      <View
        style={{ gap: 12, flexDirection: isTabletOrWide ? "row" : "column" }}
      >
        {/* Prose Studio Card */}
        <TouchableOpacity
          onPress={() => router.push("/novel")}
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
          <View style={{ gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: "rgba(124, 58, 237, 0.12)",
                borderColor: "rgba(124, 58, 237, 0.25)",
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={20} color="#7c3aed" />
            </View>
            <Text
              style={{ color: "#fafafa", fontSize: 17, fontWeight: "bold" }}
            >
              Prose Studio
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
              Dedicated novel writing canvas, rich text editor, manuscript
              hierarchy tree, lore lookup drawer, and collaborative scene
              leases.
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderTopWidth: 1,
              borderTopColor: "#27272a",
              paddingTop: 10,
            }}
          >
            <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "600" }}>
              Open Studio
            </Text>
            <ArrowRight size={14} color="#7c3aed" />
          </View>
        </TouchableOpacity>

        {/* World Studio Card */}
        <TouchableOpacity
          onPress={() => router.push("/world")}
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
          <View style={{ gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: "rgba(220, 38, 38, 0.12)",
                borderColor: "rgba(220, 38, 38, 0.25)",
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Globe2 size={20} color="#dc2626" />
            </View>
            <Text
              style={{ color: "#fafafa", fontSize: 17, fontWeight: "bold" }}
            >
              World Studio
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
              1st-Class Blueprint Archetypes, 2nd-Class Sub-Schemas, AST Math
              Formulas, Causal Timeline, Invariant Rules, and Continuity
              Violation Audit.
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderTopWidth: 1,
              borderTopColor: "#27272a",
              paddingTop: 10,
            }}
          >
            <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>
              Open Studio
            </Text>
            <ArrowRight size={14} color="#dc2626" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Active Project Telemetry & Management Hero */}
      {activeProject && (
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
                <Text
                  style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "600" }}
                >
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openDelete}
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
                <Text
                  style={{ color: "#ef4444", fontSize: 11, fontWeight: "600" }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={{
              color: "#fafafa",
              fontSize: isTabletOrWide ? 20 : 16,
              fontWeight: "bold",
            }}
          >
            {activeProject?.name || "Untitled Novel"}
          </Text>

          <Text
            style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}
            numberOfLines={3}
          >
            {activeProject?.description ||
              "No universe synopsis provided yet. Define your world canon and write captivating prose."}
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
              <Text
                style={{
                  color: "#a1a1aa",
                  fontSize: 10,
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
              >
                Words
              </Text>
              <Text
                style={{
                  color: "#fafafa",
                  fontSize: 15,
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
                  fontSize: 15,
                  fontWeight: "bold",
                  marginTop: 2,
                }}
              >
                {chapters.length}
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
                Entities
              </Text>
              <Text
                style={{
                  color: "#fafafa",
                  fontSize: 15,
                  fontWeight: "bold",
                  marginTop: 2,
                }}
              >
                {entities.length}
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
                Read Time
              </Text>
              <Text
                style={{
                  color: "#fafafa",
                  fontSize: 15,
                  fontWeight: "bold",
                  marginTop: 2,
                }}
              >
                {readingTimeMin}m
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Projects List Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Folder size={18} color="#7c3aed" />
          <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>
            Your Novel Projects
          </Text>
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
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>
            New Project
          </Text>
        </TouchableOpacity>
      </View>

      {/* Projects Grid List */}
      {state.projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No Novel Projects Found"
          description="Create your first novel project workspace to begin drafting prose, designing blueprints, and maintaining causal lore."
          actionText="Create Your First Novel Project"
          onAction={openCreate}
        />
      ) : (
        <View
          style={{
            gap: 10,
            flexDirection: isTabletOrWide ? "row" : "column",
            flexWrap: "wrap",
          }}
        >
          {state.projects.map((proj) => {
            const isActive = proj.id === state.activeProjectId;
            return (
              <TouchableOpacity
                key={proj.id}
                onPress={() => mobileStore.setActiveProject(proj.id)}
                style={{
                  width: isTabletOrWide ? "48%" : "100%",
                  backgroundColor: isActive
                    ? "rgba(124, 58, 237, 0.12)"
                    : "#121215",
                  borderColor: isActive ? "#7c3aed" : "#27272a",
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 14,
                  gap: 8,
                  minHeight: 44,
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

                <Text
                  style={{ color: "#a1a1aa", fontSize: 12 }}
                  numberOfLines={2}
                >
                  {proj.description || proj.genre || "Creative Fiction"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Edit Project Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
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
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Edit Project Details
            </Text>
            <View style={{ gap: 4 }}>
              <Text
                style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}
              >
                Novel Title *
              </Text>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
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
              <Text
                style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}
              >
                Genre / Setting
              </Text>
              <TextInput
                value={genreInput}
                onChangeText={setGenreInput}
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
              <Text
                style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}
              >
                Synopsis
              </Text>
              <TextInput
                value={descInput}
                onChangeText={setDescInput}
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={{
                  backgroundColor: "#27272a",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                style={{
                  backgroundColor: "#7c3aed",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Project Modal (3-Step Irreversible Deletion Standard) */}
      <Modal visible={isDeleteModalOpen} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Trash2 size={20} color="#ef4444" />
              <Text
                style={{ color: "#ef4444", fontSize: 17, fontWeight: "bold" }}
              >
                Delete Novel Project
              </Text>
            </View>

            <ScrollView
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ gap: 12 }}
            >
              {/* Step 1: Scope & Impact Assessment */}
              <View
                style={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  gap: 6,
                }}
              >
                <Text
                  style={{ color: "#fafafa", fontSize: 12, fontWeight: "bold" }}
                >
                  Step 1: Scope & Impact Assessment
                </Text>
                <Text
                  style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}
                >
                  Permanently destroys{" "}
                  <Text style={{ color: "#fafafa", fontWeight: "bold" }}>
                    {activeProject?.name}
                  </Text>{" "}
                  along with:
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#27272a",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                      {state.chapters.length} Chapters
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#27272a",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                      {state.scenes.length} Scenes
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#27272a",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                      {state.entities.length} Entities
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#27272a",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                      {state.blueprints.length} Blueprints
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#27272a",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                      {state.timelineEvents.length} Timeline Events
                    </Text>
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
                  backgroundColor: isDeleteAcknowledged
                    ? "rgba(239, 68, 68, 0.1)"
                    : "#18181b",
                  borderColor: isDeleteAcknowledged
                    ? "rgba(239, 68, 68, 0.4)"
                    : "#27272a",
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
                    backgroundColor: isDeleteAcknowledged
                      ? "#ef4444"
                      : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  {isDeleteAcknowledged && (
                    <CheckCircle2 size={14} color="#ffffff" />
                  )}
                </View>
                <Text
                  style={{
                    color: "#fafafa",
                    fontSize: 12,
                    flex: 1,
                    lineHeight: 16,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>Step 2: </Text>I
                  acknowledge that this action cannot be undone and permanently
                  destroys all prose and world lore.
                </Text>
              </TouchableOpacity>

              {/* Step 3: Exact Title Verification */}
              <View style={{ gap: 4 }}>
                <Text
                  style={{ color: "#fafafa", fontSize: 12, fontWeight: "bold" }}
                >
                  Step 3: Type project title to verify
                </Text>
                <Text style={{ color: "#71717a", fontSize: 11 }}>
                  Type{" "}
                  <Text style={{ color: "#fafafa", fontFamily: "monospace" }}>
                    {activeProject?.name}
                  </Text>{" "}
                  below:
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

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsDeleteModalOpen(false)}
                style={{
                  backgroundColor: "#27272a",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={!isDeleteReady}
                style={{
                  backgroundColor: isDeleteReady
                    ? "#ef4444"
                    : "rgba(239, 68, 68, 0.3)",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: isDeleteReady ? "#ffffff" : "#a1a1aa",
                    fontSize: 13,
                    fontWeight: "bold",
                  }}
                >
                  Delete Project Forever
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
