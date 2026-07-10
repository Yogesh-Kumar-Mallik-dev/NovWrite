"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Table, type TableColumn } from "@/components/motion/table";
import { Button } from "@/components/ui/button";

import type { ListPayload } from "@/refrence/listPayload";

type SpiritRoot = {
  id: string;
  elements: string[];
  breakthroughMultiplier: number | null;
  basePowerMultiplier: number | null;
  description: string;
  createdAt: string;
  updatedAt: string;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function SpiritRootTable() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const limit = 30;

  const { data, isLoading, isFetching } =
    useQuery<ListPayload<SpiritRoot>>({
      queryKey: ["spirit-roots", page],
      queryFn: async () => {
        const response = await fetch(
          `/api/v1/spiritRoots?page=${page}&limit=${limit}`,
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch spirit roots.",
          );
        }

        return response.json();
      },
      placeholderData: (previousData) => previousData,
    });

  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = useMemo<TableColumn<SpiritRoot>[]>(
    () => [
      {
        key: "elements",
        header: "Elements",
        sortable: true,
        width: "1.3fr",
        cell: (row) => (
          <span className="font-medium">
            {row.elements.join(", ")}
          </span>
        ),
      },
      {
        key: "description",
        header: "Description",
        width: "2.4fr",
        cell: (row) => (
          <span className="block truncate">
            {row.description}
          </span>
        ),
      },
      {
        key: "breakthroughMultiplier",
        header: "Breakthrough",
        sortable: true,
        align: "right",
        width: "1.5fr",
        cell: (row) => (
          <span className="tabular-nums">
            {row.breakthroughMultiplier ?? "—"}
          </span>
        ),
      },
      {
        key: "basePowerMultiplier",
        header: "Power",
        sortable: true,
        align: "right",
        width: "1.4fr",
        cell: (row) => (
          <span className="tabular-nums">
            {row.basePowerMultiplier ?? "—"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        width: "1.3fr",
        cell: (row) => (
          <span className="tabular-nums">
            {DATE_FORMATTER.format(
              new Date(row.createdAt),
            )}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-foreground">
            Total Items:{" "}
            <span className="font-mono tabular-nums">
              {pagination?.totalItems.toLocaleString() ?? 0}
            </span>
          </span>

          {selected.length > 0 && (
            <span className="text-sm font-semibold text-foreground">
              Selected:{" "}
              <span className="font-mono tabular-nums">
                {selected.length.toLocaleString()}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={
              !pagination?.hasPrevious ||
              isFetching
            }
            onClick={() =>
              setPage((previous) => previous - 1)
            }
          >
            Previous
          </Button>

          <span>
            Page {pagination?.page ?? 1} of{" "}
            {pagination?.totalPages ?? 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={
              !pagination?.hasNext ||
              isFetching
            }
            onClick={() =>
              setPage((previous) => previous + 1)
            }
          >
            Next
          </Button>
        </div>
      </div>

      <Table
        data={rows}
        columns={columns}
        loading={isLoading}
        selectable
        resizable
        reorderable
        scrollProgress
        selectedRowIds={selected}
        onSelectionChange={setSelected}
        defaultSort={{
          key: "createdAt",
          direction: "desc",
        }}
        getRowId={(row) => row.id}
        height={420}
        rowHeight={52}
        className="rounded-2xl"
      />
    </div>
  );
}
