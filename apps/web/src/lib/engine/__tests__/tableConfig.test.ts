import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAvailableColumnsForBlueprint,
  getDefaultVisibleColumns,
  formatTableCellValue,
  CORE_TABLE_COLUMNS,
  type TableBlueprintDef,
  type TableEntityItem,
} from '../tableConfig.ts';

describe('BLOCK_WORLD_TABLE_CONFIG_001: Table Column Customization Engine', () => {
  const mockCharacterBlueprint: TableBlueprintDef = {
    id: 'bp-character',
    name: 'Character Archetype',
    blueprintClass: 'FIRST_CLASS',
    category: 'Characters',
    fields: [
      { id: 'f1', name: 'gender', label: 'Gender', fieldType: 'ENUM' },
      { id: 'f1_vt', name: 'rarity', label: 'Rarity Tier', fieldType: 'VALUE_TYPE' },
      { id: 'f2', name: 'attack', label: 'Base Attack', fieldType: 'NUMBER', unit: 'pts' },
      { id: 'f3', name: 'combat_power', label: 'Combat Power', fieldType: 'FORMULA' },
      { id: 'f4', name: 'cultivation', label: 'Cultivation Realm', fieldType: 'BLUEPRINT_REF' },
    ],
  };

  const mockEntity: TableEntityItem = {
    id: 'ent-1',
    name: 'Li Chen',
    blueprintId: 'bp-character',
    blueprintName: 'Character Archetype',
    category: 'Characters',
    description: 'A prodigy of the Azure Cloud Sect.',
    lastMutatedSeqNumber: 5,
    properties: {
      gender: 'Male',
      rarity: 'Divine',
      attack: 1500,
      cultivation: { major_realm: 'Foundation', minor_level: 3 },
    },
    computedFormulas: {
      combat_power: 3000,
    },
  };

  it('should generate correct available columns for global and per-blueprint views', () => {
    const globalCols = getAvailableColumnsForBlueprint();
    assert.equal(globalCols.length, CORE_TABLE_COLUMNS.length + 1); // core + computed_formulas

    const charCols = getAvailableColumnsForBlueprint(mockCharacterBlueprint);
    assert.equal(charCols.length, CORE_TABLE_COLUMNS.length + 5);
    assert.ok(charCols.some((c) => c.id === 'prop:gender' && c.category === 'dynamic'));
    assert.ok(charCols.some((c) => c.id === 'prop:rarity' && c.fieldType === 'VALUE_TYPE'));
    assert.ok(charCols.some((c) => c.id === 'prop:attack' && c.unit === 'pts'));
    assert.ok(charCols.some((c) => c.id === 'formula:combat_power' && c.category === 'formula'));
  });

  it('should generate default visible column lists per blueprint', () => {
    const globalDefaults = getDefaultVisibleColumns();
    assert.deepEqual(globalDefaults, ['name', 'blueprintName', 'category', 'computed_formulas']);

    const charDefaults = getDefaultVisibleColumns(mockCharacterBlueprint);
    assert.ok(charDefaults.includes('name'));
    assert.ok(charDefaults.includes('category'));
    assert.ok(charDefaults.includes('prop:gender'));
    assert.ok(charDefaults.includes('prop:rarity'));
    assert.ok(charDefaults.includes('formula:combat_power'));
  });

  it('should correctly format various table cell types', () => {
    // Core columns
    assert.equal(formatTableCellValue('name', mockEntity).text, 'Li Chen');
    assert.equal(formatTableCellValue('blueprintName', mockEntity).text, 'Character Archetype');
    assert.equal(formatTableCellValue('lastMutatedSeqNumber', mockEntity).text, '#5');

    // Dynamic number with unit
    const attackCell = formatTableCellValue('prop:attack', mockEntity, mockCharacterBlueprint);
    assert.equal(attackCell.text, '1500 pts');

    // Dynamic enum/string
    const genderCell = formatTableCellValue('prop:gender', mockEntity, mockCharacterBlueprint);
    assert.equal(genderCell.text, 'Male');

    // Dynamic value type
    const rarityCell = formatTableCellValue('prop:rarity', mockEntity, mockCharacterBlueprint);
    assert.equal(rarityCell.text, 'Divine');

    // Formula cell
    const powerCell = formatTableCellValue('formula:combat_power', mockEntity, mockCharacterBlueprint);
    assert.equal(powerCell.text, '3,000');
    assert.equal(powerCell.isFormula, true);

    // Sub-blueprint object cell
    const cultCell = formatTableCellValue('prop:cultivation', mockEntity, mockCharacterBlueprint);
    assert.ok(cultCell.text.includes('Foundation'));
    assert.ok(cultCell.subValues && cultCell.subValues.length === 2);
  });
});
