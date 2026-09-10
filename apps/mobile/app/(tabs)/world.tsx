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
import { EmptyState } from "../../src/components/EmptyState.tsx";
import type {
  BlueprintDef,
  EntityItem,
  InvariantRuleItem,
  ContinuityViolationItem,
  TimelineEventItem,
} from "../../src/lib/types.ts";
import {
  Globe2,
  Users,
  LayoutTemplate,
  Clock,
  ShieldCheck,
  AlertOctagon,
} from "lucide-react-native";

import { WorldOverviewTab } from "../../src/components/world/WorldOverviewTab.tsx";
import { WorldEntitiesTab } from "../../src/components/world/WorldEntitiesTab.tsx";
import { WorldBlueprintsTab } from "../../src/components/world/WorldBlueprintsTab.tsx";
import { WorldTimelineTab } from "../../src/components/world/WorldTimelineTab.tsx";
import { WorldRulesTab } from "../../src/components/world/WorldRulesTab.tsx";
import { WorldAuditTab } from "../../src/components/world/WorldAuditTab.tsx";

type WorldSubTab =
  "OVERVIEW" | "ENTITIES" | "SCHEMAS" | "TIMELINE" | "RULES" | "AUDIT";

export default function WorldStudioScreen() {
  const router = useRouter();
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState(),
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [activeTab, setActiveTab] = useState<WorldSubTab>("OVERVIEW");

  // Deletion modals state
  const [entityToDelete, setEntityToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [bpToDelete, setBpToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [eventToDelete, setEventToDelete] = useState<TimelineEventItem | null>(
    null,
  );
  const [ruleToDelete, setRuleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Continuity Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [overrideModalViolation, setOverrideModalViolation] =
    useState<ContinuityViolationItem | null>(null);
  const [overrideJustification, setOverrideJustification] = useState("");

  const activeProject = mobileStore.getActiveProject();
  const blueprints = mobileStore.getBlueprints();
  const firstClassBlueprints = mobileStore.getFirstClassBlueprints();
  const entities = mobileStore.getEntities();
  const timelineEvents = mobileStore.getTimelineEvents();
  const rules = mobileStore.getRules();
  const violations = mobileStore.getViolations();

  if (!activeProject) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#09090b",
          padding: 16,
          justifyContent: "center",
        }}
      >
        <EmptyState
          icon={Globe2}
          title="No Active Project Selected"
          description="World Studio blueprints, entities, and timelines belong strictly to a creative novel project."
          actionText="Go to Projects Hub"
          onAction={() => router.push("/")}
        />
      </View>
    );
  }

  function openCreateEntity(blueprintId?: string) {
    const targetBpId = blueprintId || firstClassBlueprints[0]?.id || "";
    router.push(
      targetBpId
        ? `/world/entities/create?blueprintId=${targetBpId}`
        : "/world/entities/create",
    );
  }

  function openEditEntity(ent: EntityItem) {
    router.push(`/world/entities/${ent.id}`);
  }

  function openCreateBlueprint() {
    router.push("/world/blueprints/create");
  }

  function openEditBlueprint(bp: BlueprintDef) {
    router.push(`/world/blueprints/${bp.id}`);
  }

  function openCreateEvent() {
    router.push("/world/events/create");
  }

  function openEditEvent(ev: TimelineEventItem) {
    router.push(`/world/events/${ev.id}`);
  }

  function openCreateRule() {
    router.push("/world/rules/create");
  }

  function openEditRule(r: InvariantRuleItem) {
    router.push(`/world/rules/${r.id}`);
  }

  function triggerAuditRun() {
    setIsAuditing(true);
    setTimeout(() => {
      mobileStore.runContinuityAudit();
      setIsAuditing(false);
    }, 400);
  }

  function handleExecuteOverride() {
    if (!overrideModalViolation || !overrideJustification.trim()) return;
    mobileStore.overrideViolation(
      overrideModalViolation.id,
      overrideJustification.trim(),
    );
    setOverrideModalViolation(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      {/* Top Sub-Navigation Tab Bar */}
      <View
        style={{
          backgroundColor: "#121215",
          borderBottomWidth: 1,
          borderBottomColor: "#27272a",
          paddingVertical: 6,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("OVERVIEW")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "OVERVIEW"
                  ? "rgba(124, 58, 237, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "OVERVIEW"
                  ? "rgba(124, 58, 237, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <Globe2
              size={14}
              color={activeTab === "OVERVIEW" ? "#7c3aed" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "OVERVIEW" ? "#7c3aed" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "OVERVIEW" ? "bold" : "500",
              }}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("ENTITIES")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "ENTITIES"
                  ? "rgba(45, 212, 191, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "ENTITIES"
                  ? "rgba(45, 212, 191, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <Users
              size={14}
              color={activeTab === "ENTITIES" ? "#2dd4bf" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "ENTITIES" ? "#2dd4bf" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "ENTITIES" ? "bold" : "500",
              }}
            >
              Entities ({entities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("SCHEMAS")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "SCHEMAS"
                  ? "rgba(56, 189, 248, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "SCHEMAS"
                  ? "rgba(56, 189, 248, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <LayoutTemplate
              size={14}
              color={activeTab === "SCHEMAS" ? "#38bdf8" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "SCHEMAS" ? "#38bdf8" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "SCHEMAS" ? "bold" : "500",
              }}
            >
              Blueprints ({blueprints.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("TIMELINE")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "TIMELINE"
                  ? "rgba(124, 58, 237, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "TIMELINE"
                  ? "rgba(124, 58, 237, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <Clock
              size={14}
              color={activeTab === "TIMELINE" ? "#7c3aed" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "TIMELINE" ? "#7c3aed" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "TIMELINE" ? "bold" : "500",
              }}
            >
              Timeline ({timelineEvents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("RULES")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "RULES"
                  ? "rgba(245, 158, 11, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "RULES"
                  ? "rgba(245, 158, 11, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <ShieldCheck
              size={14}
              color={activeTab === "RULES" ? "#f59e0b" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "RULES" ? "#f59e0b" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "RULES" ? "bold" : "500",
              }}
            >
              Rules ({rules.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("AUDIT")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                activeTab === "AUDIT"
                  ? "rgba(239, 68, 68, 0.15)"
                  : "transparent",
              borderColor:
                activeTab === "AUDIT"
                  ? "rgba(239, 68, 68, 0.4)"
                  : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <AlertOctagon
              size={14}
              color={activeTab === "AUDIT" ? "#ef4444" : "#a1a1aa"}
            />
            <Text
              style={{
                color: activeTab === "AUDIT" ? "#ef4444" : "#a1a1aa",
                fontSize: 12,
                fontWeight: activeTab === "AUDIT" ? "bold" : "500",
              }}
            >
              Audit ({violations.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sub-Tab Rendering */}
      {activeTab === "OVERVIEW" && (
        <WorldOverviewTab
          activeProject={activeProject}
          blueprints={blueprints}
          entities={entities}
          timelineEvents={timelineEvents}
          rules={rules}
          violations={violations}
          isTabletOrWide={isTabletOrWide}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === "ENTITIES" && (
        <WorldEntitiesTab
          entities={entities}
          blueprints={blueprints}
          firstClassBlueprints={firstClassBlueprints}
          isTabletOrWide={isTabletOrWide}
          onOpenCreateEntity={openCreateEntity}
          onOpenEditEntity={openEditEntity}
          onDeleteEntity={(ent) => setEntityToDelete(ent)}
          onNavigateToSchemas={() => setActiveTab("SCHEMAS")}
        />
      )}

      {activeTab === "SCHEMAS" && (
        <WorldBlueprintsTab
          blueprints={blueprints}
          isTabletOrWide={isTabletOrWide}
          onOpenCreateBlueprint={openCreateBlueprint}
          onOpenEditBlueprint={openEditBlueprint}
          onDeleteBlueprint={(bp) => setBpToDelete(bp)}
        />
      )}

      {activeTab === "TIMELINE" && (
        <WorldTimelineTab
          timelineEvents={timelineEvents}
          isTabletOrWide={isTabletOrWide}
          onOpenCreateEvent={openCreateEvent}
          onOpenEditEvent={openEditEvent}
          onDeleteEvent={(ev) => setEventToDelete(ev)}
        />
      )}

      {activeTab === "RULES" && (
        <WorldRulesTab
          rules={rules}
          isTabletOrWide={isTabletOrWide}
          onOpenCreateRule={openCreateRule}
          onOpenEditRule={openEditRule}
          onDeleteRule={(r) => setRuleToDelete(r)}
        />
      )}

      {activeTab === "AUDIT" && (
        <WorldAuditTab
          violations={violations}
          isTabletOrWide={isTabletOrWide}
          onTriggerAuditRun={triggerAuditRun}
          isAuditing={isAuditing}
          onOpenOverrideModal={(viol) => {
            setOverrideModalViolation(viol);
            setOverrideJustification("");
          }}
        />
      )}

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}

      {/* Override Modal */}
      <Modal
        visible={!!overrideModalViolation}
        transparent
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
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
              width: "100%",
              maxWidth: 450,
              gap: 12,
            }}
          >
            <Text
              style={{ color: "#fafafa", fontSize: 17, fontWeight: "bold" }}
            >
              Authoritative Continuity Override
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
              Provide an authoritative author justification to mark this
              violation as intentionally permitted lore exception.
            </Text>
            <TextInput
              value={overrideJustification}
              onChangeText={setOverrideJustification}
              placeholder="e.g. Resurrection artifact activated during secret ritual."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: "#fafafa",
                fontSize: 13,
                minHeight: 70,
                textAlignVertical: "top",
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => setOverrideModalViolation(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#18181b",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#a1a1aa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExecuteOverride}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#7c3aed",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Confirm Override
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modals */}
      <Modal visible={!!entityToDelete} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
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
              width: "100%",
              maxWidth: 400,
              gap: 12,
            }}
          >
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Delete Entity
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 13 }}>
              Are you sure you want to delete "{entityToDelete?.name}"? This
              action cannot be undone.
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setEntityToDelete(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#18181b",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#a1a1aa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (entityToDelete) {
                    mobileStore.deleteEntity(entityToDelete.id);
                    setEntityToDelete(null);
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#ef4444",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!bpToDelete} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
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
              width: "100%",
              maxWidth: 400,
              gap: 12,
            }}
          >
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Delete Blueprint
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 13 }}>
              Are you sure you want to delete blueprint "{bpToDelete?.name}"?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setBpToDelete(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#18181b",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#a1a1aa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (bpToDelete) {
                    mobileStore.deleteBlueprint(bpToDelete.id);
                    setBpToDelete(null);
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#ef4444",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!eventToDelete} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
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
              width: "100%",
              maxWidth: 400,
              gap: 12,
            }}
          >
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Delete Timeline Event
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 13 }}>
              Are you sure you want to delete event "{eventToDelete?.title}"?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setEventToDelete(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#18181b",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#a1a1aa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (eventToDelete) {
                    mobileStore.deleteTimelineEvent(eventToDelete.id);
                    setEventToDelete(null);
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#ef4444",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!ruleToDelete} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
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
              width: "100%",
              maxWidth: 400,
              gap: 12,
            }}
          >
            <Text
              style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
            >
              Delete Invariant Rule
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 13 }}>
              Are you sure you want to delete rule "{ruleToDelete?.name}"?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setRuleToDelete(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#18181b",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#a1a1aa", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (ruleToDelete) {
                    mobileStore.deleteRule(ruleToDelete.id);
                    setRuleToDelete(null);
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#ef4444",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
