import React, { useSyncExternalStore, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { mobileStore } from "../../src/lib/mobileStore";
import { Search, User, Sword, Sparkles, Hash, Tag } from "lucide-react-native";

export default function WorldEntitiesScreen() {
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const entities = mobileStore.getEntities();
  const categories = ["ALL", ...Array.from(new Set(entities.map((e) => e.category || "General")))];

  const filteredEntities = entities.filter((e) => {
    const matchCat = selectedCategory === "ALL" || e.category === selectedCategory;
    const matchQuery =
      !searchQuery.trim() ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#09090b" }}
      contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 14 }}
    >
      {/* Search & Category Filter */}
      <View style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#121215",
            borderColor: "#27272a",
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 12,
            minHeight: 44,
          }}
        >
          <Search size={16} color="#71717a" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search universe entities..."
            placeholderTextColor="#71717a"
            style={{
              flex: 1,
              marginLeft: 8,
              color: "#fafafa",
              fontSize: 14,
            }}
          />
        </View>

        {/* Category Pill Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: isSelected ? "#7c3aed" : "#1e1e24",
                  borderColor: isSelected ? "#7c3aed" : "#27272a",
                  borderWidth: 1,
                  minHeight: 36,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#ffffff" : "#a1a1aa",
                    fontSize: 12,
                    fontWeight: isSelected ? "bold" : "500",
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Entity Card List (Mobile-First responsive card view) */}
      <View style={{ gap: 10, flexDirection: isTabletOrWide ? "row" : "column", flexWrap: "wrap" }}>
        {filteredEntities.length === 0 ? (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ color: "#a1a1aa", fontSize: 13 }}>No matching entities found.</Text>
          </View>
        ) : (
          filteredEntities.map((ent) => (
            <View
              key={ent.id}
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
              {/* Card Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}>{ent.name}</Text>
                  <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
                    {ent.category || "General"} · Seq #{ent.lastMutatedSeqNumber || 0}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "rgba(124, 58, 237, 0.15)",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: "rgba(124, 58, 237, 0.3)",
                  }}
                >
                  <Text style={{ color: "#7c3aed", fontSize: 10, fontWeight: "bold" }}>
                    {ent.blueprintId.replace("bp-", "").toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Description */}
              {ent.description ? (
                <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
                  {ent.description}
                </Text>
              ) : null}

              {/* Properties Key-Value Strip */}
              {ent.properties && Object.keys(ent.properties).length > 0 ? (
                <View
                  style={{
                    backgroundColor: "#09090b",
                    padding: 8,
                    borderRadius: 6,
                    gap: 4,
                  }}
                >
                  {Object.entries(ent.properties).map(([key, val]) => (
                    <View key={key} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: "#a1a1aa", fontSize: 11, fontStyle: "italic" }}>{key}:</Text>
                      <Text style={{ color: "#fafafa", fontSize: 11, fontWeight: "500" }}>{String(val)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
