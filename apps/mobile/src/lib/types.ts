/**
 * @file types.ts
 * @description Mobile client domain types re-exported from @novwrite/bridge contracts.
 */

export * from "@novwrite/bridge";

export interface MobileProjectItem {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileChapterItem {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  synopsis?: string;
}

export interface MobileSceneItem {
  id: string;
  chapterId: string;
  projectId: string;
  title: string;
  orderIndex: number;
  proseContent: string;
  wordCount: number;
  status: "DRAFT" | "IN_PROGRESS" | "REVISED" | "COMPLETED";
  targetWordCount?: number;
  synopsis?: string;
}

export interface MobileTimelineEvent {
  id: string;
  projectId: string;
  sequenceNumber: number;
  title: string;
  timestamp: string;
  eventType: "CANON_MUTATION" | "RELATION_TRANSFER" | "AFFINITY_SHIFT" | "STATE_INITIALIZATION";
  entityName: string;
  entityId: string;
  description: string;
  delta: Record<string, unknown>;
  isKeyMilestone?: boolean;
}

export interface MobileInvariantRule {
  id: string;
  projectId: string;
  name: string;
  description: string;
  severity: "BLOCKING_ERROR" | "WARNING" | "ADVISORY_NOTE";
  scope: string;
  ruleExpression: string;
  isActive: boolean;
}

export interface MobileContinuityIssue {
  id: string;
  code: string;
  ruleName: string;
  entityName: string;
  sceneTitle: string;
  message: string;
  severity: "ERROR" | "WARNING";
}

