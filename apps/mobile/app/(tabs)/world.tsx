import React, { useSyncExternalStore, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { mobileStore } from "../../src/lib/mobileStore.ts";
import { EmptyState } from "../../src/components/EmptyState.tsx";
import { Pagination } from "../../src/components/Pagination.tsx";
import type {
  BlueprintClass,
  BlueprintDef,
  BlueprintFieldType,
  DynamicFieldDef,
  EffectOperation,
  EntityItem,
  InvariantRuleItem,
  ContinuityViolationItem,
  RuleSeverity,
  RuleType,
  TimelineEffectItem,
  TimelineEventItem,
} from "../../src/lib/types.ts";
import {
  Globe2,
  Users,
  LayoutTemplate,
  Clock,
  ShieldCheck,
  AlertOctagon,
  Search,
  Plus,
  Trash2,
  Edit3,
  ArrowRight,
  AlertTriangle,
  Layers,
  Calculator,
  History,
  Cpu,
  RefreshCw,
  Eye,
  Boxes,
  User,
  Sword,
  MapPin,
  CheckCircle2,
  Sparkles,
  Sliders,
  Check,
  X,
  Lock,
  Code,
} from "lucide-react-native";

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

  // ==========================================
  // Entities Tab State
  // ==========================================
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [selectedBlueprintFilter, setSelectedBlueprintFilter] =
    useState<string>("ALL");
  const [entityPage, setEntityPage] = useState(1);
  const pageSize = 10;
  const [entityToDelete, setEntityToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ==========================================
  // Schemas Tab State
  // ==========================================
  const [schemaSearchQuery, setSchemaSearchQuery] = useState("");
  const [schemaClassFilter, setSchemaClassFilter] = useState<
    "ALL" | "FIRST_CLASS" | "SECOND_CLASS"
  >("ALL");
  const [schemaPage, setSchemaPage] = useState(1);
  const [bpToDelete, setBpToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ==========================================
  // Timeline Tab State
  // ==========================================
  const [timelineMode, setTimelineMode] = useState<
    "narrative" | "chronological"
  >("narrative");
  const [timelinePage, setTimelinePage] = useState(1);
  const [scrubSequence, setScrubSequence] = useState<number>(100);
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(true);
  const [eventToDelete, setEventToDelete] = useState<TimelineEventItem | null>(
    null,
  );

  // ==========================================
  // Rules Tab State
  // ==========================================
  const [rulesSearchQuery, setRulesSearchQuery] = useState("");
  const [rulesSeverityFilter, setRulesSeverityFilter] = useState<string>("ALL");
  const [rulesPage, setRulesPage] = useState(1);
  const [ruleToDelete, setRuleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ==========================================
  // Continuity Audit Tab State
  // ==========================================
  const [auditStatusFilter, setAuditStatusFilter] = useState<
    "ALL" | "ACTIVE" | "OVERRIDDEN"
  >("ALL");
  const [auditPage, setAuditPage] = useState(1);
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

  function getEntityIcon(category: string) {
    const lower = (category || "").toLowerCase();
    if (lower.includes("char")) return User;
    if (
      lower.includes("relic") ||
      lower.includes("weapon") ||
      lower.includes("art")
    )
      return Sword;
    if (
      lower.includes("loc") ||
      lower.includes("geo") ||
      lower.includes("cosmo")
    )
      return MapPin;
    return Boxes;
  }

  // ==========================================
  // Entities Handlers & Derived Data
  // ==========================================
  const filteredEntities = entities.filter((e) => {
    const matchBp =
      selectedBlueprintFilter === "ALL" ||
      e.blueprintId === selectedBlueprintFilter;
    const q = entitySearchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q);
    return matchBp && matchSearch;
  });
  const totalEntityPages = Math.max(
    1,
    Math.ceil(filteredEntities.length / pageSize),
  );
  const paginatedEntities = filteredEntities.slice(
    (entityPage - 1) * pageSize,
    entityPage * pageSize,
  );

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

  // ==========================================
  // Schemas Handlers & Derived Data
  // ==========================================
  const filteredBlueprints = blueprints.filter((b) => {
    const matchClass =
      schemaClassFilter === "ALL" || b.blueprintClass === schemaClassFilter;
    const q = schemaSearchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      (b.description || "").toLowerCase().includes(q);
    return matchClass && matchSearch;
  });
  const totalSchemaPages = Math.max(
    1,
    Math.ceil(filteredBlueprints.length / pageSize),
  );
  const paginatedBlueprints = filteredBlueprints.slice(
    (schemaPage - 1) * pageSize,
    schemaPage * pageSize,
  );

  function openCreateBlueprint() {
    router.push("/world/blueprints/create");
  }

  function openEditBlueprint(bp: BlueprintDef) {
    router.push(`/world/blueprints/${bp.id}`);
  }

  // ==========================================
  // Timeline Handlers & Derived Data
  // ==========================================
  const sortedTimelineEvents = [...timelineEvents].sort((a, b) =>
    timelineMode === "narrative"
      ? a.narrativeSequenceNumber - b.narrativeSequenceNumber
      : a.chronologicalOrder - b.chronologicalOrder,
  );
  const totalTimelinePages = Math.max(
    1,
    Math.ceil(sortedTimelineEvents.length / pageSize),
  );
  const paginatedEvents = sortedTimelineEvents.slice(
    (timelinePage - 1) * pageSize,
    timelinePage * pageSize,
  );

  const foldedEntitiesAtScrub = mobileStore.getFoldedEntitiesAtSequence(
    scrubSequence,
    timelineMode,
  );

  function openCreateEvent() {
    router.push("/world/events/create");
  }

  function openEditEvent(ev: TimelineEventItem) {
    router.push(`/world/events/${ev.id}`);
  }

  // ==========================================
  // Rules Handlers & Derived Data
  // ==========================================
  const filteredRules = rules.filter((r) => {
    const matchSev =
      rulesSeverityFilter === "ALL" || r.severity === rulesSeverityFilter;
    const q = rulesSearchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q);
    return matchSev && matchSearch;
  });
  const totalRulesPages = Math.max(
    1,
    Math.ceil(filteredRules.length / pageSize),
  );
  const paginatedRules = filteredRules.slice(
    (rulesPage - 1) * pageSize,
    rulesPage * pageSize,
  );
  const blockingRulesCount = rules.filter(
    (r) => r.severity === "BLOCKING_ERROR",
  ).length;
  const warningRulesCount = rules.filter(
    (r) => r.severity === "WARNING",
  ).length;
  const activeRulesCount = rules.filter((r) => r.enabled).length;

  function openCreateRule() {
    router.push("/world/rules/create");
  }

  function openEditRule(r: InvariantRuleItem) {
    router.push(`/world/rules/${r.id}`);
  }

  // ==========================================
  // Continuity Audit Handlers & Derived Data
  // ==========================================
  const filteredViolations = violations.filter((v) => {
    if (auditStatusFilter === "ACTIVE") return !v.overridden;
    if (auditStatusFilter === "OVERRIDDEN") return !!v.overridden;
    return true;
  });
  const totalAuditPages = Math.max(
    1,
    Math.ceil(filteredViolations.length / pageSize),
  );
  const paginatedViolations = filteredViolations.slice(
    (auditPage - 1) * pageSize,
    auditPage * pageSize,
  );
  const activeBlockingViolations = violations.filter(
    (v) => !v.overridden && v.severity === "BLOCKING_ERROR",
  ).length;
  const activeWarningViolations = violations.filter(
    (v) => !v.overridden && v.severity === "WARNING",
  ).length;
  const overriddenViolations = violations.filter((v) => !!v.overridden).length;

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

      {/* ========================================== */}
      {/* 1. OVERVIEW SUB-TAB */}
      {/* ========================================== */}
      {activeTab === "OVERVIEW" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 14 }}
        >
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 12,
              padding: isTabletOrWide ? 20 : 16,
              gap: 8,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Globe2 size={16} color="#7c3aed" />
              <Text
                style={{
                  color: "#7c3aed",
                  fontSize: 11,
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                World Studio Workspace
              </Text>
            </View>
            <Text
              style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
            >
              {activeProject.name}
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
              {activeProject.genre || "Creative Project"} ·{" "}
              {activeProject.description ||
                "Universe lore specifications and causal tracking."}
            </Text>
          </View>

          <View style={{ gap: 4 }}>
            <Text
              style={{ color: "#fafafa", fontSize: 14, fontWeight: "bold" }}
            >
              World Studio Workbenches
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
              Select a domain workbench to inspect and manage dynamic lore
              specifications.
            </Text>
          </View>

          <View
            style={{
              gap: 12,
              flexDirection: isTabletOrWide ? "row" : "column",
              flexWrap: "wrap",
            }}
          >
            {/* Universe Entities Card */}
            <TouchableOpacity
              onPress={() => setActiveTab("ENTITIES")}
              style={{
                width: isTabletOrWide ? "48%" : "100%",
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Users size={18} color="#2dd4bf" />
                <Text
                  style={{ color: "#2dd4bf", fontSize: 15, fontWeight: "bold" }}
                >
                  Universe Entities
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
                Instantiate characters, factions, artifacts, and regions with
                custom per-blueprint table columns and live formula evaluations.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{ color: "#2dd4bf", fontSize: 12, fontWeight: "bold" }}
                >
                  View Entities ({entities.length})
                </Text>
                <ArrowRight size={13} color="#2dd4bf" />
              </View>
            </TouchableOpacity>

            {/* Blueprints Card */}
            <TouchableOpacity
              onPress={() => setActiveTab("SCHEMAS")}
              style={{
                width: isTabletOrWide ? "48%" : "100%",
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <LayoutTemplate size={18} color="#38bdf8" />
                <Text
                  style={{ color: "#38bdf8", fontSize: 15, fontWeight: "bold" }}
                >
                  Blueprints & Schemas
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
                Architect 1st-Class archetypes (Characters, Relics) and
                2nd-Class sub-schemas (Cultivation Ladders, Affection Gauges,
                Math Formulas).
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{ color: "#38bdf8", fontSize: 12, fontWeight: "bold" }}
                >
                  Manage Blueprints ({blueprints.length})
                </Text>
                <ArrowRight size={13} color="#38bdf8" />
              </View>
            </TouchableOpacity>

            {/* Timeline Card */}
            <TouchableOpacity
              onPress={() => setActiveTab("TIMELINE")}
              style={{
                width: isTabletOrWide ? "48%" : "100%",
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Clock size={18} color="#7c3aed" />
                <Text
                  style={{ color: "#7c3aed", fontSize: 15, fontWeight: "bold" }}
                >
                  Causal Timeline
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
                Dual-index causal delta event stream: narrative reading sequence
                vs universe chronological order with time-travel state scrubber.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}
                >
                  Open Timeline ({timelineEvents.length})
                </Text>
                <ArrowRight size={13} color="#7c3aed" />
              </View>
            </TouchableOpacity>

            {/* Invariant Rules Card */}
            <TouchableOpacity
              onPress={() => setActiveTab("RULES")}
              style={{
                width: isTabletOrWide ? "48%" : "100%",
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ShieldCheck size={18} color="#f59e0b" />
                <Text
                  style={{ color: "#f59e0b", fontSize: 15, fontWeight: "bold" }}
                >
                  Invariant Rules
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
                Author-defined universe boundary laws (numeric bounds, dead
                entity action restrictions, prerequisites, formula clamps).
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{ color: "#f59e0b", fontSize: 12, fontWeight: "bold" }}
                >
                  Rules Builder ({rules.length})
                </Text>
                <ArrowRight size={13} color="#f59e0b" />
              </View>
            </TouchableOpacity>

            {/* Continuity Audit Card */}
            <TouchableOpacity
              onPress={() => setActiveTab("AUDIT")}
              style={{
                width: isTabletOrWide ? "48%" : "100%",
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <AlertOctagon size={18} color="#ef4444" />
                <Text
                  style={{ color: "#ef4444", fontSize: 15, fontWeight: "bold" }}
                >
                  Continuity Audit
                </Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
                Live contradiction detector comparing drafted scenes against
                causal state fold graphs with RFC 7807 problem details.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{ color: "#ef4444", fontSize: 12, fontWeight: "bold" }}
                >
                  Audit Console ({violations.length})
                </Text>
                <ArrowRight size={13} color="#ef4444" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* 2. ENTITIES SUB-TAB */}
      {/* ========================================== */}
      {activeTab === "ENTITIES" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <View>
              <Text
                style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
              >
                Universe Entities
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                Dynamic character, relic, and faction instances.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openCreateEntity()}
              style={{
                backgroundColor: "#7c3aed",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
              >
                Instantiate
              </Text>
            </TouchableOpacity>
          </View>

          {firstClassBlueprints.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No 1st-Class Blueprints Found"
              description="Create a 1st-Class Blueprint schema (e.g. Cultivator, Relic, Region) before instantiating entities."
              actionText="+ Architect Blueprint"
              onAction={() => {
                openCreateBlueprint();
                setActiveTab("SCHEMAS");
              }}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {/* Search & Blueprint Filter */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#121215",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  minHeight: 44,
                }}
              >
                <Search size={16} color="#71717a" />
                <TextInput
                  value={entitySearchQuery}
                  onChangeText={(t) => {
                    setEntitySearchQuery(t);
                    setEntityPage(1);
                  }}
                  placeholder="Search entities by name or description..."
                  placeholderTextColor="#71717a"
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    color: "#fafafa",
                    fontSize: 13,
                  }}
                />
              </View>

              {/* Blueprint Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBlueprintFilter("ALL");
                    setEntityPage(1);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor:
                      selectedBlueprintFilter === "ALL"
                        ? "rgba(124, 58, 237, 0.2)"
                        : "#18181b",
                    borderColor:
                      selectedBlueprintFilter === "ALL" ? "#7c3aed" : "#27272a",
                    borderWidth: 1,
                    minHeight: 32,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedBlueprintFilter === "ALL"
                          ? "#7c3aed"
                          : "#a1a1aa",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    All Schemas
                  </Text>
                </TouchableOpacity>
                {firstClassBlueprints.map((bp) => (
                  <TouchableOpacity
                    key={bp.id}
                    onPress={() => {
                      setSelectedBlueprintFilter(bp.id);
                      setEntityPage(1);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor:
                        selectedBlueprintFilter === bp.id
                          ? "rgba(45, 212, 191, 0.2)"
                          : "#18181b",
                      borderColor:
                        selectedBlueprintFilter === bp.id
                          ? "#2dd4bf"
                          : "#27272a",
                      borderWidth: 1,
                      minHeight: 32,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          selectedBlueprintFilter === bp.id
                            ? "#2dd4bf"
                            : "#a1a1aa",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {bp.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Standard 10-Item Pagination at TOP */}
              {filteredEntities.length > 0 && (
                <Pagination
                  currentPage={entityPage}
                  totalPages={totalEntityPages}
                  totalItems={filteredEntities.length}
                  pageSize={pageSize}
                  onPageChange={setEntityPage}
                />
              )}

              {/* Entity Cards List */}
              {filteredEntities.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Entities Found"
                  description={
                    entitySearchQuery
                      ? "No entities matched your search filters."
                      : "No universe entities instantiated yet."
                  }
                  actionText="+ Instantiate Entity"
                  onAction={() => openCreateEntity()}
                />
              ) : (
                paginatedEntities.map((ent) => {
                  const bp = blueprints.find((b) => b.id === ent.blueprintId);
                  const IconComp = getEntityIcon(ent.category);
                  const formulaEvals = mobileStore.evaluateEntityFormulas(
                    ent.id,
                  );

                  return (
                    <View
                      key={ent.id}
                      style={{
                        backgroundColor: "#121215",
                        borderColor: "#27272a",
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 14,
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            flex: 1,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: "rgba(45, 212, 191, 0.1)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <IconComp size={16} color="#2dd4bf" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: "#fafafa",
                                fontSize: 15,
                                fontWeight: "bold",
                              }}
                            >
                              {ent.name}
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                gap: 6,
                                marginTop: 3,
                                flexWrap: "wrap",
                              }}
                            >
                              <View
                                style={{
                                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#38bdf8",
                                    fontSize: 10,
                                    fontWeight: "bold",
                                  }}
                                >
                                  {bp?.name || "Custom"}
                                </Text>
                              </View>
                              <View
                                style={{
                                  backgroundColor: "#27272a",
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{ color: "#a1a1aa", fontSize: 10 }}
                                >
                                  {ent.category}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => openEditEntity(ent)}
                            style={{
                              padding: 8,
                              borderRadius: 6,
                              backgroundColor: "#18181b",
                              minHeight: 36,
                              minWidth: 36,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Edit3 size={14} color="#a1a1aa" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              setEntityToDelete({ id: ent.id, name: ent.name })
                            }
                            style={{
                              padding: 8,
                              borderRadius: 6,
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              minHeight: 36,
                              minWidth: 36,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {ent.description ? (
                        <Text
                          style={{
                            color: "#a1a1aa",
                            fontSize: 12,
                            lineHeight: 16,
                          }}
                        >
                          {ent.description}
                        </Text>
                      ) : null}

                      {/* Dynamic Properties */}
                      {Object.keys(ent.properties || {}).length > 0 && (
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 6,
                            paddingTop: 4,
                          }}
                        >
                          {Object.entries(ent.properties).map(([key, val]) => (
                            <View
                              key={key}
                              style={{
                                backgroundColor: "#18181b",
                                borderColor: "#27272a",
                                borderWidth: 1,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                flexDirection: "row",
                                gap: 4,
                              }}
                            >
                              <Text style={{ color: "#71717a", fontSize: 11 }}>
                                {key}:
                              </Text>
                              <Text
                                style={{
                                  color: "#fafafa",
                                  fontSize: 11,
                                  fontWeight: "600",
                                }}
                              >
                                {String(val)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Evaluated Formulas */}
                      {Object.keys(formulaEvals).length > 0 && (
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 6,
                            paddingTop: 2,
                          }}
                        >
                          {Object.entries(formulaEvals).map(([fKey, fVal]) => (
                            <View
                              key={fKey}
                              style={{
                                backgroundColor: "rgba(124, 58, 237, 0.1)",
                                borderColor: "rgba(124, 58, 237, 0.3)",
                                borderWidth: 1,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Calculator size={11} color="#a78bfa" />
                              <Text style={{ color: "#a78bfa", fontSize: 11 }}>
                                {fKey}:
                              </Text>
                              <Text
                                style={{
                                  color: "#c4b5fd",
                                  fontSize: 11,
                                  fontWeight: "bold",
                                }}
                              >
                                {String(fVal)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* 3. SCHEMAS SUB-TAB */}
      {/* ========================================== */}
      {activeTab === "SCHEMAS" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <View>
              <Text
                style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
              >
                Blueprints & Schemas
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                1st-Class archetypes & 2nd-Class sub-schemas.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openCreateBlueprint()}
              style={{
                backgroundColor: "#7c3aed",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
              >
                New Blueprint
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10 }}>
            {/* Search & Class Filter */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 10,
                minHeight: 44,
              }}
            >
              <Search size={16} color="#71717a" />
              <TextInput
                value={schemaSearchQuery}
                onChangeText={(t) => {
                  setSchemaSearchQuery(t);
                  setSchemaPage(1);
                }}
                placeholder="Search blueprints..."
                placeholderTextColor="#71717a"
                style={{
                  flex: 1,
                  marginLeft: 8,
                  color: "#fafafa",
                  fontSize: 13,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity
                onPress={() => {
                  setSchemaClassFilter("ALL");
                  setSchemaPage(1);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor:
                    schemaClassFilter === "ALL"
                      ? "rgba(124, 58, 237, 0.2)"
                      : "#18181b",
                  borderColor:
                    schemaClassFilter === "ALL" ? "#7c3aed" : "#27272a",
                  borderWidth: 1,
                  minHeight: 32,
                }}
              >
                <Text
                  style={{
                    color: schemaClassFilter === "ALL" ? "#7c3aed" : "#a1a1aa",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  All Classes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSchemaClassFilter("FIRST_CLASS");
                  setSchemaPage(1);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor:
                    schemaClassFilter === "FIRST_CLASS"
                      ? "rgba(124, 58, 237, 0.2)"
                      : "#18181b",
                  borderColor:
                    schemaClassFilter === "FIRST_CLASS" ? "#7c3aed" : "#27272a",
                  borderWidth: 1,
                  minHeight: 32,
                }}
              >
                <Text
                  style={{
                    color:
                      schemaClassFilter === "FIRST_CLASS"
                        ? "#7c3aed"
                        : "#a1a1aa",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  1st-Class Archetypes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSchemaClassFilter("SECOND_CLASS");
                  setSchemaPage(1);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor:
                    schemaClassFilter === "SECOND_CLASS"
                      ? "rgba(56, 189, 248, 0.2)"
                      : "#18181b",
                  borderColor:
                    schemaClassFilter === "SECOND_CLASS"
                      ? "#38bdf8"
                      : "#27272a",
                  borderWidth: 1,
                  minHeight: 32,
                }}
              >
                <Text
                  style={{
                    color:
                      schemaClassFilter === "SECOND_CLASS"
                        ? "#38bdf8"
                        : "#a1a1aa",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  2nd-Class Sub-Schemas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Standard 10-Item Pagination at TOP */}
            {filteredBlueprints.length > 0 && (
              <Pagination
                currentPage={schemaPage}
                totalPages={totalSchemaPages}
                totalItems={filteredBlueprints.length}
                pageSize={pageSize}
                onPageChange={setSchemaPage}
              />
            )}

            {filteredBlueprints.length === 0 ? (
              <EmptyState
                icon={LayoutTemplate}
                title="No Blueprints Found"
                description={
                  schemaSearchQuery
                    ? "No blueprints match your search criteria."
                    : "Create your first Blueprint schema."
                }
                actionText="+ Architect Blueprint"
                onAction={() => openCreateBlueprint()}
              />
            ) : (
              paginatedBlueprints.map((bp) => {
                const isFirstClass = bp.blueprintClass === "FIRST_CLASS";
                return (
                  <View
                    key={bp.id}
                    style={{
                      backgroundColor: "#121215",
                      borderColor: "#27272a",
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 14,
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: "#fafafa",
                            fontSize: 15,
                            fontWeight: "bold",
                          }}
                        >
                          {bp.name}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 6,
                            marginTop: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: isFirstClass
                                ? "rgba(124, 58, 237, 0.15)"
                                : "rgba(56, 189, 248, 0.15)",
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: isFirstClass ? "#a78bfa" : "#38bdf8",
                                fontSize: 10,
                                fontWeight: "bold",
                              }}
                            >
                              {isFirstClass
                                ? "1st-Class Archetype"
                                : "2nd-Class Sub-Schema"}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: "#27272a",
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ color: "#a1a1aa", fontSize: 10 }}>
                              {bp.category}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: "#18181b",
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ color: "#71717a", fontSize: 10 }}>
                              {(bp.fields || []).length} fields
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => openEditBlueprint(bp)}
                          style={{
                            padding: 8,
                            borderRadius: 6,
                            backgroundColor: "#18181b",
                            minHeight: 36,
                            minWidth: 36,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Edit3 size={14} color="#a1a1aa" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setBpToDelete({ id: bp.id, name: bp.name })
                          }
                          style={{
                            padding: 8,
                            borderRadius: 6,
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            minHeight: 36,
                            minWidth: 36,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {bp.description ? (
                      <Text
                        style={{
                          color: "#a1a1aa",
                          fontSize: 12,
                          lineHeight: 16,
                        }}
                      >
                        {bp.description}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* 4. TIMELINE SUB-TAB */}
      {/* ========================================== */}
      {activeTab === "TIMELINE" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <View>
              <Text
                style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
              >
                Causal Timeline
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                Dual-index delta event stream & time-travel scrubber.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openCreateEvent()}
              style={{
                backgroundColor: "#7c3aed",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
              >
                Log Event
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time-Travel Scrubber Card */}
          <View
            style={{
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              gap: 10,
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
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <History size={16} color="#7c3aed" />
                <Text
                  style={{ color: "#fafafa", fontSize: 13, fontWeight: "bold" }}
                >
                  Time-Travel State Folding Scrubber
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTimeTravelOpen(!isTimeTravelOpen)}
              >
                <Text
                  style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}
                >
                  {isTimeTravelOpen ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            {isTimeTravelOpen && (
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                    Scrub Point:{" "}
                    <Text style={{ color: "#7c3aed", fontWeight: "bold" }}>
                      Seq #{scrubSequence}
                    </Text>
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() =>
                        setScrubSequence(Math.max(0, scrubSequence - 10))
                      }
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: "#18181b",
                        borderRadius: 6,
                        minHeight: 32,
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fafafa",
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        -10
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setScrubSequence(scrubSequence + 10)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: "#18181b",
                        borderRadius: 6,
                        minHeight: 32,
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fafafa",
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        +10
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(124, 58, 237, 0.08)",
                    borderColor: "rgba(124, 58, 237, 0.2)",
                    borderWidth: 1,
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#a78bfa", fontSize: 11 }}>
                    Active Universe State: {foldedEntitiesAtScrub.length}{" "}
                    dynamic entity state folds calculated at Seq #
                    {scrubSequence}.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Mode Switcher */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              onPress={() => {
                setTimelineMode("narrative");
                setTimelinePage(1);
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor:
                  timelineMode === "narrative"
                    ? "rgba(124, 58, 237, 0.2)"
                    : "#18181b",
                borderColor:
                  timelineMode === "narrative" ? "#7c3aed" : "#27272a",
                borderWidth: 1,
                alignItems: "center",
                minHeight: 36,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: timelineMode === "narrative" ? "#7c3aed" : "#a1a1aa",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              >
                Narrative Reading Order
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTimelineMode("chronological");
                setTimelinePage(1);
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor:
                  timelineMode === "chronological"
                    ? "rgba(124, 58, 237, 0.2)"
                    : "#18181b",
                borderColor:
                  timelineMode === "chronological" ? "#7c3aed" : "#27272a",
                borderWidth: 1,
                alignItems: "center",
                minHeight: 36,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color:
                    timelineMode === "chronological" ? "#7c3aed" : "#a1a1aa",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              >
                Universe Chronology
              </Text>
            </TouchableOpacity>
          </View>

          {/* Standard 10-Item Pagination at TOP */}
          {sortedTimelineEvents.length > 0 && (
            <Pagination
              currentPage={timelinePage}
              totalPages={totalTimelinePages}
              totalItems={sortedTimelineEvents.length}
              pageSize={pageSize}
              onPageChange={setTimelinePage}
            />
          )}

          {sortedTimelineEvents.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Timeline Events"
              description="Log causal mutations, entity state transitions, and narrative anchors."
              actionText="+ Log Event"
              onAction={() => openCreateEvent()}
            />
          ) : (
            paginatedEvents.map((ev) => (
              <View
                key={ev.id}
                style={{
                  backgroundColor: "#121215",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 14,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#fafafa",
                        fontSize: 15,
                        fontWeight: "bold",
                      }}
                    >
                      {ev.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        marginTop: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "rgba(124, 58, 237, 0.15)",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#a78bfa",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          Narrative Seq #{ev.narrativeSequenceNumber}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: "rgba(56, 189, 248, 0.15)",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#38bdf8",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          Chrono #{ev.chronologicalOrder}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => openEditEvent(ev)}
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: "#18181b",
                        minHeight: 36,
                        minWidth: 36,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Edit3 size={14} color="#a1a1aa" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEventToDelete(ev)}
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        minHeight: 36,
                        minWidth: 36,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {ev.description ? (
                  <Text
                    style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}
                  >
                    {ev.description}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* 5. RULES SUB-TAB */}
      {/* ========================================== */}
      {activeTab === "RULES" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <View>
              <Text
                style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
              >
                Invariant Rules
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                Universe boundary constraints & state guards.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openCreateRule()}
              style={{
                backgroundColor: "#7c3aed",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
              >
                New Rule
              </Text>
            </TouchableOpacity>
          </View>

          {/* Metric summary */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#22c55e", fontSize: 16, fontWeight: "bold" }}
              >
                {activeRulesCount}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 10 }}>
                Active Rules
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#ef4444", fontSize: 16, fontWeight: "bold" }}
              >
                {blockingRulesCount}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 10 }}>
                Blocking Invariants
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#f59e0b", fontSize: 16, fontWeight: "bold" }}
              >
                {warningRulesCount}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 10 }}>Warnings</Text>
            </View>
          </View>

          {/* Search & Severity Filter */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              minHeight: 44,
            }}
          >
            <Search size={16} color="#71717a" />
            <TextInput
              value={rulesSearchQuery}
              onChangeText={(t) => {
                setRulesSearchQuery(t);
                setRulesPage(1);
              }}
              placeholder="Search invariant rules..."
              placeholderTextColor="#71717a"
              style={{ flex: 1, marginLeft: 8, color: "#fafafa", fontSize: 13 }}
            />
          </View>

          {/* Standard 10-Item Pagination at TOP */}
          {filteredRules.length > 0 && (
            <Pagination
              currentPage={rulesPage}
              totalPages={totalRulesPages}
              totalItems={filteredRules.length}
              pageSize={pageSize}
              onPageChange={setRulesPage}
            />
          )}

          {filteredRules.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Invariant Rules"
              description={
                rulesSearchQuery
                  ? "No rules matched your search query."
                  : "Author universe boundary laws and consistency constraints."
              }
              actionText="+ Define Rule"
              onAction={() => openCreateRule()}
            />
          ) : (
            paginatedRules.map((rule) => {
              const isBlocking = rule.severity === "BLOCKING_ERROR";
              const isWarning = rule.severity === "WARNING";

              return (
                <View
                  key={rule.id}
                  style={{
                    backgroundColor: "#121215",
                    borderColor: "#27272a",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          color: "#fafafa",
                          fontSize: 15,
                          fontWeight: "bold",
                        }}
                      >
                        {rule.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: isBlocking
                              ? "rgba(239, 68, 68, 0.15)"
                              : isWarning
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(56, 189, 248, 0.15)",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: isBlocking
                                ? "#ef4444"
                                : isWarning
                                  ? "#f59e0b"
                                  : "#38bdf8",
                              fontSize: 10,
                              fontWeight: "bold",
                            }}
                          >
                            {rule.severity}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: "#27272a",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ color: "#a1a1aa", fontSize: 10 }}>
                            {rule.type}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Switch
                        value={rule.enabled}
                        onValueChange={() => mobileStore.toggleRule(rule.id)}
                        trackColor={{ false: "#27272a", true: "#7c3aed" }}
                        thumbColor="#fafafa"
                      />
                      <TouchableOpacity
                        onPress={() => openEditRule(rule)}
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          backgroundColor: "#18181b",
                          minHeight: 36,
                          minWidth: 36,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Edit3 size={14} color="#a1a1aa" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          setRuleToDelete({ id: rule.id, name: rule.name })
                        }
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          minHeight: 36,
                          minWidth: 36,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {rule.description ? (
                    <Text
                      style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}
                    >
                      {rule.description}
                    </Text>
                  ) : null}

                  {rule.predicateExpression ? (
                    <View
                      style={{
                        backgroundColor: "#18181b",
                        padding: 8,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#71717a",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                      >
                        Expression: {rule.predicateExpression}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* 6. CONTINUITY AUDIT SUB-TAB */}
      {/* ========================================== */}
      {activeTab === "AUDIT" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <View>
              <Text
                style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}
              >
                Continuity Audit
              </Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
                Contradiction detector against causal state folds.
              </Text>
            </View>
            <TouchableOpacity
              onPress={triggerAuditRun}
              disabled={isAuditing}
              style={{
                backgroundColor: "#7c3aed",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
                opacity: isAuditing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
              >
                {isAuditing ? "Auditing..." : "Run Audit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Health Summary Cards */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}
              >
                {violations.length}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 10 }}>
                Total Reports
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#ef4444", fontSize: 16, fontWeight: "bold" }}
              >
                {activeBlockingViolations}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 10 }}>Blocking</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#f59e0b", fontSize: 16, fontWeight: "bold" }}
              >
                {activeWarningViolations}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 10 }}>Warnings</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#a78bfa", fontSize: 16, fontWeight: "bold" }}
              >
                {overriddenViolations}
              </Text>
              <Text style={{ color: "#71717a", fontSize: 10 }}>Overridden</Text>
            </View>
          </View>

          {/* Status Filter */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              onPress={() => {
                setAuditStatusFilter("ALL");
                setAuditPage(1);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor:
                  auditStatusFilter === "ALL"
                    ? "rgba(124, 58, 237, 0.2)"
                    : "#18181b",
                borderColor:
                  auditStatusFilter === "ALL" ? "#7c3aed" : "#27272a",
                borderWidth: 1,
                minHeight: 32,
              }}
            >
              <Text
                style={{
                  color: auditStatusFilter === "ALL" ? "#7c3aed" : "#a1a1aa",
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                All Violations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setAuditStatusFilter("ACTIVE");
                setAuditPage(1);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor:
                  auditStatusFilter === "ACTIVE"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "#18181b",
                borderColor:
                  auditStatusFilter === "ACTIVE" ? "#ef4444" : "#27272a",
                borderWidth: 1,
                minHeight: 32,
              }}
            >
              <Text
                style={{
                  color: auditStatusFilter === "ACTIVE" ? "#ef4444" : "#a1a1aa",
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                Active Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setAuditStatusFilter("OVERRIDDEN");
                setAuditPage(1);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor:
                  auditStatusFilter === "OVERRIDDEN"
                    ? "rgba(124, 58, 237, 0.2)"
                    : "#18181b",
                borderColor:
                  auditStatusFilter === "OVERRIDDEN" ? "#7c3aed" : "#27272a",
                borderWidth: 1,
                minHeight: 32,
              }}
            >
              <Text
                style={{
                  color:
                    auditStatusFilter === "OVERRIDDEN" ? "#7c3aed" : "#a1a1aa",
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                Overridden
              </Text>
            </TouchableOpacity>
          </View>

          {/* Standard 10-Item Pagination at TOP */}
          {filteredViolations.length > 0 && (
            <Pagination
              currentPage={auditPage}
              totalPages={totalAuditPages}
              totalItems={filteredViolations.length}
              pageSize={pageSize}
              onPageChange={setAuditPage}
            />
          )}

          {filteredViolations.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Continuity Invariants Intact"
              description="Zero contradictions detected between drafted scenes and causal delta state graphs."
              actionText="Re-run Continuity Audit"
              onAction={triggerAuditRun}
            />
          ) : (
            paginatedViolations.map((viol) => {
              const isBlocking = viol.severity === "BLOCKING_ERROR";
              return (
                <View
                  key={viol.id}
                  style={{
                    backgroundColor: "#121215",
                    borderColor: viol.overridden
                      ? "#27272a"
                      : isBlocking
                        ? "rgba(239, 68, 68, 0.4)"
                        : "rgba(245, 158, 11, 0.4)",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          color: "#fafafa",
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        {viol.ruleName}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: isBlocking
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: isBlocking ? "#ef4444" : "#f59e0b",
                              fontSize: 10,
                              fontWeight: "bold",
                            }}
                          >
                            {viol.severity}
                          </Text>
                        </View>
                        {viol.overridden && (
                          <View
                            style={{
                              backgroundColor: "rgba(124, 58, 237, 0.15)",
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: "#a78bfa",
                                fontSize: 10,
                                fontWeight: "bold",
                              }}
                            >
                              Author Overridden
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <Text
                    style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}
                  >
                    {viol.message}
                  </Text>

                  {viol.overridden ? (
                    <View
                      style={{
                        backgroundColor: "#18181b",
                        padding: 8,
                        borderRadius: 6,
                        gap: 2,
                      }}
                    >
                      <Text style={{ color: "#71717a", fontSize: 10 }}>
                        Override Justification:
                      </Text>
                      <Text style={{ color: "#fafafa", fontSize: 11 }}>
                        {viol.overrideJustification || "Approved by author"}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setOverrideModalViolation(viol);
                        setOverrideJustification("");
                      }}
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "rgba(124, 58, 237, 0.15)",
                        borderColor: "rgba(124, 58, 237, 0.4)",
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        minHeight: 36,
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#7c3aed",
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        Author Override
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
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
