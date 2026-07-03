export const defaults = {
    searchableFields: [] as const,
    filterableFields: [] as const,
    sortableFields: [
        "createdAt",
        "updatedAt",
    ] as const,

    defaultOrderBy: {
        createdAt: "desc" as const,
    },
};
