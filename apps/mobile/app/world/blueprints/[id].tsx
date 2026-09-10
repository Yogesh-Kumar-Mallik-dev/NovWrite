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
  Boxes,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Check,
  Calculator,
  Layers,
} from "lucide-react-native";
import { mobileStore } from "../../../src/lib/mobileStore.ts";
import {
  BlueprintClass,
  BlueprintFieldType,
  DynamicFieldDef,
} from "../../../src/lib/types.ts";
import { validateFormulaSyntax } from "../../../src/lib/formulaEngine.ts";

const SUGGESTED_CATEGORIES = [
  "Characters",
  "Relics & Armaments",
  "Cosmology & Geography",
  "Sects & Factions",
  "Systems & Affection",
  "Power Systems",
];

const FIELD_TYPES: { value: BlueprintFieldType; label: string }[] = [
  { value: "STRING", label: "Text (String)" },
  { value: "NUMBER", label: "Number (Numeric Bound)" },
  { value: "BOOLEAN", label: "Toggle (Boolean)" },
  { value: "ENUM", label: "Enum (Discrete String Options)" },
  { value: "VALUE_TYPE", label: "Value Type (Enum with Power Weights)" },
  { value: "ARRAY", label: "Array / Tag List" },
  { value: "BLUEPRINT_REF", label: "Blueprint Reference" },
  { value: "ARRAY_REF", label: "Array of Blueprint References" },
  { value: "FORMULA", label: "Formula (AST Math Evaluation)" },
];

export default function EditBlueprintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [blueprint, setBlueprint] = useState(() =>
    id ? mobileStore.getBlueprint(id) : undefined,
  );

  const [name, setName] = useState(blueprint?.name || "");
  const [blueprintClass, setBlueprintClass] = useState<BlueprintClass>(
    blueprint?.blueprintClass || "FIRST_CLASS",
  );
  const [category, setCategory] = useState(blueprint?.category || "Characters");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState(blueprint?.description || "");
  const [fields, setFields] = useState<DynamicFieldDef[]>(
    blueprint?.fields || [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const bp = mobileStore.getBlueprint(id);
      if (bp) {
        setBlueprint(bp);
        setName(bp.name);
        setBlueprintClass(bp.blueprintClass);
        setCategory(bp.category);
        setDescription(bp.description || "");
        setFields(bp.fields);
      }
    }
  }, [id]);

  if (!blueprint) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 px-4 py-8 items-center justify-center">
        <AlertCircle size={32} color="#ef4444" />
        <Text className="mt-3 text-base font-bold text-zinc-100">
          Blueprint Not Found
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

  const addField = () => {
    const newFieldId = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setFields((prev) => [
      ...prev,
      {
        id: newFieldId,
        name: `field_${prev.length + 1}`,
        key: `field_${prev.length + 1}`,
        label: `Field ${prev.length + 1}`,
        fieldType: "STRING",
        required: false,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<DynamicFieldDef>) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i === index) {
          const updated = { ...f, ...updates };
          if (updates.name && !updates.key) {
            updated.key = updates.name
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_");
          }
          return updated;
        }
        return f;
      }),
    );
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const finalName = name.trim();
    if (!finalName) {
      setError("Blueprint name is required.");
      return;
    }

    const finalCategory =
      (isCustomCategory ? customCategory : category).trim() || "General";

    // Validate formula fields
    for (const f of fields) {
      if (f.fieldType === "FORMULA" && f.formulaExpression) {
        const valRes = validateFormulaSyntax(f.formulaExpression);
        if (!valRes.valid) {
          setError(
            `Invalid formula in field "${f.label || f.name}": ${valRes.error}`,
          );
          return;
        }
      }
    }

    if (id) {
      mobileStore.updateBlueprint(id, {
        name: finalName,
        blueprintClass,
        category: finalCategory,
        description: description.trim(),
        fields,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Blueprint Definition",
      `Are you sure you want to delete "${blueprint.name}"? This will also remove all associated entities from the active universe.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            mobileStore.deleteBlueprint(id);
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
              Edit Blueprint
            </Text>
            <Text className="text-xs text-zinc-400">{blueprint.name}</Text>
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

          {/* Blueprint Name */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Boxes size={16} color="#f59e0b" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Blueprint Name <Text className="text-amber-500">*</Text>
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError(null);
              }}
              placeholder="e.g. Cultivator Archetype, Sacred Armament"
              placeholderTextColor="#71717a"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Blueprint Class */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Blueprint Class Architecture
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setBlueprintClass("FIRST_CLASS")}
                activeOpacity={0.7}
                className={`flex-1 rounded-xl border p-3.5 ${
                  blueprintClass === "FIRST_CLASS"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-xs font-bold ${
                      blueprintClass === "FIRST_CLASS"
                        ? "text-amber-400"
                        : "text-zinc-300"
                    }`}
                  >
                    1st-Class Independent
                  </Text>
                  {blueprintClass === "FIRST_CLASS" && (
                    <Check size={14} color="#f59e0b" />
                  )}
                </View>
                <Text className="mt-1 text-[11px] leading-4 text-zinc-400">
                  Direct timeline mutation tracking and canonical state.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setBlueprintClass("SECOND_CLASS")}
                activeOpacity={0.7}
                className={`flex-1 rounded-xl border p-3.5 ${
                  blueprintClass === "SECOND_CLASS"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-xs font-bold ${
                      blueprintClass === "SECOND_CLASS"
                        ? "text-blue-400"
                        : "text-zinc-300"
                    }`}
                  >
                    2nd-Class Embedded
                  </Text>
                  {blueprintClass === "SECOND_CLASS" && (
                    <Check size={14} color="#3b82f6" />
                  )}
                </View>
                <Text className="mt-1 text-[11px] leading-4 text-zinc-400">
                  Embedded inside parent entity properties.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Domain Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTED_CATEGORIES.map((cat) => {
                const isSelected = !isCustomCategory && category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setIsCustomCategory(false);
                      setCategory(cat);
                    }}
                    activeOpacity={0.7}
                    className={`rounded-lg border px-3 py-2 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/20"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? "text-amber-400" : "text-zinc-400"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Lore Description & Contract
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what entities derived from this blueprint represent..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[80px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
            />
          </View>

          {/* Dynamic Schema Fields Section */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Layers size={16} color="#f59e0b" />
                <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Dynamic Schema Fields ({fields.length})
                </Text>
              </View>
              <TouchableOpacity
                onPress={addField}
                activeOpacity={0.7}
                className="flex-row items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5"
              >
                <Plus size={14} color="#f59e0b" />
                <Text className="text-xs font-bold text-amber-400">
                  Add Field
                </Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {fields.map((field, idx) => (
                <View
                  key={field.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4"
                >
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-zinc-800">
                        <Text className="text-xs font-bold text-zinc-300">
                          {idx + 1}
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-zinc-200">
                        {field.label || field.name || `Field ${idx + 1}`}
                      </Text>
                    </View>
                    {fields.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeField(idx)}
                        activeOpacity={0.7}
                        className="rounded-lg p-1.5 hover:bg-zinc-800"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Field Label & Machine Key */}
                  <View className="mb-3 flex-row gap-2">
                    <View className="flex-1">
                      <Text className="mb-1 text-[11px] font-semibold text-zinc-400">
                        Display Label
                      </Text>
                      <TextInput
                        value={field.label || field.name}
                        onChangeText={(t) =>
                          updateField(idx, { label: t, name: t })
                        }
                        placeholder="e.g. Base Qi"
                        placeholderTextColor="#71717a"
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-[11px] font-semibold text-zinc-400">
                        Machine Key
                      </Text>
                      <TextInput
                        value={field.key || field.name}
                        onChangeText={(t) => updateField(idx, { key: t })}
                        placeholder="e.g. base_qi"
                        placeholderTextColor="#71717a"
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-amber-300"
                      />
                    </View>
                  </View>

                  {/* Field Type Picker */}
                  <View className="mb-3">
                    <Text className="mb-1.5 text-[11px] font-semibold text-zinc-400">
                      Field Type
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row gap-1.5"
                    >
                      {FIELD_TYPES.map((ft) => {
                        const isSelected = field.fieldType === ft.value;
                        return (
                          <TouchableOpacity
                            key={ft.value}
                            onPress={() =>
                              updateField(idx, { fieldType: ft.value })
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
                              {ft.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* FORMULA Field Editor */}
                  {field.fieldType === "FORMULA" && (
                    <View className="mb-3 rounded-lg border border-violet-500/30 bg-violet-950/20 p-3">
                      <View className="mb-1.5 flex-row items-center gap-1.5">
                        <Calculator size={14} color="#a78bfa" />
                        <Text className="text-[11px] font-bold text-violet-300">
                          Formula Expression (AST Evaluated)
                        </Text>
                      </View>
                      <TextInput
                        value={field.formulaExpression || ""}
                        onChangeText={(t) =>
                          updateField(idx, { formulaExpression: t })
                        }
                        placeholder="e.g. (base_qi + gear_bonus) * multiplier"
                        placeholderTextColor="#71717a"
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-violet-200"
                      />
                    </View>
                  )}

                  {/* ENUM / VALUE_TYPE Options Editor */}
                  {(field.fieldType === "ENUM" ||
                    field.fieldType === "VALUE_TYPE") && (
                    <View className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                      <Text className="mb-1.5 text-[11px] font-semibold text-zinc-300">
                        Discrete Options (Comma-separated or label:power)
                      </Text>
                      <TextInput
                        value={
                          Array.isArray(field.options)
                            ? field.options
                                .map((o) =>
                                  typeof o === "string"
                                    ? o
                                    : `${o.label}:${o.power ?? o.numericValue ?? 0}`,
                                )
                                .join(", ")
                            : ""
                        }
                        onChangeText={(t) => {
                          const rawOpts = t
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const parsed = rawOpts.map((optStr) => {
                            if (optStr.includes(":")) {
                              const [lbl, pwr] = optStr.split(":");
                              const numPwr = Number(pwr.trim()) || 0;
                              return {
                                label: lbl.trim(),
                                value: lbl.trim(),
                                power: numPwr,
                                numericValue: numPwr,
                              };
                            }
                            return optStr;
                          });
                          updateField(idx, { options: parsed });
                        }}
                        placeholder="e.g. Qi Refining:100, Foundation:500"
                        placeholderTextColor="#71717a"
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100"
                      />
                    </View>
                  )}

                  {/* Required Switch */}
                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-xs text-zinc-400">
                      Required Field
                    </Text>
                    <Switch
                      value={!!field.required}
                      onValueChange={(v) => updateField(idx, { required: v })}
                      trackColor={{ false: "#27272a", true: "#f59e0b" }}
                      thumbColor="#ffffff"
                    />
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
                Save Blueprint Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 py-3.5"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-400">
                Delete Blueprint Definition
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
