/**
 * @file revisionEngine.ts
 * @description Canonical Bitemporal & Dual-Axis Entity Revision Engine and Hanging Edit Tree Manager for NovWrite.
 * Block Standard: BLOCK_WORLD_REVISION_ENGINE_001
 */

import type {
  EntityItem,
  EntityRevision,
  EntityRevisionPatch,
  RevisionType,
  BitemporalEntityState,
  EditNode,
  EditTree,
  TimelineEventItem,
} from "../types.js";
import { applyEffectToEntityState } from "./stateFoldEngine.js";

/**
 * Calculates granular delta patch between two entity snapshots.
 */
export function computeEntityRevisionPatch(
  before: EntityItem | null,
  after: EntityItem,
): EntityRevisionPatch {
  const patch: EntityRevisionPatch = {};

  if (!before) {
    // Initial creation
    patch.name = { before: "", after: after.name };
    patch.propertiesChanged = {};
    for (const [k, v] of Object.entries(after.properties || {})) {
      patch.propertiesChanged[k] = { before: undefined, after: v };
    }
    return patch;
  }

  if (before.name !== after.name) {
    patch.name = { before: before.name, after: after.name };
  }
  if ((before.description || "") !== (after.description || "")) {
    patch.description = {
      before: before.description || "",
      after: after.description || "",
    };
  }
  if ((before.category || "") !== (after.category || "")) {
    patch.category = {
      before: before.category || "",
      after: after.category || "",
    };
  }

  // Property diffs
  const propsChanged: Record<string, { before: unknown; after: unknown }> = {};
  const allPropKeys = new Set([
    ...Object.keys(before.properties || {}),
    ...Object.keys(after.properties || {}),
  ]);

  for (const key of allPropKeys) {
    const bVal = before.properties ? before.properties[key] : undefined;
    const aVal = after.properties ? after.properties[key] : undefined;
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      propsChanged[key] = { before: bVal, after: aVal };
    }
  }

  if (Object.keys(propsChanged).length > 0) {
    patch.propertiesChanged = propsChanged;
  }

  // Formulas diffs
  if (before.computedFormulas || after.computedFormulas) {
    const formulasChanged: Record<string, { before: number; after: number }> =
      {};
    const allFormulaKeys = new Set([
      ...Object.keys(before.computedFormulas || {}),
      ...Object.keys(after.computedFormulas || {}),
    ]);
    for (const key of allFormulaKeys) {
      const bVal = before.computedFormulas
        ? before.computedFormulas[key]
        : undefined;
      const aVal = after.computedFormulas
        ? after.computedFormulas[key]
        : undefined;
      if (bVal !== aVal && (bVal !== undefined || aVal !== undefined)) {
        formulasChanged[key] = {
          before: bVal ?? 0,
          after: aVal ?? 0,
        };
      }
    }
    if (Object.keys(formulasChanged).length > 0) {
      patch.formulasChanged = formulasChanged;
    }
  }

  return patch;
}

/**
 * EditTreeEngine handles non-destructive branching trees of edits hanging from any entity or event node.
 */
export class EditTreeEngine<T = unknown> {
  private trees: Map<string, EditTree<T>>;

  constructor(initialTrees?: Map<string, EditTree<T>>) {
    this.trees = initialTrees || new Map<string, EditTree<T>>();
  }

  public getTree(key: string): EditTree<T> | undefined {
    return this.trees.get(key);
  }

  public initTree(
    key: string,
    initialSnapshot: T,
    note: string = "Initial root edit",
  ): EditNode<T> {
    const rootId = `ed-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`;
    const rootNode: EditNode<T> = {
      id: rootId,
      parentId: null,
      childrenIds: [],
      revisionNumber: 0,
      label: "Root Edit (ED0)",
      authorNote: note,
      type: "BASELINE_EDIT",
      createdAt: new Date().toISOString(),
      snapshot: JSON.parse(JSON.stringify(initialSnapshot)),
    };

    const tree: EditTree<T> = {
      rootId,
      activeEditId: rootId,
      nodes: {
        [rootId]: rootNode,
      },
    };

    this.trees.set(key, tree);
    return rootNode;
  }

  /**
   * Add a new edit node branching from targetParentId (or active EDIT head by default).
   * Moves the EDIT head to this newly created node.
   */
  public addEdit(
    key: string,
    snapshot: T,
    type: RevisionType = "BASELINE_EDIT",
    authorNote?: string,
    targetParentId?: string,
  ): EditNode<T> {
    let tree = this.trees.get(key);
    if (!tree) {
      return this.initTree(key, snapshot, authorNote || "Initial root edit");
    }

    const parentId = targetParentId || tree.activeEditId;
    const parentNode = tree.nodes[parentId];
    if (!parentNode) {
      throw new Error(
        `BLOCK_WORLD_REVISION_ENGINE_001: Parent edit node ${parentId} not found in tree ${key}`,
      );
    }

    const newId = `ed-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`;
    const totalNodesCount = Object.keys(tree.nodes).length;

    const newNode: EditNode<T> = {
      id: newId,
      parentId,
      childrenIds: [],
      revisionNumber: totalNodesCount,
      label: `Edit #${totalNodesCount} (ED${totalNodesCount})`,
      authorNote: authorNote?.trim() || undefined,
      type,
      createdAt: new Date().toISOString(),
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    };

    parentNode.childrenIds.push(newId);
    tree.nodes[newId] = newNode;
    tree.activeEditId = newId;

    return newNode;
  }

  /**
   * Checkout an existing edit node as the active EDIT head without deleting any child branches.
   */
  public checkoutHead(key: string, targetEditId: string): EditNode<T> {
    const tree = this.trees.get(key);
    if (!tree) {
      throw new Error(`BLOCK_WORLD_REVISION_ENGINE_001: Tree ${key} not found`);
    }
    const targetNode = tree.nodes[targetEditId];
    if (!targetNode) {
      throw new Error(
        `BLOCK_WORLD_REVISION_ENGINE_001: Edit node ${targetEditId} not found in tree ${key}`,
      );
    }

    tree.activeEditId = targetEditId;
    return targetNode;
  }

  /**
   * Return the snapshot at the current active EDIT head.
   */
  public getActiveSnapshot(key: string): T | undefined {
    const tree = this.trees.get(key);
    if (!tree) return undefined;
    const activeNode = tree.nodes[tree.activeEditId];
    return activeNode ? activeNode.snapshot : undefined;
  }

  /**
   * Compacts linear chains of consecutive TYPO_FIX edits on the tree.
   */
  public compactMicroRevisions(key: string): number {
    const tree = this.trees.get(key);
    if (!tree || Object.keys(tree.nodes).length <= 2) {
      return 0;
    }

    let compactedCount = 0;
    for (const [id, node] of Object.entries(tree.nodes)) {
      if (
        node.childrenIds.length === 1 &&
        node.parentId &&
        node.type === "TYPO_FIX" &&
        id !== tree.activeEditId &&
        id !== tree.rootId
      ) {
        const parentId = node.parentId;
        const childId = node.childrenIds[0];
        const parentNode = tree.nodes[parentId];
        const childNode = tree.nodes[childId];

        if (parentNode && childNode) {
          parentNode.childrenIds = parentNode.childrenIds.map((cid) =>
            cid === id ? childId : cid,
          );
          childNode.parentId = parentId;
          delete tree.nodes[id];
          compactedCount++;
        }
      }
    }

    return compactedCount;
  }
}

/**
 * Resolves an entity's deterministic bitemporal state at coordinate (T_narrative, T_revision).
 */
export function resolveBitemporalEntityState(options: {
  entityId: string;
  revisions: EntityRevision[];
  targetSequenceNumber?: number;
  targetRevisionId?: string;
  events?: TimelineEventItem[];
  fallbackEntity?: EntityItem;
}): BitemporalEntityState | undefined {
  const {
    entityId,
    revisions,
    targetSequenceNumber,
    targetRevisionId,
    events = [],
    fallbackEntity,
  } = options;

  let baseRevision: EntityRevision | undefined;

  if (targetRevisionId) {
    baseRevision = revisions.find((r) => r.id === targetRevisionId);
  } else if (revisions.length > 0) {
    baseRevision = revisions[revisions.length - 1];
  }

  const baseSnapshot = baseRevision?.snapshot || fallbackEntity;
  if (!baseSnapshot) return undefined;

  const maxSeq =
    targetSequenceNumber !== undefined && targetSequenceNumber !== null
      ? targetSequenceNumber
      : Number.MAX_SAFE_INTEGER;

  let computedProps: Record<string, unknown> = JSON.parse(
    JSON.stringify(baseSnapshot.properties || {}),
  );

  const sortedEvents = [...events]
    .filter((ev) => ev.narrativeSequenceNumber <= maxSeq)
    .sort((a, b) => a.narrativeSequenceNumber - b.narrativeSequenceNumber);

  const activeMutations: BitemporalEntityState["activeMutations"] = [];
  let appliedEventsCount = 0;

  for (const ev of sortedEvents) {
    for (const eff of ev.effects || []) {
      const effEntityId = eff.targetEntityId || (eff as any).targetEntity;
      if (
        effEntityId === entityId ||
        eff.entityName === baseSnapshot.name ||
        eff.entityName === entityId
      ) {
        computedProps = applyEffectToEntityState(computedProps, eff);
        activeMutations.push({
          eventId: ev.id,
          eventTitle: ev.title,
          sequenceNumber: ev.narrativeSequenceNumber,
          propertyKey: eff.propertyKey,
          operation: eff.operation,
          value: eff.value,
        });
        appliedEventsCount++;
      }
    }
  }

  return {
    entityId,
    entityName: baseSnapshot.name,
    category: baseSnapshot.category || "General",
    narrativeSequenceNumber: targetSequenceNumber ?? 0,
    revisionId: baseRevision ? baseRevision.id : "current",
    revisionNumber: baseRevision ? baseRevision.revisionNumber : 0,
    revisionType: baseRevision ? baseRevision.type : "BASELINE_EDIT",
    properties: computedProps,
    computedFormulas: baseSnapshot.computedFormulas,
    appliedEventsCount,
    activeMutations,
  };
}
