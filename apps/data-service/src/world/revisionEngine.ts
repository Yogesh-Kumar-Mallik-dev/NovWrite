/**
 * @file revisionEngine.ts
 * @description Bitemporal & Dual-Axis Entity Revision Engine with infinite reversibility.
 * Supports the horizontal UPDATE Pipe (event0 -> event1 -> event2) and hanging EDIT Trees per event/entity.
 * Block Standard: BLOCK_WORLD_REVISION_ENGINE_001
 */

import {
  EntityItem,
  EntityRevision,
  EntityRevisionPatch,
  RevisionType,
  BitemporalEntityState,
  EditNode,
  EditTree,
} from "@novwrite/bridge";
import { applyEffectToEntityState } from "./effectApplier.js";
import { TimelineEventHydrated } from "./timelineTypes.js";

export interface InMemoryRevisionStore {
  entityRevisions: Map<string, EntityRevision[]>;
  editTrees: Map<string, EditTree<unknown>>;
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
    tree.activeEditId = newId; // Move EDIT head to newly created node

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

    // Set EDIT head non-destructively
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
   * Compacts linear chains of consecutive TYPO_FIX edits on the tree to prevent state explosion.
   * Block Standard: BLOCK_WORLD_REVISION_COMPACT_001
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

export class RevisionEngine {
  private revisions: Map<string, EntityRevision[]>;
  private entityTrees: EditTreeEngine<EntityItem>;
  private eventTrees: EditTreeEngine<TimelineEventHydrated>;

  constructor(
    initialStore?: Map<string, EntityRevision[]>,
    entityTrees?: EditTreeEngine<EntityItem>,
    eventTrees?: EditTreeEngine<TimelineEventHydrated>,
  ) {
    this.revisions = initialStore || new Map<string, EntityRevision[]>();
    this.entityTrees = entityTrees || new EditTreeEngine<EntityItem>();
    this.eventTrees = eventTrees || new EditTreeEngine<TimelineEventHydrated>();
  }

  public getEntityTreeEngine(): EditTreeEngine<EntityItem> {
    return this.entityTrees;
  }

  public getEventTreeEngine(): EditTreeEngine<TimelineEventHydrated> {
    return this.eventTrees;
  }

  /**
   * Calculate granular delta patch between two entity snapshots.
   */
  public computePatch(
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
    const propsChanged: Record<string, { before: unknown; after: unknown }> =
      {};
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
   * Record a new immutable revision for an entity and keep hanging edit tree updated.
   */
  public recordRevision(
    entity: EntityItem,
    type: RevisionType,
    authorNote?: string,
  ): EntityRevision {
    const history = this.revisions.get(entity.id) || [];
    const parentRevision =
      history.length > 0 ? history[history.length - 1] : null;

    const patch = this.computePatch(
      parentRevision ? parentRevision.snapshot : null,
      entity,
    );

    const revision: EntityRevision = {
      id: `rev-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      entityId: entity.id,
      projectId: entity.projectId,
      parentRevisionId: parentRevision ? parentRevision.id : null,
      revisionNumber: history.length,
      createdAt: new Date().toISOString(),
      type,
      authorNote: authorNote?.trim() || undefined,
      patch,
      snapshot: JSON.parse(JSON.stringify(entity)),
    };

    history.push(revision);
    this.revisions.set(entity.id, history);

    // Sync into entity tree
    this.entityTrees.addEdit(entity.id, entity, type, authorNote);

    return revision;
  }

  /**
   * Revert an entity to a previous revision. Creates a new immutable revision of type REVERT.
   */
  public revertToRevision(
    entityId: string,
    targetRevisionId: string,
    authorNote?: string,
  ): { restoredEntity: EntityItem; revision: EntityRevision } {
    const history = this.revisions.get(entityId);
    if (!history || history.length === 0) {
      throw new Error(
        `BLOCK_WORLD_REVISION_ENGINE_001: No revision history found for entity ${entityId}`,
      );
    }

    const targetRev = history.find((r) => r.id === targetRevisionId);
    if (!targetRev) {
      throw new Error(
        `BLOCK_WORLD_REVISION_ENGINE_001: Target revision ${targetRevisionId} not found for entity ${entityId}`,
      );
    }

    const restoredEntity: EntityItem = JSON.parse(
      JSON.stringify(targetRev.snapshot),
    );
    const note =
      authorNote ||
      `Reverted to revision #${targetRev.revisionNumber} (${targetRev.id})`;
    const revertRevision = this.recordRevision(restoredEntity, "REVERT", note);

    return {
      restoredEntity,
      revision: revertRevision,
    };
  }

  /**
   * List full revision history for an entity.
   */
  public getRevisions(entityId: string): EntityRevision[] {
    return this.revisions.get(entityId) || [];
  }

  /**
   * Resolve an entity's deterministic state at any 2D Coordinate: (T_narrative, T_revision)
   * 1. Resolves base snapshot from T_revision
   * 2. Sequentially folds timeline event mutations up to T_narrative
   */
  public resolveAtCoordinate(
    entityId: string,
    targetSequenceNumber?: number,
    targetRevisionId?: string,
    events: TimelineEventHydrated[] = [],
  ): BitemporalEntityState {
    const history = this.revisions.get(entityId) || [];
    let baseRevision: EntityRevision | undefined;

    if (targetRevisionId) {
      baseRevision = history.find((r) => r.id === targetRevisionId);
      if (!baseRevision) {
        throw new Error(
          `BLOCK_WORLD_REVISION_ENGINE_001: Revision ${targetRevisionId} not found for entity ${entityId}`,
        );
      }
    } else if (history.length > 0) {
      baseRevision = history[history.length - 1];
    }

    if (!baseRevision) {
      throw new Error(
        `BLOCK_WORLD_REVISION_ENGINE_001: No base state or revisions found for entity ${entityId}`,
      );
    }

    const maxSeq =
      targetSequenceNumber !== undefined && targetSequenceNumber !== null
        ? targetSequenceNumber
        : Number.MAX_SAFE_INTEGER;

    // Start with revision snapshot properties
    let computedProps: Record<string, unknown> = JSON.parse(
      JSON.stringify(baseRevision.snapshot.properties || {}),
    );

    // Filter and sort events applicable to this entity up to maxSeq
    const sortedEvents = [...events]
      .filter((ev) => ev.narrativeSequenceNumber <= maxSeq)
      .sort((a, b) => a.narrativeSequenceNumber - b.narrativeSequenceNumber);

    const activeMutations: BitemporalEntityState["activeMutations"] = [];
    let appliedEventsCount = 0;

    for (const ev of sortedEvents) {
      for (const eff of ev.effects) {
        if (eff.targetEntity === entityId) {
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
      entityName: baseRevision.snapshot.name,
      category: baseRevision.snapshot.category || "General",
      narrativeSequenceNumber: targetSequenceNumber ?? 0,
      revisionId: baseRevision.id,
      revisionNumber: baseRevision.revisionNumber,
      revisionType: baseRevision.type,
      properties: computedProps,
      computedFormulas: baseRevision.snapshot.computedFormulas,
      appliedEventsCount,
      activeMutations,
    };
  }
}
