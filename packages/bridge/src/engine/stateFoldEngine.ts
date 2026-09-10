/**
 * @file stateFoldEngine.ts
 * @description Canonical point-in-time state folding and deterministic timeline effect applier for NovWrite.
 * Block Standard: BLOCK_WORLD_STATE_FOLD_001
 */

import type {
  EntityItem,
  TimelineEventItem,
  TimelineEffectItem,
  BlueprintDef,
} from "../types.js";
import { computeEntityFormulas } from "./formulaEngine.js";

/**
 * Sets a value at a potentially nested dot-notation path inside an object immutably.
 */
export function setNestedProperty(
  obj: Record<string, any>,
  path: string,
  value: unknown,
): Record<string, any> {
  const next = { ...obj };
  const keys = path.split(".");
  if (keys.length === 1) {
    next[path] = value;
    return next;
  }

  let current: any = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    current[k] =
      typeof current[k] === "object" && current[k] !== null
        ? { ...current[k] }
        : {};
    current = current[k];
  }
  current[keys[keys.length - 1]] = value;
  return next;
}

/**
 * Gets a value from a potentially nested dot-notation path inside an object.
 */
export function getNestedProperty(
  obj: Record<string, any>,
  path: string,
): unknown {
  const keys = path.split(".");
  let current: any = obj;
  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }
  return current;
}

/**
 * Applies a single timeline effect to an entity properties record.
 */
export function applyEffectToEntityState(
  currentState: Record<string, any>,
  effect: TimelineEffectItem,
): Record<string, any> {
  const { propertyKey, operation, value } = effect;

  switch (operation) {
    case "SET":
    case "TRANSFER":
      return setNestedProperty(currentState, propertyKey, value);

    case "INCREMENT": {
      const currentVal = Number(
        getNestedProperty(currentState, propertyKey) ?? 0,
      );
      const incVal = Number(value);
      if (isNaN(incVal)) {
        throw new Error(
          `BLOCK_WORLD_TIMELINE_ENGINE_002: INCREMENT requires numeric value for property '${propertyKey}'. Received: ${JSON.stringify(value)}`,
        );
      }
      return setNestedProperty(currentState, propertyKey, currentVal + incVal);
    }

    case "DECREMENT": {
      const currentVal = Number(
        getNestedProperty(currentState, propertyKey) ?? 0,
      );
      const decVal = Number(value);
      if (isNaN(decVal)) {
        throw new Error(
          `BLOCK_WORLD_TIMELINE_ENGINE_002: DECREMENT requires numeric value for property '${propertyKey}'. Received: ${JSON.stringify(value)}`,
        );
      }
      return setNestedProperty(currentState, propertyKey, currentVal - decVal);
    }

    case "APPEND": {
      const existing = getNestedProperty(currentState, propertyKey);
      const currentList = Array.isArray(existing)
        ? [...existing]
        : existing !== undefined && existing !== null
          ? [existing]
          : [];

      const nextList = Array.isArray(value)
        ? [...currentList, ...value]
        : [...currentList, value];

      return setNestedProperty(currentState, propertyKey, nextList);
    }

    case "REMOVE": {
      const existing = getNestedProperty(currentState, propertyKey);
      if (!Array.isArray(existing)) {
        return currentState;
      }
      const toRemove = Array.isArray(value) ? value : [value];
      const nextList = existing.filter(
        (item) =>
          !toRemove.some((rem) =>
            typeof item === "object" &&
            item !== null &&
            typeof rem === "object" &&
            rem !== null
              ? JSON.stringify(item) === JSON.stringify(rem)
              : item === rem,
          ),
      );
      return setNestedProperty(currentState, propertyKey, nextList);
    }

    default:
      throw new Error(
        `BLOCK_WORLD_TIMELINE_ENGINE_002: Unsupported effect operation '${operation}'`,
      );
  }
}

/**
 * Implements deterministic bitemporal point-in-time state folding over timeline events.
 * Replays causality deltas (SET, INCREMENT, DECREMENT, APPEND, REMOVE, TRANSFER) up to targetSequenceNumber.
 */
export function foldTimelineState(
  baseEntities: EntityItem[],
  events: TimelineEventItem[],
  targetSequenceNumber: number,
  mode: "narrative" | "chronological" = "narrative",
  blueprints?: BlueprintDef[],
): EntityItem[] {
  const clonedEntities: EntityItem[] = JSON.parse(JSON.stringify(baseEntities));
  const activeEvents = [...events]
    .filter((ev) =>
      mode === "narrative"
        ? ev.narrativeSequenceNumber <= targetSequenceNumber
        : ev.chronologicalOrder <= targetSequenceNumber,
    )
    .sort((a, b) =>
      mode === "narrative"
        ? a.narrativeSequenceNumber - b.narrativeSequenceNumber
        : a.chronologicalOrder - b.chronologicalOrder,
    );

  for (const ev of activeEvents) {
    for (const eff of ev.effects || []) {
      const targetEntity = clonedEntities.find(
        (e) =>
          e.id === eff.targetEntityId ||
          e.name === eff.entityName ||
          e.name === eff.targetEntityId,
      );
      if (!targetEntity) continue;

      targetEntity.lastMutatedSeqNumber = ev.narrativeSequenceNumber;
      targetEntity.properties = applyEffectToEntityState(
        targetEntity.properties || {},
        eff,
      );
    }
  }

  if (blueprints && blueprints.length > 0) {
    const bpMap = new Map(blueprints.map((b) => [b.id, b]));
    for (const ent of clonedEntities) {
      const bp = bpMap.get(ent.blueprintId);
      if (bp) {
        ent.computedFormulas = computeEntityFormulas(
          ent,
          bp,
          clonedEntities,
          blueprints,
        );
      }
    }
  }

  return clonedEntities;
}
