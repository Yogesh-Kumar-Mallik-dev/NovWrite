import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  GitCommit,
} from "lucide-react-native";
import { mobileStore } from "../../../src/lib/mobileStore.ts";
import { EffectOperation, TimelineEffectItem } from "../../../src/lib/types.ts";

const OPERATIONS: { value: EffectOperation; label: string }[] = [
  { value: "SET", label: "SET (Direct Override)" },
  { value: "INCREMENT", label: "INCREMENT (+ Delta)" },
  { value: "DECREMENT", label: "DECREMENT (- Delta)" },
  { value: "APPEND", label: "APPEND (Add to Array)" },
  { value: "REMOVE", label: "REMOVE (Filter Array)" },
  { value: "TRANSFER", label: "TRANSFER (Move Asset)" },
];

export default function EditTimelineEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState(() =>
    id ? mobileStore.getTimelineEvent(id) : undefined,
  );
  const entities = mobileStore.getEntities();

  const [title, setTitle] = useState(event?.title || "");
  const [narrativeSeq, setNarrativeSeq] = useState(
    String(event?.narrativeSequenceNumber || 10),
  );
  const [chronoOrder, setChronoOrder] = useState(
    String(event?.chronologicalOrder || 10),
  );
  const [description, setDescription] = useState(event?.description || "");
  const [effects, setEffects] = useState<TimelineEffectItem[]>(
    event?.effects || [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const ev = mobileStore.getTimelineEvent(id);
      if (ev) {
        setEvent(ev);
        setTitle(ev.title);
        setNarrativeSeq(String(ev.narrativeSequenceNumber));
        setChronoOrder(String(ev.chronologicalOrder));
        setDescription(ev.description);
        setEffects(ev.effects || []);
      }
    }
  }, [id]);

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 px-4 py-8 items-center justify-center">
        <AlertCircle size={32} color="#ef4444" />
        <Text className="mt-3 text-base font-bold text-zinc-100">
          Timeline Event Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5"
        >
          <Text className="text-xs text-zinc-300">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const addEffect = () => {
    const defaultEntityId = entities[0]?.id || "";
    setEffects((prev) => [
      ...prev,
      {
        id: `eff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        targetEntityId: defaultEntityId,
        entityName: entities[0]?.name || "Entity",
        propertyKey: "status",
        operation: "SET",
        value: "ALIVE",
      },
    ]);
  };

  const updateEffect = (
    index: number,
    updates: Partial<TimelineEffectItem>,
  ) => {
    setEffects((prev) =>
      prev.map((eff, i) => {
        if (i === index) {
          const updated = { ...eff, ...updates };
          if (updates.targetEntityId) {
            const ent = entities.find((e) => e.id === updates.targetEntityId);
            if (ent) updated.entityName = ent.name;
          }
          return updated;
        }
        return eff;
      }),
    );
  };

  const removeEffect = (index: number) => {
    setEffects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const finalTitle = title.trim();
    if (!finalTitle) {
      setError("Event title is required.");
      return;
    }

    const nSeq = Number(narrativeSeq);
    const cOrder = Number(chronoOrder);
    if (isNaN(nSeq) || isNaN(cOrder)) {
      setError("Sequence and chronological order must be numeric.");
      return;
    }

    if (id) {
      mobileStore.updateTimelineEvent(id, {
        title: finalTitle,
        narrativeSequenceNumber: nSeq,
        chronologicalOrder: cOrder,
        description: description.trim(),
        effects,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Timeline Event",
      `Are you sure you want to delete "${event.title}" from the causal timeline?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            mobileStore.deleteTimelineEvent(id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3.5">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950"
          >
            <ArrowLeft size={20} color="#a1a1aa" />
          </TouchableOpacity>
          <View className="flex-1 items-center px-3">
            <Text className="text-base font-bold text-zinc-100">
              Edit Timeline Event
            </Text>
            <Text className="text-xs text-zinc-400">
              Seq #{event.narrativeSequenceNumber} · {event.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2"
          >
            <Sparkles size={16} color="#09090b" />
            <Text className="text-xs font-bold text-zinc-950">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 py-5"
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View className="mb-5 flex-row items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5">
              <AlertCircle size={18} color="#ef4444" />
              <Text className="flex-1 text-xs text-red-300">{error}</Text>
            </View>
          ) : null}

          {/* Event Title */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Clock size={16} color="#f59e0b" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Event Title <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError(null);
              }}
              placeholder="Event title..."
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Dual Order Sequences */}
          <View className="mb-5 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Narrative Seq #
              </Text>
              <TextInput
                value={narrativeSeq}
                onChangeText={setNarrativeSeq}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#71717a"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-amber-400"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                In-Universe Chrono #
              </Text>
              <TextInput
                value={chronoOrder}
                onChangeText={setChronoOrder}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#71717a"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-blue-400"
              />
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Event Narrative Description & Lore
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What occurs in this causal milestone..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[100px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Causal State Mutations / Effects Builder */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <GitCommit size={16} color="#f59e0b" />
                <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Causal State Mutations ({effects.length})
                </Text>
              </View>
              <TouchableOpacity
                onPress={addEffect}
                activeOpacity={0.7}
                className="flex-row items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5"
              >
                <Plus size={14} color="#f59e0b" />
                <Text className="text-xs font-bold text-amber-400">
                  Add Mutation
                </Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {effects.map((eff, idx) => (
                <View
                  key={eff.id || idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5"
                >
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-zinc-200">
                      Mutation #{idx + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeEffect(idx)}
                      activeOpacity={0.7}
                      className="p-1"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Target Entity Picker */}
                  <View className="mb-3">
                    <Text className="mb-1 text-[11px] font-semibold text-zinc-400">
                      Target Entity
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row gap-1.5"
                    >
                      {entities.map((ent) => {
                        const isSelected = eff.targetEntityId === ent.id;
                        return (
                          <TouchableOpacity
                            key={ent.id}
                            onPress={() =>
                              updateEffect(idx, { targetEntityId: ent.id })
                            }
                            activeOpacity={0.7}
                            className={`mr-1.5 rounded-lg border px-2.5 py-1.5 ${
                              isSelected
                                ? "border-amber-500 bg-amber-500/20"
                                : "border-zinc-800 bg-zinc-950"
                            }`}
                          >
                            <Text
                              className={`text-[11px] font-medium ${
                                isSelected ? "text-amber-400" : "text-zinc-400"
                              }`}
                            >
                              {ent.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Property Key & Mutation Value */}
                  <View className="mb-3 flex-row gap-2">
                    <View className="flex-1">
                      <Text className="mb-1 text-[11px] font-semibold text-zinc-400">
                        Property Key
                      </Text>
                      <TextInput
                        value={eff.propertyKey}
                        onChangeText={(t) =>
                          updateEffect(idx, { propertyKey: t })
                        }
                        placeholder="e.g. status, base_qi"
                        placeholderTextColor="#71717a"
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-amber-300"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-[11px] font-semibold text-zinc-400">
                        Mutation Value
                      </Text>
                      <TextInput
                        value={String(eff.value)}
                        onChangeText={(t) => {
                          const val = isNaN(Number(t)) ? t : Number(t);
                          updateEffect(idx, { value: val });
                        }}
                        placeholder="Value"
                        placeholderTextColor="#71717a"
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                      />
                    </View>
                  </View>

                  {/* Operation Picker */}
                  <View>
                    <Text className="mb-1.5 text-[11px] font-semibold text-zinc-400">
                      Operation
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row gap-1.5"
                    >
                      {OPERATIONS.map((op) => {
                        const isSelected = eff.operation === op.value;
                        return (
                          <TouchableOpacity
                            key={op.value}
                            onPress={() =>
                              updateEffect(idx, { operation: op.value })
                            }
                            activeOpacity={0.7}
                            className={`mr-1.5 rounded-lg border px-2.5 py-1.5 ${
                              isSelected
                                ? "border-amber-500 bg-amber-500/20"
                                : "border-zinc-800 bg-zinc-950"
                            }`}
                          >
                            <Text
                              className={`text-[11px] font-medium ${
                                isSelected ? "text-amber-400" : "text-zinc-400"
                              }`}
                            >
                              {op.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5"
            >
              <Check size={18} color="#09090b" />
              <Text className="text-sm font-bold text-zinc-950">
                Save Event Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 py-3.5"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-400">
                Delete Timeline Event
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-3.5"
            >
              <Text className="text-sm font-medium text-zinc-400">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
