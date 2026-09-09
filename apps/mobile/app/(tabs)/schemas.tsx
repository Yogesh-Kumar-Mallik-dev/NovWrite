import React, { useSyncExternalStore } from "react";
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { mobileStore } from "../../src/lib/mobileStore";
import { LayoutTemplate, Layers, Hash } from "lucide-react-native";

export default function SchemasScreen() {
  const state = useSyncExternalStore(
    (cb) => mobileStore.subscribe(cb),
    () => mobileStore.getState()
  );

  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  const blueprints = mobileStore.getBlueprints();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#09090b" }}
      contentContainerStyle={{ padding: isTabletOrWide ? 24 : 16, gap: 14 }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>
          Universe Blueprints & Schemas
        </Text>
        <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
          1st & 2nd-Class structural archetypes defining entity properties and formula definitions.
        </Text>
      </View>

      <View style={{ gap: 12, flexDirection: isTabletOrWide ? "row" : "column", flexWrap: "wrap" }}>
        {blueprints.map((bp) => (
          <View
            key={bp.id}
            style={{
              width: isTabletOrWide ? "48%" : "100%",
              backgroundColor: "#121215",
              borderColor: "#27272a",
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ gap: 2 }}>
                <Text style={{ color: "#fafafa", fontSize: 15, fontWeight: "bold" }}>{bp.name}</Text>
                <Text style={{ color: "#a1a1aa", fontSize: 11 }}>{bp.category}</Text>
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
                  {bp.blueprintClass}
                </Text>
              </View>
            </View>

            {bp.description ? (
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>{bp.description}</Text>
            ) : null}

            {/* Fields List */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: "#fafafa", fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>
                Fields ({bp.fields.length})
              </Text>
              <View style={{ backgroundColor: "#09090b", padding: 8, borderRadius: 6, gap: 4 }}>
                {bp.fields.map((f) => (
                  <View key={f.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "#fafafa", fontSize: 11, fontWeight: "500" }}>{f.label}</Text>
                    <Text style={{ color: "#7c3aed", fontSize: 10, fontFamily: "monospace" }}>{f.fieldType}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
