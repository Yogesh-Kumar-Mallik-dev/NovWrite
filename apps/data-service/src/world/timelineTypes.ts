/**
 * @file timelineTypes.ts
 * @description Domain types for causal timeline, dual-indexing, and event sourcing effects.
 * Block Standard: BLOCK_WORLD_TIMELINE_ENGINE_001
 */

export type EffectOperation =
  "SET" | "INCREMENT" | "DECREMENT" | "APPEND" | "REMOVE" | "TRANSFER";

export interface TransferPayload {
  toEntityId: string;
  amount?: number;
  item?: unknown;
}

export interface EventEffectPayload {
  id?: string;
  eventId?: string;
  targetEntity: string;
  propertyKey: string;
  operation: EffectOperation;
  value: unknown;
  createdAt?: Date;
}

export interface TimelineEventInput {
  projectId: string;
  narrativeSequenceNumber: number;
  chronologicalOrder: number;
  title: string;
  description?: string | null;
  anchorSceneId?: string | null;
  effects: EventEffectPayload[];
}

export interface TimelineEventHydrated {
  id: string;
  projectId: string;
  narrativeSequenceNumber: number;
  chronologicalOrder: number;
  title: string;
  description?: string | null;
  anchorSceneId?: string | null;
  createdAt: Date;
  effects: EventEffectPayload[];
}

export interface TimelineQueryOptions {
  orderBy?: "narrative" | "chronological";
  orderDirection?: "asc" | "desc";
  upToNarrativeSeq?: number;
  upToChronologicalOrder?: number;
  fromNarrativeSeq?: number;
  fromChronologicalOrder?: number;
  targetEntityId?: string;
  limit?: number;
  offset?: number;
}

export interface TimelineResequenceItem {
  eventId: string;
  narrativeSequenceNumber?: number;
  chronologicalOrder?: number;
}
