/**
 * @file effectApplier.ts
 * @description Deterministic state mutation and effect application logic for timeline events.
 * Block Standard: BLOCK_WORLD_TIMELINE_ENGINE_002
 */

import { EventEffectPayload, TransferPayload } from "./timelineTypes.js";

/**
 * Sets a value at a potentially nested dot-notation path inside an object immutably.
 */
function setNestedProperty(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
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
function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: any = obj;
  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }
  return current;
}

/**
 * Applies a single event effect to an entity's mutable property state map.
 * Returns a new immutably updated state map.
 */
export function applyEffectToEntityState(
  currentState: Record<string, unknown>,
  effect: EventEffectPayload,
): Record<string, unknown> {
  const { propertyKey, operation, value } = effect;

  switch (operation) {
    case "SET": {
      return setNestedProperty(currentState, propertyKey, value);
    }

    case "INCREMENT": {
      const currentVal = Number(getNestedProperty(currentState, propertyKey) ?? 0);
      const incVal = Number(value);
      if (isNaN(incVal)) {
        throw new Error(
          `BLOCK_WORLD_TIMELINE_ENGINE_002: INCREMENT operation requires numeric value for property '${propertyKey}'. Received: ${JSON.stringify(value)}`,
        );
      }
      return setNestedProperty(currentState, propertyKey, currentVal + incVal);
    }

    case "DECREMENT": {
      const currentVal = Number(getNestedProperty(currentState, propertyKey) ?? 0);
      const decVal = Number(value);
      if (isNaN(decVal)) {
        throw new Error(
          `BLOCK_WORLD_TIMELINE_ENGINE_002: DECREMENT operation requires numeric value for property '${propertyKey}'. Received: ${JSON.stringify(value)}`,
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

    case "TRANSFER": {
      const existingVal = Number(getNestedProperty(currentState, propertyKey) ?? 0);
      if (typeof value === "object" && value !== null) {
        const transfer = value as TransferPayload;
        if (typeof transfer.amount === "number") {
          return setNestedProperty(currentState, propertyKey, existingVal - transfer.amount);
        } else if (transfer.item !== undefined) {
          const list = Array.isArray(existingVal) ? (existingVal as any[]) : [];
          const nextList = list.filter(
            (i) => JSON.stringify(i) !== JSON.stringify(transfer.item),
          );
          return setNestedProperty(currentState, propertyKey, nextList);
        }
      } else if (typeof value === "number") {
        return setNestedProperty(currentState, propertyKey, existingVal - value);
      }
      return currentState;
    }

    default:
      throw new Error(
        `BLOCK_WORLD_TIMELINE_ENGINE_002: Unsupported effect operation '${operation}'`,
      );
  }
}

/**
 * Applies a batch of event effects to a universe state map (keyed by entity UUID).
 */
export function applyEffectsToUniverse(
  universeState: Map<string, Record<string, unknown>>,
  effects: EventEffectPayload[],
): void {
  for (const effect of effects) {
    const entityId = effect.targetEntity;
    const currentEntityState = universeState.get(entityId) || {};
    const updatedState = applyEffectToEntityState(currentEntityState, effect);
    universeState.set(entityId, updatedState);

    // If it is a TRANSFER operation with destination entity, apply the credit side
    if (
      effect.operation === "TRANSFER" &&
      typeof effect.value === "object" &&
      effect.value !== null
    ) {
      const transfer = effect.value as TransferPayload;
      if (transfer.toEntityId) {
        const destEntityState = universeState.get(transfer.toEntityId) || {};
        if (typeof transfer.amount === "number") {
          const destVal = Number(destEntityState[effect.propertyKey] ?? 0);
          destEntityState[effect.propertyKey] = destVal + transfer.amount;
          universeState.set(transfer.toEntityId, destEntityState);
        } else if (transfer.item !== undefined) {
          const list = Array.isArray(destEntityState[effect.propertyKey])
            ? [...(destEntityState[effect.propertyKey] as unknown[])]
            : [];
          list.push(transfer.item);
          destEntityState[effect.propertyKey] = list;
          universeState.set(transfer.toEntityId, destEntityState);
        }
      }
    }
  }
}
