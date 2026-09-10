/**
 * @file Pagination.tsx
 * @description Mobile adaptation of apps/web/src/lib/components/ui/pagination.svelte
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface PaginationProps {
  page?: number;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
  totalItems?: number;
  totalPages?: number;
  itemLabel?: string;
  onPageChange: (newPage: number) => void;
}

export function Pagination({
  page: propPage,
  currentPage: propCurrentPage,
  pageSize = 10,
  totalCount: propTotalCount,
  totalItems: propTotalItems,
  totalPages: propTotalPages,
  itemLabel = "items",
  onPageChange,
}: PaginationProps) {
  const page = propCurrentPage ?? propPage ?? 1;
  const totalCount = propTotalItems ?? propTotalCount ?? 0;
  const totalPages =
    propTotalPages !== undefined
      ? propTotalPages
      : Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(totalCount, page * pageSize);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "rgba(18, 18, 21, 0.8)",
        borderBottomWidth: 1,
        borderBottomColor: "#27272a",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <Text style={{ color: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}>
        {totalCount === 0
          ? `0 ${itemLabel}`
          : `Showing ${startItem}–${endItem} of ${totalCount} ${itemLabel}`}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <TouchableOpacity
          disabled={!hasPreviousPage}
          onPress={() => onPageChange(page - 1)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            backgroundColor: "#1e1e24",
            borderColor: "#27272a",
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            opacity: hasPreviousPage ? 1 : 0.4,
            minHeight: 32,
          }}
        >
          <ChevronLeft size={14} color="#fafafa" />
          <Text style={{ color: "#fafafa", fontSize: 11, fontWeight: "600" }}>
            Prev
          </Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: "#121215",
            borderColor: "#27272a",
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            minHeight: 32,
            justifyContent: "center",
          }}
        >
          <Text
            style={{ color: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
          >
            {page} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          disabled={!hasNextPage}
          onPress={() => onPageChange(page + 1)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            backgroundColor: "#1e1e24",
            borderColor: "#27272a",
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            opacity: hasNextPage ? 1 : 0.4,
            minHeight: 32,
          }}
        >
          <Text style={{ color: "#fafafa", fontSize: 11, fontWeight: "600" }}>
            Next
          </Text>
          <ChevronRight size={14} color="#fafafa" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
