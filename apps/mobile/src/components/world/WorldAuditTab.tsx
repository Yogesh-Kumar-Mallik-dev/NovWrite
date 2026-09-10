import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { EmptyState } from "../EmptyState.tsx";
import { Pagination } from "../Pagination.tsx";
import type { ContinuityViolationItem } from "../../lib/types.ts";
import { RefreshCw, CheckCircle2 } from "lucide-react-native";

export interface WorldAuditTabProps {
  violations: ContinuityViolationItem[];
  isTabletOrWide: boolean;
  onTriggerAuditRun: () => void;
  isAuditing: boolean;
  onOpenOverrideModal: (violation: ContinuityViolationItem) => void;
}

export function WorldAuditTab({
  violations,
  isTabletOrWide,
  onTriggerAuditRun,
  isAuditing,
  onOpenOverrideModal,
}: WorldAuditTabProps) {
  const [auditStatusFilter, setAuditStatusFilter] = useState<
    "ALL" | "ACTIVE" | "OVERRIDDEN"
  >("ALL");
  const [auditPage, setAuditPage] = useState(1);
  const pageSize = 10;

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
            Continuity Audit
          </Text>
          <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
            Contradiction detector against causal state folds.
          </Text>
        </View>
        <TouchableOpacity
          onPress={onTriggerAuditRun}
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
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
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
          <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold" }}>
            {violations.length}
          </Text>
          <Text style={{ color: "#71717a", fontSize: 10 }}>Total Reports</Text>
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
          <Text style={{ color: "#f59e0b", fontSize: 16, fontWeight: "bold" }}>
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
          <Text style={{ color: "#a78bfa", fontSize: 16, fontWeight: "bold" }}>
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
            borderColor: auditStatusFilter === "ALL" ? "#7c3aed" : "#27272a",
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
            borderColor: auditStatusFilter === "ACTIVE" ? "#ef4444" : "#27272a",
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
              color: auditStatusFilter === "OVERRIDDEN" ? "#7c3aed" : "#a1a1aa",
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
          onAction={onTriggerAuditRun}
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

              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
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
                  onPress={() => onOpenOverrideModal(viol)}
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
  );
}
