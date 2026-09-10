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
  Switch,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Shield,
  Sparkles,
  AlertCircle,
  Check,
  Code2,
  Trash2,
} from "lucide-react-native";
import { mobileStore } from "../../../src/lib/mobileStore.ts";
import { RuleSeverity, RuleType } from "../../../src/lib/types.ts";

const SEVERITIES: { value: RuleSeverity; label: string; color: string }[] = [
  { value: "BLOCKING_ERROR", label: "Blocking Error", color: "text-red-400" },
  { value: "WARNING", label: "Warning", color: "text-amber-400" },
  { value: "ADVISORY_NOTE", label: "Advisory Note", color: "text-blue-400" },
];

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: "STATE_GUARD", label: "State Guard" },
  { value: "NUMERIC_BOUNDS", label: "Numeric Bounds" },
  { value: "PREREQUISITE", label: "Prerequisite Guard" },
  { value: "RELATIONAL_GUARD", label: "Relational Guard" },
  { value: "FORMULA_BOUNDARY", label: "Formula Boundary" },
];

export default function EditInvariantRuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rule, setRule] = useState(() => (id ? mobileStore.getRule(id) : undefined));

  const [name, setName] = useState(rule?.name || "");
  const [severity, setSeverity] = useState<RuleSeverity>(rule?.severity || "BLOCKING_ERROR");
  const [type, setType] = useState<RuleType>(rule?.type || "STATE_GUARD");
  const [predicateExpression, setPredicateExpression] = useState(rule?.predicateExpression || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [suggestedResolution, setSuggestedResolution] = useState(rule?.suggestedResolution || "");
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const r = mobileStore.getRule(id);
      if (r) {
        setRule(r);
        setName(r.name);
        setSeverity(r.severity);
        setType(r.type);
        setPredicateExpression(r.predicateExpression);
        setDescription(r.description);
        setSuggestedResolution(r.suggestedResolution || "");
        setEnabled(r.enabled);
      }
    }
  }, [id]);

  if (!rule) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 px-4 py-8 items-center justify-center">
        <AlertCircle size={32} color="#ef4444" />
        <Text className="mt-3 text-base font-bold text-zinc-100">
          Invariant Rule Not Found
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

  const handleSave = () => {
    const finalName = name.trim();
    if (!finalName) {
      setError("Rule name is required.");
      return;
    }

    const finalExpr = predicateExpression.trim();
    if (!finalExpr) {
      setError("Predicate expression is required.");
      return;
    }

    if (id) {
      mobileStore.updateRule(id, {
        name: finalName,
        severity,
        type,
        predicateExpression: finalExpr,
        description: description.trim() || finalName,
        suggestedResolution: suggestedResolution.trim() || undefined,
        enabled,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Invariant Rule",
      `Are you sure you want to delete "${rule.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            mobileStore.deleteRule(id);
            router.back();
          },
        },
      ]
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
              Edit Invariant Rule
            </Text>
            <Text className="text-xs text-zinc-400">
              {rule.name}
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

          {/* Rule Name */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Shield size={16} color="#f59e0b" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Rule Name <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError(null);
              }}
              placeholder="Rule name..."
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Active Status Switch */}
          <View className="mb-5 flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
            <View>
              <Text className="text-xs font-bold text-zinc-200">
                Rule Active Enforcement
              </Text>
              <Text className="text-[11px] text-zinc-400">
                Include this invariant during automated continuity audits
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: "#27272a", true: "#f59e0b" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Severity Picker */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Severity Level
            </Text>
            <View className="flex-row gap-2">
              {SEVERITIES.map((s) => {
                const isSelected = severity === s.value;
                return (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setSeverity(s.value)}
                    activeOpacity={0.7}
                    className={`flex-1 rounded-xl border p-3 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/20"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-center text-xs font-bold ${
                        isSelected ? "text-amber-400" : "text-zinc-400"
                      }`}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Rule Type Picker */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Rule Type Category
            </Text>
            <View className="gap-2">
              {RULE_TYPES.map((rt) => {
                const isSelected = type === rt.value;
                return (
                  <TouchableOpacity
                    key={rt.value}
                    onPress={() => setType(rt.value)}
                    activeOpacity={0.7}
                    className={`rounded-xl border p-3 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-amber-400" : "text-zinc-300"
                      }`}
                    >
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Predicate Expression */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Code2 size={16} color="#a78bfa" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Predicate Expression <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={predicateExpression}
              onChangeText={(t) => {
                setPredicateExpression(t);
                if (error) setError(null);
              }}
              placeholder="Predicate expression..."
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-amber-300"
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Rule Lore Description & Rationale
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Why this invariant must hold true..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[80px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Suggested Resolution */}
          <View className="mb-6">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Suggested Resolution
            </Text>
            <TextInput
              value={suggestedResolution}
              onChangeText={setSuggestedResolution}
              placeholder="Guidance on how author should resolve when flagged..."
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
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
                Save Rule Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 py-3.5"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-400">
                Delete Invariant Rule
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
