/**
 * @file timelineEngine.ts
 * @description Causal Timeline and Event Sourcing Engine with dual-indexing.
 * Block Standard: BLOCK_WORLD_TIMELINE_ENGINE_001
 */

import {
  TimelineEventInput,
  TimelineEventHydrated,
  TimelineQueryOptions,
  TimelineResequenceItem,
  EventEffectPayload,
  EffectOperation,
} from "./timelineTypes.js";

export interface DatabaseTimelineClient {
  timelineEvent: {
    findMany: (args: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    findFirst?: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
  };
  eventEffect: {
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    createMany: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
  };
  $transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
}

export class TimelineEngine {
  private db: DatabaseTimelineClient;

  constructor(dbClient: DatabaseTimelineClient) {
    if (!dbClient) {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: Database client is required for TimelineEngine",
      );
    }
    this.db = dbClient;
  }

  /**
   * Log an atomic timeline event with attached effect mutations.
   */
  async createEvent(input: TimelineEventInput): Promise<TimelineEventHydrated> {
    this.validateEventInput(input);

    const created = await this.db.timelineEvent.create({
      data: {
        projectId: input.projectId,
        narrativeSequenceNumber: input.narrativeSequenceNumber,
        chronologicalOrder: input.chronologicalOrder,
        title: input.title.trim(),
        description: input.description ?? null,
        anchorSceneId: input.anchorSceneId ?? null,
        effects: {
          create: input.effects.map((eff) => ({
            targetEntity: eff.targetEntity,
            propertyKey: eff.propertyKey,
            operation: eff.operation,
            value: eff.value as any,
          })),
        },
      },
      include: {
        effects: true,
      },
    });

    return this.mapToHydratedEvent(created);
  }

  /**
   * Query timeline events supporting dual-indexing (narrative vs chronological order) and range filters.
   */
  async getEvents(
    projectId: string,
    options?: TimelineQueryOptions,
  ): Promise<TimelineEventHydrated[]> {
    const orderByField =
      options?.orderBy === "chronological"
        ? "chronologicalOrder"
        : "narrativeSequenceNumber";
    const orderDirection = options?.orderDirection === "desc" ? "desc" : "asc";

    const where: Record<string, any> = { projectId };

    if (options?.upToNarrativeSeq !== undefined) {
      where.narrativeSequenceNumber = {
        ...(where.narrativeSequenceNumber || {}),
        lte: options.upToNarrativeSeq,
      };
    }
    if (options?.fromNarrativeSeq !== undefined) {
      where.narrativeSequenceNumber = {
        ...(where.narrativeSequenceNumber || {}),
        gte: options.fromNarrativeSeq,
      };
    }

    if (options?.upToChronologicalOrder !== undefined) {
      where.chronologicalOrder = {
        ...(where.chronologicalOrder || {}),
        lte: options.upToChronologicalOrder,
      };
    }
    if (options?.fromChronologicalOrder !== undefined) {
      where.chronologicalOrder = {
        ...(where.chronologicalOrder || {}),
        gte: options.fromChronologicalOrder,
      };
    }

    if (options?.targetEntityId) {
      where.effects = {
        some: {
          targetEntity: options.targetEntityId,
        },
      };
    }

    const events = await this.db.timelineEvent.findMany({
      where,
      orderBy: {
        [orderByField]: orderDirection,
      },
      take: options?.limit,
      skip: options?.offset,
      include: {
        effects: true,
      },
    });

    return events.map((e: any) => this.mapToHydratedEvent(e));
  }

  /**
   * Retrieve a single timeline event by its ID with all hydrated effects.
   */
  async getEventById(eventId: string): Promise<TimelineEventHydrated | null> {
    const event = await this.db.timelineEvent.findUnique({
      where: { id: eventId },
      include: {
        effects: true,
      },
    });

    if (!event) return null;
    return this.mapToHydratedEvent(event);
  }

  /**
   * Retrieve full event history affecting a specific entity.
   */
  async getEventsForEntity(
    projectId: string,
    entityId: string,
    options?: Omit<TimelineQueryOptions, "targetEntityId">,
  ): Promise<TimelineEventHydrated[]> {
    return this.getEvents(projectId, {
      ...options,
      targetEntityId: entityId,
    });
  }

  /**
   * Update an existing timeline event and optionally replace its effects.
   */
  async updateEvent(
    eventId: string,
    input: Partial<TimelineEventInput>,
  ): Promise<TimelineEventHydrated> {
    if (
      input.narrativeSequenceNumber !== undefined &&
      input.narrativeSequenceNumber < 0
    ) {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: narrativeSequenceNumber cannot be negative",
      );
    }
    if (input.title !== undefined && input.title.trim() === "") {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: Event title cannot be empty",
      );
    }

    // Execute update in transaction if replacing effects
    return await this.db.$transaction(async (tx: any) => {
      const updateData: Record<string, any> = {};
      if (input.title !== undefined) updateData.title = input.title.trim();
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.narrativeSequenceNumber !== undefined) {
        updateData.narrativeSequenceNumber = input.narrativeSequenceNumber;
      }
      if (input.chronologicalOrder !== undefined) {
        updateData.chronologicalOrder = input.chronologicalOrder;
      }
      if (input.anchorSceneId !== undefined) {
        updateData.anchorSceneId = input.anchorSceneId;
      }

      if (input.effects) {
        // Remove existing effects and insert new ones
        await tx.eventEffect.deleteMany({
          where: { eventId },
        });

        updateData.effects = {
          create: input.effects.map((eff) => ({
            targetEntity: eff.targetEntity,
            propertyKey: eff.propertyKey,
            operation: eff.operation,
            value: eff.value as any,
          })),
        };
      }

      const updated = await tx.timelineEvent.update({
        where: { id: eventId },
        data: updateData,
        include: {
          effects: true,
        },
      });

      return this.mapToHydratedEvent(updated);
    });
  }

  /**
   * Delete a timeline event by its ID.
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    await this.db.timelineEvent.delete({
      where: { id: eventId },
    });
    return true;
  }

  /**
   * Resequence multiple events safely.
   */
  async resequenceEvents(
    projectId: string,
    updates: TimelineResequenceItem[],
  ): Promise<TimelineEventHydrated[]> {
    return await this.db.$transaction(async (tx: any) => {
      const results: TimelineEventHydrated[] = [];
      for (const update of updates) {
        const data: Record<string, any> = {};
        if (update.narrativeSequenceNumber !== undefined) {
          data.narrativeSequenceNumber = update.narrativeSequenceNumber;
        }
        if (update.chronologicalOrder !== undefined) {
          data.chronologicalOrder = update.chronologicalOrder;
        }

        const updated = await tx.timelineEvent.update({
          where: { id: update.eventId },
          data,
          include: { effects: true },
        });
        results.push(this.mapToHydratedEvent(updated));
      }
      return results;
    });
  }

  private validateEventInput(input: TimelineEventInput): void {
    if (!input.projectId || input.projectId.trim() === "") {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: Project ID is required",
      );
    }
    if (!input.title || input.title.trim() === "") {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: Event title cannot be empty",
      );
    }
    if (
      typeof input.narrativeSequenceNumber !== "number" ||
      input.narrativeSequenceNumber < 0
    ) {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: narrativeSequenceNumber must be a non-negative integer",
      );
    }
    if (typeof input.chronologicalOrder !== "number") {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: chronologicalOrder must be an integer",
      );
    }
    if (!Array.isArray(input.effects)) {
      throw new Error(
        "BLOCK_WORLD_TIMELINE_ENGINE_001: effects must be an array",
      );
    }

    const validOps: EffectOperation[] = [
      "SET",
      "INCREMENT",
      "DECREMENT",
      "APPEND",
      "REMOVE",
      "TRANSFER",
    ];

    for (const eff of input.effects) {
      if (!eff.targetEntity || eff.targetEntity.trim() === "") {
        throw new Error(
          "BLOCK_WORLD_TIMELINE_ENGINE_001: Effect targetEntity UUID is required",
        );
      }
      if (!eff.propertyKey || eff.propertyKey.trim() === "") {
        throw new Error(
          "BLOCK_WORLD_TIMELINE_ENGINE_001: Effect propertyKey is required",
        );
      }
      if (!validOps.includes(eff.operation)) {
        throw new Error(
          `BLOCK_WORLD_TIMELINE_ENGINE_001: Invalid effect operation '${eff.operation}'`,
        );
      }
    }
  }

  private mapToHydratedEvent(raw: any): TimelineEventHydrated {
    return {
      id: raw.id,
      projectId: raw.projectId,
      narrativeSequenceNumber: raw.narrativeSequenceNumber,
      chronologicalOrder: raw.chronologicalOrder,
      title: raw.title,
      description: raw.description,
      anchorSceneId: raw.anchorSceneId,
      createdAt:
        raw.createdAt instanceof Date
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()),
      effects: (raw.effects || []).map((eff: any) => ({
        id: eff.id,
        eventId: eff.eventId,
        targetEntity: eff.targetEntity,
        propertyKey: eff.propertyKey,
        operation: eff.operation as EffectOperation,
        value: eff.value,
        createdAt:
          eff.createdAt instanceof Date
            ? eff.createdAt
            : new Date(eff.createdAt || Date.now()),
      })),
    };
  }
}
