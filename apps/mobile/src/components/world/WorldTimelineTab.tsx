import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { EmptyState } from "../EmptyState.tsx";
import { Pagination } from "../Pagination.tsx";
import { mobileStore } from "../../lib/mobileStore.ts";
import type { TimelineEventItem } from "../../lib/types.ts";
import { Clock, Plus, Edit3, Trash2, History } from "lucide-react-native";

export interface WorldTimelineTabProps {
  timelineEvents: TimelineEventItem[];
  isTabletOrWide: boolean;
  onOpenCreateEvent: () => void;
  onOpenEditEvent: (event: TimelineEventItem) => void;
  onDeleteEvent: (event: TimelineEventItem) => void;
}

export function WorldTimelineTab({
  timelineEvents,
  isTabletOrWide,
  onOpenCreateEvent,
  onOpenEditEvent,
  onDeleteEvent,
}: WorldTimelineTabProps) {
  const [timelineMode, setTimelineMode] = useState<
    "narrative" | "chronological"
  >("narrative");
  const [timelinePage, setTimelinePage] = useState(1);
  const [scrubSequence, setScrubSequence] = useState<number>(100);
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(true);
  const pageSize = 10;

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
            Causal Timeline
          </Text>
          <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
            Dual-index delta event stream & time-travel scrubber.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onOpenCreateEvent()}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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
                Active Universe State: {foldedEntitiesAtScrub.length} dynamic
                entity state folds calculated at Seq #{scrubSequence}.
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
            borderColor: timelineMode === "narrative" ? "#7c3aed" : "#27272a",
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
              color: timelineMode === "chronological" ? "#7c3aed" : "#a1a1aa",
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
          onAction={() => onOpenCreateEvent()}
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
                  onPress={() => onOpenEditEvent(ev)}
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
                  onPress={() => onDeleteEvent(ev)}
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
              <Text style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 16 }}>
                {ev.description}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}
