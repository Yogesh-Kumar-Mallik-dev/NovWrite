/**
 * @file schemaEngine.ts
 * @description Dynamic Blueprint & Schema Management Engine.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_002
 */

import {
  BlueprintDef,
  BlueprintClass,
  BlueprintFieldType,
  DynamicFieldDef,
  ValidationResult,
  EntityTypeDef,
  DynamicPropertyDef,
} from "./schemaTypes.js";
import { validateEntityProperties } from "./propertyValidator.js";

export interface DatabaseSchemaClient {
  blueprint?: {
    findMany: (args: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  blueprintField?: {
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  // Legacy aliases
  entityTypeDefinition?: {
    findMany: (args: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  dynamicPropertyDefinition?: {
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
}

export class DynamicSchemaEngine {
  private db: DatabaseSchemaClient;

  constructor(dbClient: DatabaseSchemaClient) {
    if (!dbClient) {
      throw new Error(
        "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Database client is required for DynamicSchemaEngine",
      );
    }
    this.db = dbClient;
  }

  private get blueprintModel() {
    return this.db.blueprint || this.db.entityTypeDefinition;
  }

  private get fieldModel() {
    return this.db.blueprintField || this.db.dynamicPropertyDefinition;
  }

  /**
   * Register a new Blueprint (1st-Class Entity Archetype or 2nd-Class Sub-Schema)
   */
  async createBlueprint(
    projectId: string,
    name: string,
    blueprintClass: BlueprintClass = "FIRST_CLASS",
    category: string = "General",
    description?: string,
    iconName: string = "Sparkles",
  ): Promise<BlueprintDef> {
    if (!name || name.trim() === "") {
      throw new Error(
        "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Blueprint name cannot be empty",
      );
    }

    if (!this.blueprintModel) {
      throw new Error(
        "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Blueprint model not available",
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const created = await this.blueprintModel.create({
      data: {
        projectId,
        name: name.trim(),
        slug,
        blueprintClass,
        category,
        description,
        iconName,
      },
      include: {
        fields: true,
        properties: true,
      },
    });

    return {
      id: created.id,
      projectId: created.projectId,
      name: created.name,
      slug: created.slug,
      blueprintClass: (created.blueprintClass as BlueprintClass) || "FIRST_CLASS",
      category: created.category,
      description: created.description,
      iconName: created.iconName,
      fields: (created.fields || created.properties || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        label: p.label || p.name,
        fieldType: p.fieldType || p.propertyType || "STRING",
        options: p.options || p.validation?.allowedValues,
        targetBlueprintId: p.targetBlueprintId,
        min: p.minVal ?? p.validation?.min,
        max: p.maxVal ?? p.validation?.max,
        step: p.stepVal,
        unit: p.unit,
        formulaExpression: p.formulaExpression,
        isRequired: p.isRequired ?? p.validation?.required ?? false,
        orderIndex: p.orderIndex ?? 0,
      })),
    };
  }

  /**
   * Legacy alias: createEntityType
   */
  async createEntityType(
    projectId: string,
    name: string,
    category: any,
    description?: string,
  ): Promise<EntityTypeDef> {
    const bp = await this.createBlueprint(projectId, name, "FIRST_CLASS", String(category), description);
    return {
      ...bp,
      properties: bp.fields.map((f) => ({
        ...f,
        projectId,
        entityTypeId: bp.id,
        propertyType: f.fieldType,
      })),
    };
  }

  /**
   * Attach a new dynamic field to a blueprint
   */
  async addFieldToBlueprint(
    projectId: string,
    blueprintId: string,
    field: Omit<DynamicFieldDef, "id">,
  ): Promise<DynamicFieldDef> {
    if (!field.name || field.name.trim() === "") {
      throw new Error(
        "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Field name cannot be empty",
      );
    }

    if (!this.fieldModel) {
      throw new Error(
        "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Field model not available",
      );
    }

    const created = await this.fieldModel.create({
      data: {
        projectId,
        blueprintId,
        entityTypeId: blueprintId,
        name: field.name.trim(),
        key: field.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_"),
        label: field.label || field.name,
        fieldType: field.fieldType,
        propertyType: field.fieldType,
        options: field.options || [],
        targetBlueprintId: field.targetBlueprintId,
        minVal: field.min,
        maxVal: field.max,
        stepVal: field.step,
        unit: field.unit,
        formulaExpression: field.formulaExpression,
        isRequired: field.isRequired ?? false,
        orderIndex: field.orderIndex ?? 0,
      },
    });

    return {
      id: created.id,
      name: created.name,
      label: created.label || created.name,
      fieldType: created.fieldType || created.propertyType,
      options: created.options,
      targetBlueprintId: created.targetBlueprintId,
      min: created.minVal,
      max: created.maxVal,
      step: created.stepVal,
      unit: created.unit,
      formulaExpression: created.formulaExpression,
      isRequired: created.isRequired,
      orderIndex: created.orderIndex,
    };
  }

  /**
   * Legacy alias: addPropertyToEntityType
   */
  async addPropertyToEntityType(
    projectId: string,
    entityTypeId: string,
    property: Omit<DynamicPropertyDef, "id" | "projectId" | "entityTypeId">,
  ): Promise<DynamicPropertyDef> {
    let fieldType: BlueprintFieldType = "STRING";
    const pt = property.propertyType || property.fieldType;
    if (pt === "NUMBER" || pt === "BOOLEAN" || pt === "ENUM" || pt === "VALUE_TYPE" || pt === "BLUEPRINT_REF" || pt === "FORMULA") {
      fieldType = pt;
    } else if (pt === "ENUM_SINGLE" || pt === "ENUM_MULTI") {
      fieldType = "ENUM";
    } else if (pt === "ENTITY_REF") {
      fieldType = "BLUEPRINT_REF";
    }

    const res = await this.addFieldToBlueprint(projectId, entityTypeId, {
      name: property.name,
      label: property.name,
      fieldType,
      options: property.validation?.allowedValues,
      min: property.validation?.min,
      max: property.validation?.max,
      isRequired: property.validation?.required,
    });
    return {
      ...res,
      projectId,
      entityTypeId,
      propertyType: res.fieldType,
      defaultValue: property.defaultValue,
      validation: property.validation,
    };
  }

  /**
   * Fetch all blueprints with their dynamic fields for a project
   */
  async getProjectBlueprints(
    projectId: string,
    blueprintClass?: BlueprintClass,
  ): Promise<BlueprintDef[]> {
    if (!this.blueprintModel) return [];

    const where: any = { projectId };
    if (blueprintClass) {
      where.blueprintClass = blueprintClass;
    }

    const records = await this.blueprintModel.findMany({
      where,
      include: { fields: true, properties: true },
    });

    return records.map((r: any) => ({
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      slug: r.slug,
      blueprintClass: (r.blueprintClass as BlueprintClass) || "FIRST_CLASS",
      category: r.category,
      description: r.description,
      iconName: r.iconName,
      fields: (r.fields || r.properties || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        label: p.label || p.name,
        fieldType: p.fieldType || p.propertyType || "STRING",
        options: p.options || p.validation?.allowedValues,
        targetBlueprintId: p.targetBlueprintId,
        min: p.minVal ?? p.validation?.min,
        max: p.maxVal ?? p.validation?.max,
        step: p.stepVal,
        unit: p.unit,
        formulaExpression: p.formulaExpression,
        isRequired: p.isRequired ?? p.validation?.required ?? false,
        orderIndex: p.orderIndex ?? 0,
      })),
    }));
  }

  /**
   * Legacy alias: getProjectEntityTypes
   */
  async getProjectEntityTypes(projectId: string): Promise<EntityTypeDef[]> {
    const bps = await this.getProjectBlueprints(projectId);
    return bps.map((b) => ({
      ...b,
      properties: b.fields.map((f) => ({
        ...f,
        projectId,
        entityTypeId: b.id,
        propertyType: f.fieldType,
      })),
    }));
  }

  /**
   * Validates dynamic entity attributes against a blueprint definition
   */
  validateEntityAttributes(
    blueprint: BlueprintDef,
    properties: Record<string, unknown>,
  ): ValidationResult {
    return validateEntityProperties(blueprint.fields, properties);
  }

  /**
   * Validates properties for a given entity type or blueprint in the project
   */
  async validatePropertiesForEntityType(
    projectId: string,
    entityTypeId: string,
    properties: Record<string, unknown>,
  ): Promise<ValidationResult> {
    if (this.blueprintModel?.findUnique) {
      const record = await this.blueprintModel.findUnique({
        where: { id: entityTypeId },
        include: { fields: true, properties: true },
      });
      if (record) {
        const fields = (record.fields || record.properties || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          label: p.label || p.name,
          fieldType: p.fieldType || p.propertyType || "STRING",
          propertyType: p.fieldType || p.propertyType || "STRING",
          options: p.options || p.validation?.allowedValues,
          targetBlueprintId: p.targetBlueprintId,
          min: p.minVal ?? p.validation?.min,
          max: p.maxVal ?? p.validation?.max,
          step: p.stepVal,
          unit: p.unit,
          formulaExpression: p.formulaExpression,
          isRequired: p.isRequired ?? p.validation?.required ?? false,
          orderIndex: p.orderIndex ?? 0,
          validation: p.validation,
          defaultValue: p.defaultValue,
        }));
        return validateEntityProperties(fields, properties);
      }
    }

    const bps = await this.getProjectBlueprints(projectId);
    const bp = bps.find((b) => b.id === entityTypeId);
    if (!bp) {
      throw new Error(
        `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Blueprint or Entity Type '${entityTypeId}' not found in project '${projectId}'`,
      );
    }
    return this.validateEntityAttributes(bp, properties);
  }
}
