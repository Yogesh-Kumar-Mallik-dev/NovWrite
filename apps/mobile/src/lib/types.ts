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
