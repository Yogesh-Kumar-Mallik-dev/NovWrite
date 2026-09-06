/**
 * @file schemaEngine.ts
 * @description Dynamic Entity Schema & Property Management Engine.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */

import {
  EntityTypeDef,
  DynamicPropertyDef,
  ValidationResult,
} from "./schemaTypes.js";
import { validateEntityProperties } from "./propertyValidator.js";
import { EntityCategory } from "@novwrite/bridge";

export interface DatabaseSchemaClient {
  entityTypeDefinition: {
    findMany: (args: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  dynamicPropertyDefinition: {
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
        "BLOCK_WORLD_DYNAMIC_SCHEMA_001: Database client is required for DynamicSchemaEngine",
      );
    }
    this.db = dbClient;
  }

  /**
   * Register a new Entity Type Definition (e.g. Cultivator, Spirit Beast, Sacred Weapon)
   */
  async createEntityType(
    projectId: string,
    name: string,
    category: EntityCategory,
    description?: string,
  ): Promise<EntityTypeDef> {
    if (!name || name.trim() === "") {
      throw new Error(
        "BLOCK_WORLD_DYNAMIC_SCHEMA_001: Entity type name cannot be empty",
      );
    }

    const created = await this.db.entityTypeDefinition.create({
      data: {
        projectId,
        name: name.trim(),
        category,
        description,
      },
      include: {
        properties: true,
      },
    });

    return {
      id: created.id,
      projectId: created.projectId,
      name: created.name,
      category: created.category as EntityCategory,
      description: created.description,
      properties: (created.properties || []).map((p: any) => ({
        id: p.id,
        projectId: p.projectId,
        entityTypeId: p.entityTypeId,
        name: p.name,
        propertyType: p.propertyType,
        defaultValue: p.defaultValue,
        validation: p.validation,
      })),
    };
  }

  /**
   * Attach a new dynamic property to an entity type
   */
  async addPropertyToEntityType(
    projectId: string,
    entityTypeId: string,
    property: Omit<DynamicPropertyDef, "id" | "projectId" | "entityTypeId">,
  ): Promise<DynamicPropertyDef> {
    if (!property.name || property.name.trim() === "") {
      throw new Error(
        "BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property name cannot be empty",
      );
    }

    const created = await this.db.dynamicPropertyDefinition.create({
      data: {
        projectId,
        entityTypeId,
        name: property.name.trim(),
        propertyType: property.propertyType,
        defaultValue: property.defaultValue,
        validation: property.validation,
      },
    });

    return {
      id: created.id,
      projectId: created.projectId,
      entityTypeId: created.entityTypeId,
      name: created.name,
      propertyType: created.propertyType,
      defaultValue: created.defaultValue,
      validation: created.validation,
    };
  }

  /**
   * Fetch all entity type definitions with their dynamic properties for a project
   */
  async getProjectEntityTypes(projectId: string): Promise<EntityTypeDef[]> {
    const records = await this.db.entityTypeDefinition.findMany({
      where: { projectId },
      include: { properties: true },
    });

    return records.map((r: any) => ({
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      category: r.category as EntityCategory,
      description: r.description,
      properties: (r.properties || []).map((p: any) => ({
        id: p.id,
        projectId: p.projectId,
        entityTypeId: p.entityTypeId,
        name: p.name,
        propertyType: p.propertyType,
        defaultValue: p.defaultValue,
        validation: p.validation,
      })),
    }));
  }

  /**
   * Validate raw property payload against the active entity type schema
   */
  async validatePropertiesForEntityType(
    projectId: string,
    entityTypeId: string,
    rawProperties: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const entityType = await this.db.entityTypeDefinition.findUnique({
      where: { id: entityTypeId },
      include: { properties: true },
    });

    if (!entityType) {
      return {
        valid: false,
        coercedProperties: {},
        errors: [
          {
            propertyKey: "_schema",
            code: "ENTITY_TYPE_NOT_FOUND",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Entity type ID '${entityTypeId}' not found in project.`,
          },
        ],
      };
    }

    const propDefs: DynamicPropertyDef[] = (entityType.properties || []).map(
      (p: any) => ({
        id: p.id,
        projectId: p.projectId,
        entityTypeId: p.entityTypeId,
        name: p.name,
        propertyType: p.propertyType,
        defaultValue: p.defaultValue,
        validation: p.validation,
      }),
    );

    return validateEntityProperties(propDefs, rawProperties);
  }
}
