import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { EmptyState } from "../EmptyState.tsx";
import { Pagination } from "../Pagination.tsx";
import type { BlueprintDef } from "../../lib/types.ts";
import {
  LayoutTemplate,
  Search,
  Plus,
  Edit3,
  Trash2,
} from "lucide-react-native";

export interface WorldBlueprintsTabProps {
  blueprints: BlueprintDef[];
  isTabletOrWide: boolean;
  onOpenCreateBlueprint: () => void;
  onOpenEditBlueprint: (blueprint: BlueprintDef) => void;
  onDeleteBlueprint: (blueprint: { id: string; name: string }) => void;
}

export function WorldBlueprintsTab({
  blueprints,
  isTabletOrWide,
  onOpenCreateBlueprint,
  onOpenEditBlueprint,
  onDeleteBlueprint,
}: WorldBlueprintsTabProps) {
  const [schemaSearchQuery, setSchemaSearchQuery] = useState("");
  const [schemaClassFilter, setSchemaClassFilter] = useState<
    "ALL" | "FIRST_CLASS" | "SECOND_CLASS"
  >("ALL");
  const [schemaPage, setSchemaPage] = useState(1);
  const pageSize = 10;

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

  return (
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
          <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>
            Blueprints & Schemas
          </Text>
          <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
            1st-Class archetypes & 2nd-Class sub-schemas.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onOpenCreateBlueprint()}
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
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
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
              borderColor: schemaClassFilter === "ALL" ? "#7c3aed" : "#27272a",
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
                  schemaClassFilter === "FIRST_CLASS" ? "#7c3aed" : "#a1a1aa",
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
                schemaClassFilter === "SECOND_CLASS" ? "#38bdf8" : "#27272a",
              borderWidth: 1,
              minHeight: 32,
            }}
          >
            <Text
              style={{
                color:
                  schemaClassFilter === "SECOND_CLASS" ? "#38bdf8" : "#a1a1aa",
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
            onAction={() => onOpenCreateBlueprint()}
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
                      onPress={() => onOpenEditBlueprint(bp)}
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
                        onDeleteBlueprint({ id: bp.id, name: bp.name })
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
  );
}
