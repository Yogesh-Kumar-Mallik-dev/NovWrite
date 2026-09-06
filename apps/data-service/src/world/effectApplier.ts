/**
 * @file effectApplier.ts
 * @description Deterministic state mutation and effect application logic for timeline events.
 * Block Standard: BLOCK_WORLD_TIMELINE_ENGINE_001
 */

import { EventEffectPayload, TransferPayload } from "./timelineTypes.js";

/**
 * Applies a single event effect to an entity's mutable property state map.
 * Returns a new immutably updated state map.
 */
export function applyEffectToEntityState(
  currentState: Record<string, unknown>,
  effect: EventEffectPayload,
): Record<string, unknown> {
  const nextState: Record<string, unknown> = { ...currentState };
  const { propertyKey, operation, value } = effect;

  switch (operation) {
    case "SET": {
      nextState[propertyKey] = value;
      break;
    }

    case "INCREMENT": {
      const currentVal = Number(nextState[propertyKey] ?? 0);
      const incVal = Number(value);
      if (isNaN(incVal)) {
        throw new Error(
          `BLOCK_WORLD_TIMELINE_ENGINE_001: INCREMENT operation requires numeric value for property '${propertyKey}'. Received: ${JSON.stringify(value)}`,
        );
      }
      nextState[propertyKey] = currentVal + incVal;
      break;
    }

    case "DECREMENT": {
      const currentVal = Number(nextState[propertyKey] ?? 0);
      const decVal = Number(value);
      if (isNaN(decVal)) {
        throw new Error(
          `BLOCK_WORLD_TIMELINE_ENGINE_001: DECREMENT operation requires numeric value for property '${propertyKey}'. Received: ${JSON.stringify(value)}`,
        );
      }
      nextState[propertyKey] = currentVal - decVal;
      break;
    }

    case "APPEND": {
      const currentList = Array.isArray(nextState[propertyKey])
        ? [...(nextState[propertyKey] as unknown[])]
        : nextState[propertyKey] !== undefined &&
            nextState[propertyKey] !== null
          ? [nextState[propertyKey]]
          : [];

      if (Array.isArray(value)) {
        nextState[propertyKey] = [...currentList, ...value];
      } else {
        nextState[propertyKey] = [...currentList, value];
      }
      break;
    }

    case "REMOVE": {
      if (!Array.isArray(nextState[propertyKey])) {
        // If not an array, nothing to remove
        break;
      }
      const currentList = nextState[propertyKey] as unknown[];
      const toRemove = Array.isArray(value) ? value : [value];

      nextState[propertyKey] = currentList.filter(
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
      break;
    }

    case "TRANSFER": {
      // In single entity context, TRANSFER reduces target entity's resource
      if (typeof value === "object" && value !== null) {
        const transfer = value as TransferPayload;
        if (typeof transfer.amount === "number") {
          const currentVal = Number(nextState[propertyKey] ?? 0);
          nextState[propertyKey] = currentVal - transfer.amount;
        } else if (transfer.item !== undefined) {
          if (Array.isArray(nextState[propertyKey])) {
            const list = nextState[propertyKey] as unknown[];
            nextState[propertyKey] = list.filter(
              (i) => JSON.stringify(i) !== JSON.stringify(transfer.item),
            );
          }
        }
      } else if (typeof value === "number") {
        const currentVal = Number(nextState[propertyKey] ?? 0);
        nextState[propertyKey] = currentVal - value;
      }
      break;
    }

    default:
      throw new Error(
        `BLOCK_WORLD_TIMELINE_ENGINE_001: Unsupported effect operation '${operation}'`,
      );
  }

  return nextState;
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
