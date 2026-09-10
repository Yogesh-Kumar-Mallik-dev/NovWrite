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
import { mobileStore } from "../../lib/mobileStore.ts";
import type { BlueprintDef, EntityItem } from "../../lib/types.ts";
import {
  Users,
  Boxes,
  User,
  Sword,
  MapPin,
  Search,
  Plus,
  Edit3,
  Trash2,
  Calculator,
} from "lucide-react-native";

export interface WorldEntitiesTabProps {
  entities: EntityItem[];
  blueprints: BlueprintDef[];
  firstClassBlueprints: BlueprintDef[];
  isTabletOrWide: boolean;
  onOpenCreateEntity: (blueprintId?: string) => void;
  onOpenEditEntity: (entity: EntityItem) => void;
  onDeleteEntity: (entity: { id: string; name: string }) => void;
  onNavigateToSchemas: () => void;
}

export function WorldEntitiesTab({
  entities,
  blueprints,
  firstClassBlueprints,
  isTabletOrWide,
  onOpenCreateEntity,
  onOpenEditEntity,
  onDeleteEntity,
  onNavigateToSchemas,
}: WorldEntitiesTabProps) {
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [selectedBlueprintFilter, setSelectedBlueprintFilter] =
    useState<string>("ALL");
  const [entityPage, setEntityPage] = useState(1);
  const pageSize = 10;

  function getEntityIcon(category?: string) {
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
            Universe Entities
          </Text>
          <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
            Dynamic character, relic, and faction instances.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onOpenCreateEntity()}
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
          onAction={onNavigateToSchemas}
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
                    selectedBlueprintFilter === "ALL" ? "#7c3aed" : "#a1a1aa",
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
                    selectedBlueprintFilter === bp.id ? "#2dd4bf" : "#27272a",
                  borderWidth: 1,
                  minHeight: 32,
                }}
              >
                <Text
                  style={{
                    color:
                      selectedBlueprintFilter === bp.id ? "#2dd4bf" : "#a1a1aa",
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
              onAction={() => onOpenCreateEntity()}
            />
          ) : (
            paginatedEntities.map((ent) => {
              const bp = blueprints.find((b) => b.id === ent.blueprintId);
              const IconComp = getEntityIcon(ent.category);
              const formulaEvals = mobileStore.evaluateEntityFormulas(ent.id);

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
                            <Text style={{ color: "#a1a1aa", fontSize: 10 }}>
                              {ent.category}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => onOpenEditEntity(ent)}
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
                          onDeleteEntity({ id: ent.id, name: ent.name })
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
  );
}
