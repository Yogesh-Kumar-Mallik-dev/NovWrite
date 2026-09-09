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
import { mobileStore } from "../../src/lib/mobileStore.ts";
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
  Sparkles,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react-native";

type WorldSubTab = "OVERVIEW" | "ENTITIES" | "SCHEMAS" | "TIMELINE" | "AUDIT" | "RULES";

export default function WorldStudioScreen() {
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [activeTab, setActiveTab] = useState<WorldSubTab>("OVERVIEW");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [entityPage, setEntityPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityBlueprintId, setNewEntityBlueprintId] = useState("bp-cultivator");
  const [newEntityDesc, setNewEntityDesc] = useState("");
  const [newEntityPropKey, setNewEntityPropKey] = useState("");
  const [newEntityPropVal, setNewEntityPropVal] = useState("");

  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [newBpName, setNewBpName] = useState("");
  const [newBpCategory, setNewBpCategory] = useState("Characters");
  const [newBpClass, setNewBpClass] = useState<"FIRST_CLASS" | "SECOND_CLASS">("FIRST_CLASS");
  const [newBpDesc, setNewBpDesc] = useState("");

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventEntityName, setNewEventEntityName] = useState("Eldrin Stormweaver");
  const [newEventEntityId, setNewEventEntityId] = useState("ent-eldrin");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventType, setNewEventType] = useState<"CANON_MUTATION" | "RELATION_TRANSFER" | "AFFINITY_SHIFT" | "STATE_INITIALIZATION">("CANON_MUTATION");

  const entities = mobileStore.getEntities();
  const blueprints = mobileStore.getBlueprints();
  const timelineEvents = mobileStore.getTimelineEvents();
  const invariantRules = mobileStore.getInvariantRules();
  const continuityIssues = mobileStore.getContinuityIssues();

  const categories = ["ALL", ...Array.from(new Set(entities.map((e) => e.category || "General")))];

  const filteredEntities = entities.filter((e) => {
    const matchCat = selectedCategory === "ALL" || e.category === selectedCategory;
    const matchQuery =
      !searchQuery.trim() ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  const totalEntityPages = Math.max(1, Math.ceil(filteredEntities.length / itemsPerPage));
  const paginatedEntities = filteredEntities.slice(
    (entityPage - 1) * itemsPerPage,
    entityPage * itemsPerPage
  );

  function handleCreateEntity() {
    if (!newEntityName.trim()) return;
    const props: Record<string, unknown> = {};
    if (newEntityPropKey.trim() && newEntityPropVal.trim()) {
      props[newEntityPropKey.trim()] = isNaN(Number(newEntityPropVal)) ? newEntityPropVal.trim() : Number(newEntityPropVal);
    }
    mobileStore.createEntity({
      name: newEntityName.trim(),
      blueprintId: newEntityBlueprintId,
      description: newEntityDesc.trim() || undefined,
      properties: props,
    });
    setNewEntityName("");
    setNewEntityDesc("");
    setNewEntityPropKey("");
    setNewEntityPropVal("");
    setIsEntityModalOpen(false);
  }

  function handleCreateBlueprint() {
    if (!newBpName.trim()) return;
    mobileStore.createBlueprint({
      name: newBpName.trim(),
      category: newBpCategory.trim() || "Characters",
      blueprintClass: newBpClass,
      description: newBpDesc.trim() || undefined,
    });
    setNewBpName("");
    setNewBpDesc("");
    setIsBlueprintModalOpen(false);
  }

  function handleCreateEvent() {
    if (!newEventTitle.trim()) return;
    mobileStore.createTimelineEvent({
      title: newEventTitle.trim(),
      entityName: newEventEntityName.trim(),
      entityId: newEventEntityId,
      description: newEventDesc.trim(),
      eventType: newEventType,
      timestamp: new Date().toLocaleDateString(),
    });
    setNewEventTitle("");
    setNewEventDesc("");
    setIsEventModalOpen(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      {/* Sub-Header Section Switcher (Formula from web: Overview, Entities, Schemas, Timeline, Audit, Rules) */}
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
              backgroundColor: activeTab === "OVERVIEW" ? "rgba(124, 58, 237, 0.15)" : "transparent",
              borderColor: activeTab === "OVERVIEW" ? "rgba(124, 58, 237, 0.4)" : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <Globe2 size={14} color={activeTab === "OVERVIEW" ? "#7c3aed" : "#a1a1aa"} />
            <Text style={{ color: activeTab === "OVERVIEW" ? "#7c3aed" : "#a1a1aa", fontSize: 12, fontWeight: activeTab === "OVERVIEW" ? "bold" : "500" }}>
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
              backgroundColor: activeTab === "ENTITIES" ? "rgba(124, 58, 237, 0.15)" : "transparent",
              borderColor: activeTab === "ENTITIES" ? "rgba(124, 58, 237, 0.4)" : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <Users size={14} color={activeTab === "ENTITIES" ? "#7c3aed" : "#a1a1aa"} />
            <Text style={{ color: activeTab === "ENTITIES" ? "#7c3aed" : "#a1a1aa", fontSize: 12, fontWeight: activeTab === "ENTITIES" ? "bold" : "500" }}>
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
              backgroundColor: activeTab === "SCHEMAS" ? "rgba(124, 58, 237, 0.15)" : "transparent",
              borderColor: activeTab === "SCHEMAS" ? "rgba(124, 58, 237, 0.4)" : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <LayoutTemplate size={14} color={activeTab === "SCHEMAS" ? "#7c3aed" : "#a1a1aa"} />
            <Text style={{ color: activeTab === "SCHEMAS" ? "#7c3aed" : "#a1a1aa", fontSize: 12, fontWeight: activeTab === "SCHEMAS" ? "bold" : "500" }}>
              Blueprints
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
              backgroundColor: activeTab === "TIMELINE" ? "rgba(124, 58, 237, 0.15)" : "transparent",
              borderColor: activeTab === "TIMELINE" ? "rgba(124, 58, 237, 0.4)" : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <Clock size={14} color={activeTab === "TIMELINE" ? "#7c3aed" : "#a1a1aa"} />
            <Text style={{ color: activeTab === "TIMELINE" ? "#7c3aed" : "#a1a1aa", fontSize: 12, fontWeight: activeTab === "TIMELINE" ? "bold" : "500" }}>
              Timeline
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
              backgroundColor: activeTab === "AUDIT" ? "rgba(124, 58, 237, 0.15)" : "transparent",
              borderColor: activeTab === "AUDIT" ? "rgba(124, 58, 237, 0.4)" : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <AlertOctagon size={14} color={activeTab === "AUDIT" ? "#ef4444" : "#a1a1aa"} />
            <Text style={{ color: activeTab === "AUDIT" ? "#ef4444" : "#a1a1aa", fontSize: 12, fontWeight: activeTab === "AUDIT" ? "bold" : "500" }}>
              Audit ({continuityIssues.length})
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
              backgroundColor: activeTab === "RULES" ? "rgba(124, 58, 237, 0.15)" : "transparent",
              borderColor: activeTab === "RULES" ? "rgba(124, 58, 237, 0.4)" : "transparent",
              borderWidth: 1,
              minHeight: 36,
            }}
          >
            <ShieldCheck size={14} color={activeTab === "RULES" ? "#7c3aed" : "#a1a1aa"} />
            <Text style={{ color: activeTab === "RULES" ? "#7c3aed" : "#a1a1aa", fontSize: 12, fontWeight: activeTab === "RULES" ? "bold" : "500" }}>
              Rules
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "OVERVIEW" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 14 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>World Studio Workbenches</Text>
            <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
              Inspect structural lore blueprints, entity registries, and causal continuity engines.
            </Text>
          </View>

          {/* Workbench Grid Cards (Matching web/world/+page.svelte) */}
          <View style={{ gap: 12, flexDirection: isTabletOrWide ? "row" : "column", flexWrap: "wrap" }}>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Users size={18} color="#2dd4bf" />
                <Text style={{ color: "#2dd4bf", fontSize: 15, fontWeight: "bold" }}>Universe Entities</Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
                Instantiate characters, factions, artifacts, and realms with custom properties and live formula calculations.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={{ color: "#2dd4bf", fontSize: 12, fontWeight: "bold" }}>View Entities ({entities.length})</Text>
                <ArrowRight size={14} color="#2dd4bf" />
              </View>
            </TouchableOpacity>

            {/* Blueprints & Schemas Card */}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <LayoutTemplate size={18} color="#38bdf8" />
                <Text style={{ color: "#38bdf8", fontSize: 15, fontWeight: "bold" }}>Blueprints & Schemas</Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
                Architect 1st-Class archetypes (Cultivators, Relics) and 2nd-Class sub-schemas with custom typing.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={{ color: "#38bdf8", fontSize: 12, fontWeight: "bold" }}>Manage Blueprints ({blueprints.length})</Text>
                <ArrowRight size={14} color="#38bdf8" />
              </View>
            </TouchableOpacity>

            {/* Causal Timeline Card */}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#7c3aed" />
                <Text style={{ color: "#7c3aed", fontSize: 15, fontWeight: "bold" }}>Causal Timeline</Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
                Dual-index causal delta event stream: narrative sequence vs universe chronological order.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}>Open Timeline ({timelineEvents.length} events)</Text>
                <ArrowRight size={14} color="#7c3aed" />
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#f59e0b" />
                <Text style={{ color: "#f59e0b", fontSize: 15, fontWeight: "bold" }}>Invariant Rules</Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
                Author-defined universe boundary laws (numeric bounds, dead entity action restrictions, formula clamps).
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "bold" }}>Rules Builder ({invariantRules.length} rules)</Text>
                <ArrowRight size={14} color="#f59e0b" />
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <AlertOctagon size={18} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 15, fontWeight: "bold" }}>Continuity Audit</Text>
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
                Live contradiction detector comparing drafted scenes against causal state fold graphs with RFC 7807 problem details.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "bold" }}>Audit Console ({continuityIssues.length} alerts)</Text>
                <ArrowRight size={14} color="#ef4444" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* TAB 2: ENTITIES REGISTRY */}
      {activeTab === "ENTITIES" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}>
          {/* Search & Header Action Row */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#121215",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  minHeight: 40,
                }}
              >
                <Search size={16} color="#71717a" />
                <TextInput
                  value={searchQuery}
                  onChangeText={(t) => {
                    setSearchQuery(t);
                    setEntityPage(1);
                  }}
                  placeholder="Search entities..."
                  placeholderTextColor="#71717a"
                  style={{ flex: 1, marginLeft: 8, color: "#fafafa", fontSize: 13 }}
                />
              </View>
              <TouchableOpacity
                onPress={() => setIsEntityModalOpen(true)}
                style={{
                  backgroundColor: "#7c3aed",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minHeight: 40,
                }}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>Create</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setEntityPage(1);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: isSelected ? "#7c3aed" : "#18181b",
                      borderColor: isSelected ? "#7c3aed" : "#27272a",
                      borderWidth: 1,
                    }}
                  >
                    <Text style={{ color: isSelected ? "#ffffff" : "#a1a1aa", fontSize: 11, fontWeight: isSelected ? "bold" : "500" }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Standard 10-Item Top Pagination Bar (Rule: mobile_first_responsive.md) */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
              Showing {filteredEntities.length === 0 ? 0 : (entityPage - 1) * itemsPerPage + 1}–{Math.min(entityPage * itemsPerPage, filteredEntities.length)} of {filteredEntities.length}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity
                disabled={entityPage <= 1}
                onPress={() => setEntityPage((p) => Math.max(1, p - 1))}
                style={{
                  backgroundColor: "#1e1e24",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  opacity: entityPage <= 1 ? 0.4 : 1,
                }}
              >
                <Text style={{ color: "#fafafa", fontSize: 11 }}>Prev</Text>
              </TouchableOpacity>
              <Text style={{ color: "#fafafa", fontSize: 11, fontWeight: "bold" }}>
                {entityPage} / {totalEntityPages}
              </Text>
              <TouchableOpacity
                disabled={entityPage >= totalEntityPages}
                onPress={() => setEntityPage((p) => Math.min(totalEntityPages, p + 1))}
                style={{
                  backgroundColor: "#1e1e24",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  opacity: entityPage >= totalEntityPages ? 0.4 : 1,
                }}
              >
                <Text style={{ color: "#fafafa", fontSize: 11 }}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Entity Cards */}
          <View style={{ gap: 10, flexDirection: isTabletOrWide ? "row" : "column", flexWrap: "wrap" }}>
            {paginatedEntities.length === 0 ? (
              <View style={{ padding: 32, alignItems: "center", width: "100%" }}>
                <Text style={{ color: "#a1a1aa", fontSize: 13 }}>No entities found matching filters.</Text>
              </View>
            ) : (
              paginatedEntities.map((ent) => (
                <View
                  key={ent.id}
                  style={{
                    width: isTabletOrWide ? "48%" : "100%",
                    backgroundColor: "#121215",
                    borderColor: "#27272a",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}>{ent.name}</Text>
                      <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                        {ent.category || "General"} · Seq #{ent.lastMutatedSeqNumber || 0}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View
                        style={{
                          backgroundColor: "rgba(124, 58, 237, 0.15)",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          borderColor: "rgba(124, 58, 237, 0.3)",
                          borderWidth: 1,
                        }}
                      >
                        <Text style={{ color: "#7c3aed", fontSize: 10, fontWeight: "bold" }}>
                          {ent.blueprintId.replace("bp-", "").toUpperCase()}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => mobileStore.deleteEntity(ent.id)}>
                        <Trash2 size={14} color="#71717a" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {ent.description ? (
                    <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>{ent.description}</Text>
                  ) : null}

                  {/* Properties Box */}
                  {ent.properties && Object.keys(ent.properties).length > 0 ? (
                    <View style={{ backgroundColor: "#09090b", padding: 8, borderRadius: 6, gap: 4 }}>
                      {Object.entries(ent.properties).map(([key, val]) => (
                        <View key={key} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ color: "#a1a1aa", fontSize: 11, fontStyle: "italic" }}>{key}:</Text>
                          <Text style={{ color: "#fafafa", fontSize: 11, fontWeight: "500" }}>{String(val)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Computed Score */}
                  {ent.computedFormulas && ent.computedFormulas["combat_score"] !== undefined ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#1e1e24", paddingTop: 6 }}>
                      <Text style={{ color: "#a1a1aa", fontSize: 11 }}>Combat Formula Rating:</Text>
                      <Text style={{ color: "#7c3aed", fontSize: 11, fontWeight: "bold" }}>{ent.computedFormulas["combat_score"]} pts</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* TAB 3: BLUEPRINTS & SCHEMAS */}
      {activeTab === "SCHEMAS" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Universe Blueprints</Text>
              <Text style={{ color: "#a1a1aa", fontSize: 11 }}>1st & 2nd-Class structural archetypes</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsBlueprintModalOpen(true)}
              style={{ backgroundColor: "#7c3aed", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
            >
              <Plus size={14} color="#ffffff" />
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>New Blueprint</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10, flexDirection: isTabletOrWide ? "row" : "column", flexWrap: "wrap" }}>
            {blueprints.map((bp) => (
              <View
                key={bp.id}
                style={{
                  width: isTabletOrWide ? "48%" : "100%",
                  backgroundColor: "#121215",
                  borderColor: "#27272a",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 14,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}>{bp.name}</Text>
                    <Text style={{ color: "#a1a1aa", fontSize: 11 }}>{bp.category}</Text>
                  </View>
                  <View style={{ backgroundColor: "rgba(124, 58, 237, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: "#7c3aed", fontSize: 10, fontWeight: "bold" }}>{bp.blueprintClass}</Text>
                  </View>
                </View>

                {bp.description ? (
                  <Text style={{ color: "#a1a1aa", fontSize: 12 }}>{bp.description}</Text>
                ) : null}

                <View style={{ backgroundColor: "#09090b", padding: 8, borderRadius: 6, gap: 4 }}>
                  <Text style={{ color: "#a1a1aa", fontSize: 10, textTransform: "uppercase", fontWeight: "bold" }}>Fields ({bp.fields.length})</Text>
                  {bp.fields.map((f) => (
                    <View key={f.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: "#fafafa", fontSize: 11 }}>{f.label}</Text>
                      <Text style={{ color: "#7c3aed", fontSize: 10, fontFamily: "monospace" }}>{f.fieldType}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* TAB 4: CAUSAL TIMELINE */}
      {activeTab === "TIMELINE" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Causal Event Stream</Text>
              <Text style={{ color: "#a1a1aa", fontSize: 11 }}>Dual-index sequential history & state delta snapshots</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsEventModalOpen(true)}
              style={{ backgroundColor: "#7c3aed", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
            >
              <Plus size={14} color="#ffffff" />
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>Log Event</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10 }}>
            {timelineEvents.map((evt) => (
              <View
                key={evt.id}
                style={{
                  backgroundColor: "#121215",
                  borderColor: evt.isKeyMilestone ? "#7c3aed" : "#27272a",
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 14,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "bold" }}>Seq #{evt.sequenceNumber}</Text>
                    <Text style={{ color: "#fafafa", fontSize: 14, fontWeight: "bold" }}>{evt.title}</Text>
                  </View>
                  <View style={{ backgroundColor: "#1e1e24", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: "#a1a1aa", fontSize: 10 }}>{evt.eventType}</Text>
                  </View>
                </View>

                <Text style={{ color: "#a1a1aa", fontSize: 12 }}>{evt.description}</Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#1e1e24", paddingTop: 6 }}>
                  <Text style={{ color: "#71717a", fontSize: 11 }}>Entity: <Text style={{ color: "#fafafa" }}>{evt.entityName}</Text></Text>
                  <Text style={{ color: "#71717a", fontSize: 11 }}>{evt.timestamp}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* TAB 5: CONTINUITY AUDIT */}
      {activeTab === "AUDIT" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Continuity Audit Scanner</Text>
            <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
              Real-time contradiction flagging and scene grounding validation against universe canon.
            </Text>
          </View>

          {continuityIssues.map((iss) => (
            <View
              key={iss.id}
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.3)",
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={16} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "bold" }}>{iss.ruleName}</Text>
              </View>
              <Text style={{ color: "#fafafa", fontSize: 13, lineHeight: 18 }}>{iss.message}</Text>
              <View style={{ borderTopWidth: 1, borderTopColor: "rgba(239, 68, 68, 0.2)", paddingTop: 6 }}>
                <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                  Target Scene: <Text style={{ color: "#fafafa" }}>{iss.sceneTitle}</Text> · Entity: <Text style={{ color: "#fafafa" }}>{iss.entityName}</Text>
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* TAB 6: INVARIANT RULES */}
      {activeTab === "RULES" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 12 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Invariant Universe Laws</Text>
            <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
              Boundary constraints, deceased entity action restrictions, and formula clamps.
            </Text>
          </View>

          {invariantRules.map((rule) => (
            <View
              key={rule.id}
              style={{
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#fafafa", fontSize: 14, fontWeight: "bold" }}>{rule.name}</Text>
                <Switch
                  value={rule.isActive}
                  onValueChange={() => mobileStore.toggleRule(rule.id)}
                  trackColor={{ false: "#27272a", true: "#7c3aed" }}
                />
              </View>
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>{rule.description}</Text>
              <View style={{ backgroundColor: "#09090b", padding: 8, borderRadius: 6 }}>
                <Text style={{ color: "#7c3aed", fontSize: 11, fontFamily: "monospace" }}>{rule.ruleExpression}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create Entity Modal */}
      <Modal visible={isEntityModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Create Entity Instance</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Entity Name *</Text>
              <TextInput
                value={newEntityName}
                onChangeText={setNewEntityName}
                placeholder="e.g. Grand Elder Shen"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Description</Text>
              <TextInput
                value={newEntityDesc}
                onChangeText={setNewEntityDesc}
                placeholder="Brief background..."
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Property Key</Text>
                <TextInput
                  value={newEntityPropKey}
                  onChangeText={setNewEntityPropKey}
                  placeholder="e.g. realm"
                  placeholderTextColor="#71717a"
                  style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Value</Text>
                <TextInput
                  value={newEntityPropVal}
                  onChangeText={setNewEntityPropVal}
                  placeholder="e.g. Golden Core"
                  placeholderTextColor="#71717a"
                  style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setIsEntityModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateEntity} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Blueprint Modal */}
      <Modal visible={isBlueprintModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Create Blueprint Schema</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Blueprint Name *</Text>
              <TextInput
                value={newBpName}
                onChangeText={setNewBpName}
                placeholder="e.g. Beast Companion"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Category</Text>
              <TextInput
                value={newBpCategory}
                onChangeText={setNewBpCategory}
                placeholder="e.g. Fauna & Familiars"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setIsBlueprintModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateBlueprint} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Log Event Modal */}
      <Modal visible={isEventModalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#121215", borderColor: "#27272a", borderWidth: 1, borderRadius: 14, padding: 18, gap: 12 }}>
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>Log Timeline Event</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Event Title *</Text>
              <TextInput
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="e.g. Battle of Azure Gorge"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Entity Name</Text>
              <TextInput
                value={newEventEntityName}
                onChangeText={setNewEventEntityName}
                placeholder="e.g. Eldrin Stormweaver"
                placeholderTextColor="#71717a"
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}>Description / Delta</Text>
              <TextInput
                value={newEventDesc}
                onChangeText={setNewEventDesc}
                placeholder="What occurred in universe canon..."
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={2}
                style={{ backgroundColor: "#09090b", borderColor: "#27272a", borderWidth: 1, borderRadius: 8, padding: 10, color: "#fafafa", fontSize: 14, minHeight: 50 }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setIsEventModalOpen(false)} style={{ backgroundColor: "#27272a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateEvent} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>Log Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

