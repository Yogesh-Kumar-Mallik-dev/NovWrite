export interface TableBlueprintDef {
  id: string;
  name: string;
  blueprintClass?: string;
  category?: string;
  fields: Array<{
    id: string;
    name: string;
    label?: string;
    fieldType: string;
    unit?: string;
  }>;
}

export interface TableEntityItem {
  id: string;
  name: string;
  blueprintId: string;
  blueprintName: string;
  category: string;
  description?: string;
  lastMutatedSeqNumber: number;
  properties: Record<string, any>;
  computedFormulas?: Record<string, number>;
}

export interface TableColumnDef {
  id: string; // e.g. "name", "blueprintName", "category", "prop:gender", "formula:combat_power", etc.
  label: string;
  category: 'core' | 'dynamic' | 'formula';
  fieldType?: string;
  unit?: string;
}

export const CORE_TABLE_COLUMNS: TableColumnDef[] = [
  { id: 'name', label: 'Entity Name', category: 'core' },
  { id: 'blueprintName', label: 'Blueprint Archetype', category: 'core' },
  { id: 'category', label: 'Category', category: 'core' },
  { id: 'description', label: 'Description & Lore', category: 'core' },
  { id: 'lastMutatedSeqNumber', label: 'Sequence Version', category: 'core' },
];

/**
 * Computes all available column definitions for a given blueprint (or global view).
 */
export function getAvailableColumnsForBlueprint(blueprint?: TableBlueprintDef): TableColumnDef[] {
  const columns: TableColumnDef[] = [...CORE_TABLE_COLUMNS];

  if (!blueprint) {
    // If no specific blueprint, add standard computed formula column
    columns.push({
      id: 'computed_formulas',
      label: 'Live Computed Formulas',
      category: 'formula',
    });
    return columns;
  }

  // Dynamic fields from the blueprint
  for (const field of blueprint.fields) {
    if (field.fieldType === 'FORMULA') {
      columns.push({
        id: `formula:${field.name}`,
        label: field.label || field.name,
        category: 'formula',
        fieldType: 'FORMULA',
      });
    } else {
      columns.push({
        id: `prop:${field.name}`,
        label: field.label || field.name,
        category: 'dynamic',
        fieldType: field.fieldType,
        unit: field.unit,
      });
    }
  }

  return columns;
}

/**
 * Returns default visible column IDs for a given blueprint.
 */
export function getDefaultVisibleColumns(blueprint?: TableBlueprintDef): string[] {
  if (!blueprint) {
    return ['name', 'blueprintName', 'category', 'computed_formulas'];
  }

  const defaultIds = ['name', 'category'];
  for (const field of blueprint.fields) {
    if (field.fieldType === 'FORMULA') {
      defaultIds.push(`formula:${field.name}`);
    } else {
      defaultIds.push(`prop:${field.name}`);
    }
  }

  // Limit default to at most 6 columns for clean display
  return defaultIds.slice(0, 6);
}

/**
 * Formats a property or formula value for table display.
 */
export function formatTableCellValue(
  columnId: string,
  entity: TableEntityItem,
  blueprint?: TableBlueprintDef,
): { text: string; isFormula?: boolean; subValues?: Array<{ label: string; value: any }>; arrayValues?: string[] } {
  if (columnId === 'name') {
    return { text: entity.name };
  }
  if (columnId === 'blueprintName') {
    return { text: entity.blueprintName };
  }
  if (columnId === 'category') {
    return { text: entity.category };
  }
  if (columnId === 'description') {
    return { text: entity.description || '—' };
  }
  if (columnId === 'lastMutatedSeqNumber') {
    return { text: `#${entity.lastMutatedSeqNumber}` };
  }
  if (columnId === 'computed_formulas') {
    if (!entity.computedFormulas || Object.keys(entity.computedFormulas).length === 0) {
      return { text: '—' };
    }
    const entries = Object.entries(entity.computedFormulas)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Number(v).toLocaleString()}`)
      .join(', ');
    return { text: entries, isFormula: true };
  }

  if (columnId.startsWith('formula:')) {
    const fKey = columnId.slice(8);
    const fVal = entity.computedFormulas?.[fKey];
    if (fVal !== undefined) {
      return { text: Number(fVal).toLocaleString(), isFormula: true };
    }
    return { text: '—', isFormula: true };
  }

  if (columnId.startsWith('prop:')) {
    const pKey = columnId.slice(5);
    const rawVal = entity.properties?.[pKey];

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return { text: '—' };
    }

    if (typeof rawVal === 'boolean') {
      return { text: rawVal ? 'True' : 'False' };
    }

    if (typeof rawVal === 'number') {
      const field = blueprint?.fields.find((f) => f.name === pKey);
      return { text: field?.unit ? `${rawVal} ${field.unit}` : String(rawVal) };
    }

    if (Array.isArray(rawVal)) {
      if (rawVal.length === 0) {
        return { text: '—', arrayValues: [] };
      }
      return {
        text: rawVal.map(String).join(', '),
        arrayValues: rawVal.map(String),
      };
    }

    if (typeof rawVal === 'object') {
      // Nested object (e.g. sub-blueprint reference)
      const subItems = Object.entries(rawVal).map(([subK, subV]) => ({
        label: subK.replace(/_/g, ' '),
        value: subV,
      }));
      const summary = subItems.map((item) => `${item.label}: ${item.value}`).join(' · ');
      return { text: summary, subValues: subItems };
    }

    return { text: String(rawVal) };
  }

  return { text: '—' };
}
