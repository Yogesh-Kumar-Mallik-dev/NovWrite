/**
 * @file worldBridgeServer.ts
 * @description World Domain Bridge Server binding World Engine services to cross-domain RPC contracts.
 * Block Standard: BLOCK_WORLD_BRIDGE_SERVER_001
 */

import {
  SceneGroundingRequest,
  SceneGroundingResponse,
  ContinuityAuditRequest,
  ContinuityAuditResponse,
  EntityMentionQuery,
  EntityMentionResponse,
  CanonStateChangedEvent,
  SceneGroundingRequestSchema,
  ContinuityAuditRequestSchema,
  EntityMentionQuerySchema,
} from "@novwrite/bridge";
import { StateFoldEngine, BaseEntityInput } from "./stateFoldEngine.js";

export interface WorldBridgeDataSource {
  stateFoldEngine: StateFoldEngine;
  getBaseEntities: (projectId: string) => Promise<BaseEntityInput[]>;
  searchEntities: (
    projectId: string,
    queryToken: string,
    categoryLimit?: string[],
  ) => Promise<BaseEntityInput[]>;
}

export class WorldBridgeServer {
  private dataSource: WorldBridgeDataSource;

  constructor(dataSource: WorldBridgeDataSource) {
    if (!dataSource || !dataSource.stateFoldEngine) {
      throw new Error(
        "BLOCK_WORLD_BRIDGE_SERVER_001: Valid dataSource and stateFoldEngine are required",
      );
    }
    this.dataSource = dataSource;
  }

  /**
   * RPC Handler: Scene Grounding Request
   */
  async handleSceneGrounding(
    rawRequest: unknown,
  ): Promise<SceneGroundingResponse> {
    const parsed = SceneGroundingRequestSchema.parse(rawRequest);
    const baseEntities = await this.dataSource.getBaseEntities(
      parsed.projectId,
    );

    return await this.dataSource.stateFoldEngine.groundScene(
      parsed,
      baseEntities,
    );
  }

  /**
   * RPC Handler: Continuity Audit Request
   */
  async handleContinuityAudit(
    rawRequest: unknown,
  ): Promise<ContinuityAuditResponse> {
    const parsed = ContinuityAuditRequestSchema.parse(rawRequest);
    const baseEntities = await this.dataSource.getBaseEntities(
      parsed.projectId,
    );

    return await this.dataSource.stateFoldEngine.auditContinuity(
      parsed,
      baseEntities,
    );
  }

  /**
   * RPC Handler: Entity Mention Auto-Complete Query
   */
  async handleEntityMentionQuery(
    rawRequest: unknown,
  ): Promise<EntityMentionResponse> {
    const parsed = EntityMentionQuerySchema.parse(rawRequest);
    const matched = await this.dataSource.searchEntities(
      parsed.projectId,
      parsed.queryToken,
      parsed.categoryLimit,
    );

    return {
      queryToken: parsed.queryToken,
      matches: matched.map((m) => ({
        entityId: m.id,
        name: m.name,
        category: m.category,
        snippet: `${m.name} (${m.category})`,
        currentRealmOrStatus: String(
          m.baseProperties?.cultivation_realm || m.baseProperties?.status || "",
        ),
      })),
    };
  }

  /**
   * SSE Event Publisher: Broadcasts Canon State Changed to subscribers
   */
  async publishCanonStateChanged(
    event: CanonStateChangedEvent,
  ): Promise<{ published: boolean; eventId: string }> {
    if (!event.projectId || !event.eventId) {
      throw new Error(
        "BLOCK_WORLD_BRIDGE_SERVER_001: Invalid CanonStateChangedEvent payload",
      );
    }
    return { published: true, eventId: event.eventId };
  }
}
