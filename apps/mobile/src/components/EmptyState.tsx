/**
 * @file EmptyState.tsx
 * @description Mobile adaptation of apps/web/src/lib/components/ui/empty-state.svelte
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FolderOpen } from "lucide-react-native";

interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon: IconComp = FolderOpen,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: compact ? 24 : 40,
        paddingHorizontal: 20,
        backgroundColor: "rgba(18, 18, 21, 0.5)",
        borderColor: "#27272a",
        borderWidth: 1,
        borderStyle: "dashed",
        borderRadius: 12,
        gap: 8,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: "rgba(124, 58, 237, 0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <IconComp size={24} color="#7c3aed" />
      </View>

      <Text
        style={{
          color: "#fafafa",
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "center",
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: "#a1a1aa",
          fontSize: 12,
          textAlign: "center",
          lineHeight: 18,
          maxWidth: 380,
        }}
      >
        {description}
      </Text>

      {(actionText || secondaryActionText) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {secondaryActionText && (
            <TouchableOpacity
              onPress={onSecondaryAction}
              style={{
                backgroundColor: "#1e1e24",
                borderColor: "#27272a",
                borderWidth: 1,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                minHeight: 38,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#fafafa", fontSize: 12, fontWeight: "600" }}
              >
                {secondaryActionText}
              </Text>
            </TouchableOpacity>
          )}

          {actionText && (
            <TouchableOpacity
              onPress={onAction}
              style={{
                backgroundColor: "#7c3aed",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                minHeight: 38,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}
              >
                {actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
