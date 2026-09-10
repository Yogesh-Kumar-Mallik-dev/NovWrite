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
  User,
  Sparkles,
  AlertCircle,
  Check,
  Code2,
  ListFilter,
  Plus,
  Trash2,
  Calculator,
  Boxes,
} from "lucide-react-native";
import { mobileStore } from "../../../src/lib/mobileStore.ts";
import { BlueprintDef, EntityItem } from "../../../src/lib/types.ts";

export default function EditEntityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entity, setEntity] = useState(() => (id ? mobileStore.getEntity(id) : undefined));

  const [name, setName] = useState(entity?.name || "");
  const [category, setCategory] = useState(entity?.category || "");
  const [description, setDescription] = useState(entity?.description || "");
  const [properties, setProperties] = useState<Record<string, any>>(entity?.properties || {});
  const [rawJson, setRawJson] = useState<string>(() => JSON.stringify(entity?.properties || {}, null, 2));
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState("");
  const [customVal, setCustomVal] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const ent = mobileStore.getEntity(id);
      if (ent) {
        setEntity(ent);
        setName(ent.name);
        setCategory(ent.category);
        setDescription(ent.description);
        setProperties(ent.properties);
        setRawJson(JSON.stringify(ent.properties, null, 2));
      }
    }
  }, [id]);

  if (!entity) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 px-4 py-8 items-center justify-center">
        <AlertCircle size={32} color="#ef4444" />
        <Text className="mt-3 text-base font-bold text-zinc-100">
          Entity Not Found
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

  const blueprint = mobileStore.getBlueprint(entity.blueprintId);
  const computedFormulas = mobileStore.evaluateEntityFormulas(entity.id);

  const handlePropertyChange = (key: string, value: any) => {
    const updated = { ...properties, [key]: value };
    setProperties(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const handleAddCustomProp = () => {
    const k = customKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!k) return;
    const v = isNaN(Number(customVal)) ? customVal : Number(customVal);
    handlePropertyChange(k, v);
    setCustomKey("");
    setCustomVal("");
  };

  const handleRemoveCustomProp = (key: string) => {
    const updated = { ...properties };
    delete updated[key];
    setProperties(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const handleJsonChange = (text: string) => {
    setRawJson(text);
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        setProperties(parsed);
        setJsonError(null);
      } else {
        setJsonError("JSON root must be an object.");
      }
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON syntax.");
    }
  };

  const handleSave = () => {
    const finalName = name.trim();
    if (!finalName) {
      setError("Entity name is required.");
      return;
    }

    let finalProps = properties;
    if (mode === "json") {
      try {
        finalProps = JSON.parse(rawJson);
      } catch (e) {
        setError("Please fix JSON syntax errors before saving.");
        return;
      }
    }

    if (id) {
      mobileStore.updateEntity(id, {
        name: finalName,
        category: category.trim() || blueprint?.category || "General",
        description: description.trim(),
        properties: finalProps,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Entity",
      `Are you sure you want to delete "${entity.name}" from the active canon?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            mobileStore.deleteEntity(id);
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
              Edit Entity
            </Text>
            <Text className="text-xs text-zinc-400">
              {entity.name} · {entity.blueprintName}
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

          {/* Computed Dynamic Formulas Breakdown */}
          {Object.keys(computedFormulas).length > 0 && (
            <View className="mb-5 rounded-xl border border-violet-500/30 bg-violet-950/20 p-4">
              <View className="mb-2.5 flex-row items-center gap-2">
                <Calculator size={16} color="#a78bfa" />
                <Text className="text-xs font-bold uppercase tracking-wider text-violet-300">
                  Computed Dynamic AST Formulas
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {Object.entries(computedFormulas).map(([fKey, fVal]) => (
                  <View
                    key={fKey}
                    className="flex-row items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-900/30 px-3 py-1.5"
                  >
                    <Text className="text-xs font-medium text-violet-300">
                      {fKey}:
                    </Text>
                    <Text className="font-mono text-xs font-bold text-amber-300">
                      {fVal}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Entity Name */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <User size={16} color="#3b82f6" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Entity Name <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError(null);
              }}
              placeholder="e.g. Lin Dong"
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Domain Category */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Domain Category
            </Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Characters, Relics, Sects"
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Lore Description & Identity
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Narrative background..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[80px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Mode Switcher: Visual Form vs Raw JSON */}
          <View className="mb-4 flex-row items-center justify-between border-b border-zinc-800 pb-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Entity State Properties
            </Text>
            <View className="flex-row rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              <TouchableOpacity
                onPress={() => setMode("visual")}
                className={`flex-row items-center gap-1.5 rounded-md px-3 py-1.5 ${
                  mode === "visual" ? "bg-amber-500" : "bg-transparent"
                }`}
              >
                <ListFilter
                  size={13}
                  color={mode === "visual" ? "#09090b" : "#a1a1aa"}
                />
                <Text
                  className={`text-xs font-bold ${
                    mode === "visual" ? "text-zinc-950" : "text-zinc-400"
                  }`}
                >
                  Visual Form
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode("json")}
                className={`flex-row items-center gap-1.5 rounded-md px-3 py-1.5 ${
                  mode === "json" ? "bg-amber-500" : "bg-transparent"
                }`}
              >
                <Code2
                  size={13}
                  color={mode === "json" ? "#09090b" : "#a1a1aa"}
                />
                <Text
                  className={`text-xs font-bold ${
                    mode === "json" ? "text-zinc-950" : "text-zinc-400"
                  }`}
                >
                  Raw JSON
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {mode === "visual" ? (
            <View className="mb-6 gap-4">
              {/* Dynamic Blueprint Fields */}
              {blueprint?.fields
                .filter((f) => f.fieldType !== "FORMULA")
                .map((field) => {
                  const key = field.key || field.name;
                  const val = properties[key];

                  return (
                    <View
                      key={field.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5"
                    >
                      <View className="mb-1.5 flex-row items-center justify-between">
                        <Text className="text-xs font-bold text-zinc-200">
                          {field.label || field.name}
                        </Text>
                        <Text className="font-mono text-[10px] text-amber-400">
                          {key}
                        </Text>
                      </View>

                      {field.fieldType === "BOOLEAN" ? (
                        <View className="flex-row items-center justify-between pt-1">
                          <Text className="text-xs text-zinc-400">
                            {val ? "Enabled (true)" : "Disabled (false)"}
                          </Text>
                          <Switch
                            value={!!val}
                            onValueChange={(v) => handlePropertyChange(key, v)}
                            trackColor={{ false: "#27272a", true: "#f59e0b" }}
                            thumbColor="#ffffff"
                          />
                        </View>
                      ) : field.fieldType === "NUMBER" ? (
                        <TextInput
                          value={val !== undefined ? String(val) : ""}
                          onChangeText={(t) =>
                            handlePropertyChange(
                              key,
                              t === "" ? undefined : Number(t)
                            )
                          }
                          keyboardType="numeric"
                          placeholder="Numeric value"
                          placeholderTextColor="#71717a"
                          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                        />
                      ) : field.fieldType === "ENUM" ||
                        field.fieldType === "VALUE_TYPE" ? (
                        <View className="flex-row flex-wrap gap-1.5 pt-1">
                          {(field.options || []).map((opt) => {
                            const optVal =
                              typeof opt === "string" ? opt : opt.value || opt.label;
                            const optLabel =
                              typeof opt === "string" ? opt : opt.label;
                            const isSelected = val === optVal;

                            return (
                              <TouchableOpacity
                                key={optVal}
                                onPress={() =>
                                  handlePropertyChange(key, optVal)
                                }
                                activeOpacity={0.7}
                                className={`rounded-lg border px-2.5 py-1.5 ${
                                  isSelected
                                    ? "border-amber-500 bg-amber-500/20"
                                    : "border-zinc-800 bg-zinc-950"
                                }`}
                              >
                                <Text
                                  className={`text-xs font-medium ${
                                    isSelected
                                      ? "text-amber-400"
                                      : "text-zinc-400"
                                  }`}
                                >
                                  {optLabel}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <TextInput
                          value={val !== undefined ? String(val) : ""}
                          onChangeText={(t) => handlePropertyChange(key, t)}
                          placeholder={`Enter ${field.label || field.name}...`}
                          placeholderTextColor="#71717a"
                          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                        />
                      )}
                    </View>
                  );
                })}

              {/* Custom State Properties Builder */}
              <View className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <Text className="mb-2 text-xs font-bold text-zinc-200">
                  Custom Properties & Modifiers
                </Text>
                <View className="mb-3 flex-row gap-2">
                  <TextInput
                    value={customKey}
                    onChangeText={setCustomKey}
                    placeholder="property_key"
                    placeholderTextColor="#71717a"
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100"
                  />
                  <TextInput
                    value={customVal}
                    onChangeText={setCustomVal}
                    placeholder="Value"
                    placeholderTextColor="#71717a"
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                  />
                  <TouchableOpacity
                    onPress={handleAddCustomProp}
                    activeOpacity={0.7}
                    className="items-center justify-center rounded-lg bg-amber-500 px-3 py-2"
                  >
                    <Plus size={16} color="#09090b" />
                  </TouchableOpacity>
                </View>

                {Object.entries(properties)
                  .filter(
                    ([k]) =>
                      !blueprint?.fields.some(
                        (f) => (f.key || f.name) === k
                      )
                  )
                  .map(([k, v]) => (
                    <View
                      key={k}
                      className="mb-2 flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2.5"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="font-mono text-xs font-bold text-amber-400">
                          {k}
                        </Text>
                        <Text className="text-xs text-zinc-300">
                          {String(v)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveCustomProp(k)}
                        activeOpacity={0.7}
                        className="p-1"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            </View>
          ) : (
            <View className="mb-6">
              {jsonError ? (
                <View className="mb-2 flex-row items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/30 p-2.5">
                  <AlertCircle size={14} color="#ef4444" />
                  <Text className="text-[11px] text-red-300">{jsonError}</Text>
                </View>
              ) : null}
              <TextInput
                value={rawJson}
                onChangeText={handleJsonChange}
                placeholder={'{\n  "key": "value"\n}'}
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                className="min-h-[220px] rounded-xl border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-emerald-400"
              />
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5"
            >
              <Check size={18} color="#09090b" />
              <Text className="text-sm font-bold text-zinc-950">
                Save Entity Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 py-3.5"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-400">
                Delete Entity
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
