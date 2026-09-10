import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import type {
  ProjectItem,
  BlueprintDef,
  EntityItem,
  TimelineEventItem,
  InvariantRuleItem,
  ContinuityViolationItem,
} from "../../lib/types.ts";
import {
  Globe2,
  Users,
  LayoutTemplate,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
} from "lucide-react-native";

export interface WorldOverviewTabProps {
  activeProject: ProjectItem;
  blueprints: BlueprintDef[];
  entities: EntityItem[];
  timelineEvents: TimelineEventItem[];
  rules: InvariantRuleItem[];
  violations: ContinuityViolationItem[];
  isTabletOrWide: boolean;
  onNavigateTab: (
    tab: "ENTITIES" | "SCHEMAS" | "TIMELINE" | "RULES" | "AUDIT",
  ) => void;
}

export function WorldOverviewTab({
  activeProject,
  blueprints,
  entities,
  timelineEvents,
  rules,
  violations,
  isTabletOrWide,
  onNavigateTab,
}: WorldOverviewTabProps) {
  return (
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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
        <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>
          {activeProject.name}
        </Text>
        <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
          {activeProject.genre || "Creative Project"} ·{" "}
          {activeProject.description ||
            "Universe lore specifications and causal tracking."}
        </Text>
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ color: "#fafafa", fontSize: 14, fontWeight: "bold" }}>
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
          onPress={() => onNavigateTab("ENTITIES")}
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
            <Text
              style={{ color: "#2dd4bf", fontSize: 15, fontWeight: "bold" }}
            >
              Universe Entities
            </Text>
          </View>
          <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
            Instantiate characters, factions, artifacts, and regions with custom
            per-blueprint table columns and live formula evaluations.
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
          onPress={() => onNavigateTab("SCHEMAS")}
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
            <Text
              style={{ color: "#38bdf8", fontSize: 15, fontWeight: "bold" }}
            >
              Blueprints & Schemas
            </Text>
          </View>
          <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
            Architect 1st-Class archetypes (Characters, Relics) and 2nd-Class
            sub-schemas (Cultivation Ladders, Affection Gauges, Math Formulas).
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
          onPress={() => onNavigateTab("TIMELINE")}
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
            <Text
              style={{ color: "#7c3aed", fontSize: 15, fontWeight: "bold" }}
            >
              Causal Timeline
            </Text>
          </View>
          <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
            Dual-index causal delta event stream: narrative reading sequence vs
            universe chronological order with time-travel state scrubber.
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
          onPress={() => onNavigateTab("RULES")}
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
            <Text
              style={{ color: "#f59e0b", fontSize: 15, fontWeight: "bold" }}
            >
              Invariant Rules
            </Text>
          </View>
          <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
            Author-defined universe boundary laws (numeric bounds, dead entity
            action restrictions, prerequisites, formula clamps).
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
          onPress={() => onNavigateTab("AUDIT")}
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
            <Text
              style={{ color: "#ef4444", fontSize: 15, fontWeight: "bold" }}
            >
              Continuity Audit
            </Text>
          </View>
          <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 17 }}>
            Live contradiction detector comparing drafted scenes against causal
            state fold graphs with RFC 7807 problem details.
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
  );
}
