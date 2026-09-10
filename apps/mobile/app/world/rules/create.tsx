import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Shield,
  Sparkles,
  AlertCircle,
  Check,
  Code2,
} from "lucide-react-native";
import { mobileStore } from "../../../src/lib/mobileStore.ts";
import { RuleSeverity, RuleType } from "../../../src/lib/types.ts";

const SEVERITIES: { value: RuleSeverity; label: string; color: string }[] = [
  { value: "BLOCKING_ERROR", label: "Blocking Error", color: "text-red-400" },
  { value: "WARNING", label: "Warning", color: "text-amber-400" },
  { value: "ADVISORY_NOTE", label: "Advisory Note", color: "text-blue-400" },
];

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: "STATE_GUARD", label: "State Guard (Status & Invariants)" },
  { value: "NUMERIC_BOUNDS", label: "Numeric Bounds (Metric Limits)" },
  { value: "PREREQUISITE", label: "Prerequisite Guard (Prerequisites)" },
  { value: "RELATIONAL_GUARD", label: "Relational Guard (Relationships)" },
  { value: "FORMULA_BOUNDARY", label: "Formula Boundary (Calculated Rules)" },
];

export default function CreateInvariantRuleScreen() {
  const blueprints = mobileStore.getFirstClassBlueprints();

  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<RuleSeverity>("BLOCKING_ERROR");
  const [type, setType] = useState<RuleType>("STATE_GUARD");
  const [targetBlueprintId, setTargetBlueprintId] = useState<string>("");
  const [predicateExpression, setPredicateExpression] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedResolution, setSuggestedResolution] = useState("");
  const [error, setError] = useState<string | null>(null);

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

    const targetBp = blueprints.find((b) => b.id === targetBlueprintId);

    mobileStore.addRule({
      name: finalName,
      severity,
      type,
      targetBlueprintId: targetBlueprintId || undefined,
      targetBlueprintName: targetBp?.name || undefined,
      predicateExpression: finalExpr,
      description: description.trim() || finalName,
      suggestedResolution: suggestedResolution.trim() || undefined,
    });

    router.back();
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
              Create Invariant Rule
            </Text>
            <Text className="text-xs text-zinc-400">
              World Audit & Consistency Guard
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
              placeholder="e.g. Fallen Characters Cannot Engage In Active Battle"
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
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
              placeholder="e.g. entity.status != 'DEAD' && entity.qi >= 0"
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-amber-300"
            />
            <Text className="mt-1.5 text-[10px] text-zinc-400">
              Evaluated during continuity audits against folded entity states.
            </Text>
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Rule Lore Description & Rationale
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Why this invariant must hold true across your canon..."
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
                Register Invariant Rule
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
