"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, type TableColumn } from "@/components/motion/table";
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
  const { data, isLoading } = useQuery<ListPayload<SpiritRoot>>({
    queryKey: ["spirit-roots"],
    queryFn: async () => {
      const response = await fetch("/api/v1/spiritRoots");

      if (!response.ok) {
        throw new Error("Failed to fetch spirit roots.");
      }

      return response.json();
    },
  });

  const [selected, setSelected] = useState<string[]>([]);

  const rows = data?.data ?? [];

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
  );;

  return (
    <div className="flex w-full justify-center p-4">
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>{rows.length.toLocaleString()} rows</span>

          {selected.length > 0 ? (
            <span>{selected.length.toLocaleString()} selected</span>
          ) : null}
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
    </div>
  );
}
