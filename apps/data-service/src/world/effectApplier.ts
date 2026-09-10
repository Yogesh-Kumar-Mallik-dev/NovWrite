import {
  applyEffectToEntityState as bridgeApplyEffect,
  TimelineEffectItem,
} from "@novwrite/bridge";
import { EventEffectPayload, TransferPayload } from "./timelineTypes.js";

/**
 * Applies a single event effect to an entity's mutable property state map.
 * Delegated to canonical @novwrite/bridge engine.
 */
export function applyEffectToEntityState(
  currentState: Record<string, unknown>,
  effect: EventEffectPayload | TimelineEffectItem,
): Record<string, unknown> {
  const eff: TimelineEffectItem = {
    targetEntityId:
      (effect as EventEffectPayload).targetEntity ||
      (effect as TimelineEffectItem).targetEntityId ||
      "",
    propertyKey: effect.propertyKey,
    operation: effect.operation,
    value: effect.value,
  };

  if (effect.operation === "TRANSFER") {
    const existingVal = Number(currentState[effect.propertyKey] ?? 0);
    if (typeof effect.value === "object" && effect.value !== null) {
      const transfer = effect.value as TransferPayload;
      if (typeof transfer.amount === "number") {
        return {
          ...currentState,
          [effect.propertyKey]: existingVal - transfer.amount,
        };
      } else if (transfer.item !== undefined) {
        const list = Array.isArray(existingVal) ? (existingVal as any[]) : [];
        return {
          ...currentState,
          [effect.propertyKey]: list.filter(
            (i) => JSON.stringify(i) !== JSON.stringify(transfer.item),
          ),
        };
      }
    } else if (typeof effect.value === "number") {
      return {
        ...currentState,
        [effect.propertyKey]: existingVal - effect.value,
      };
    }
    return currentState;
  }

  return bridgeApplyEffect(currentState, eff);
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
