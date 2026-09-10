import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { EmptyState } from "../EmptyState.tsx";
import { Pagination } from "../Pagination.tsx";
import { mobileStore } from "../../lib/mobileStore.ts";
import type { InvariantRuleItem } from "../../lib/types.ts";
import { ShieldCheck, Search, Plus, Edit3, Trash2 } from "lucide-react-native";

export interface WorldRulesTabProps {
  rules: InvariantRuleItem[];
  isTabletOrWide: boolean;
  onOpenCreateRule: () => void;
  onOpenEditRule: (rule: InvariantRuleItem) => void;
  onDeleteRule: (rule: { id: string; name: string }) => void;
}

export function WorldRulesTab({
  rules,
  isTabletOrWide,
  onOpenCreateRule,
  onOpenEditRule,
  onDeleteRule,
}: WorldRulesTabProps) {
  const [rulesSearchQuery, setRulesSearchQuery] = useState("");
  const [rulesSeverityFilter, setRulesSeverityFilter] = useState<string>("ALL");
  const [rulesPage, setRulesPage] = useState(1);
  const pageSize = 10;

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
            Invariant Rules
          </Text>
          <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
            Universe boundary constraints & state guards.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onOpenCreateRule()}
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
          <Text style={{ color: "#22c55e", fontSize: 16, fontWeight: "bold" }}>
            {activeRulesCount}
          </Text>
          <Text style={{ color: "#71717a", fontSize: 10 }}>Active Rules</Text>
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
          <Text style={{ color: "#ef4444", fontSize: 16, fontWeight: "bold" }}>
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
          <Text style={{ color: "#f59e0b", fontSize: 16, fontWeight: "bold" }}>
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
          onAction={() => onOpenCreateRule()}
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
                    onPress={() => onOpenEditRule(rule)}
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
                      onDeleteRule({ id: rule.id, name: rule.name })
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
  );
}
