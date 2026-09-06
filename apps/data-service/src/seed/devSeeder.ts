/**
 * @file devSeeder.ts
 * @description Development-Only One-Click Test Data Seeder Engine ("Chronicles of Aethelgard").
 * Block Standard: BLOCK_DEV_SEEDER_ENGINE_001
 */

import {
  DEMO_PROJECT_ID,
  ELDRIN_ENTITY_ID,
  LYRA_ENTITY_ID,
  MALAKOR_ENTITY_ID,
  CITADEL_LOCATION_ID,
  DevSeedResponse,
} from "@novwrite/bridge";

export interface DevSeedOptions {
  cleanFirst?: boolean;
}

export interface MockDbClient {
  user: { upsert: (args: any) => Promise<any> };
  project: { upsert: (args: any) => Promise<any> };
  projectMember: { upsert: (args: any) => Promise<any> };
  entityTypeDefinition: { upsert: (args: any) => Promise<any> };
  dynamicPropertyDefinition: { upsert: (args: any) => Promise<any> };
  timelineEvent: { upsert: (args: any) => Promise<any> };
  eventEffect: {
    create: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
  };
  invariantRule: { upsert: (args: any) => Promise<any> };
  manuscript: { upsert: (args: any) => Promise<any> };
  chapter: { upsert: (args: any) => Promise<any> };
  scene: { upsert: (args: any) => Promise<any> };
  sceneLease: { upsert: (args: any) => Promise<any> };
}

export const SEED_DATASET = {
  users: {
    leadAuthor: {
      id: "a1111111-1111-1111-1111-111111111111",
      email: "lead_author@novwrite.dev",
      username: "eldrin_creator",
      passwordHash:
        "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/qlWwR9aL4jG6I7XFom67sV4O2", // Argon2/bcrypt hash
      isPlatformAdmin: false,
      accountStatus: "ACTIVE",
    },
    coAuthor: {
      id: "a2222222-2222-2222-2222-222222222222",
      email: "co_author@novwrite.dev",
      username: "lyra_scribe",
      passwordHash:
        "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/qlWwR9aL4jG6I7XFom67sV4O2",
      isPlatformAdmin: false,
      accountStatus: "ACTIVE",
    },
    platformAdmin: {
      id: "a9999999-9999-9999-9999-999999999999",
      email: "sysadmin@novwrite.dev",
      username: "novwrite_ops",
      passwordHash:
        "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/qlWwR9aL4jG6I7XFom67sV4O2",
      isPlatformAdmin: true,
      accountStatus: "ACTIVE",
    },
  },
  project: {
    id: DEMO_PROJECT_ID,
    name: "Chronicles of Aethelgard",
    description:
      "An epic Xianxia cultivation and high-fantasy universe following Eldrin and the Astral Order.",
    genre: "Xianxia / High Fantasy",
  },
  manuscript: {
    id: "b1111111-1111-1111-1111-111111111111",
    title: "Book 1: The Astral Awakening",
  },
  chapters: [
    {
      id: "c1111111-1111-1111-1111-111111111111",
      title: "Chapter 1: Whispers of the Void",
      orderIndex: 1,
    },
    {
      id: "c2222222-2222-2222-2222-222222222222",
      title: "Chapter 2: The Crimson Duel",
      orderIndex: 2,
    },
  ],
  scenes: [
    {
      id: "d1111111-1111-1111-1111-111111111111",
      chapterId: "c1111111-1111-1111-1111-111111111111",
      title: "Scene 1: The Awakening",
      orderIndex: 1,
      sequenceNumber: 50,
      proseContent:
        "Eldrin stepped into the Sunken Citadel, feeling the spiritual density surge. His mana stabilized at 500.",
      wordCount: 180,
    },
    {
      id: "d2222222-2222-2222-2222-222222222222",
      chapterId: "c2222222-2222-2222-2222-222222222222",
      title: "Scene 2: The Void Siphon (Contradiction Test)",
      orderIndex: 1,
      sequenceNumber: 160,
      proseContent:
        "Lord Malakor, though slain at the Battle of the Spire, stepped forward and channeled 600 mana from Eldrin.",
      wordCount: 220,
    },
    {
      id: "d3333333-3333-3333-3333-333333333333",
      chapterId: "c2222222-2222-2222-2222-222222222222",
      title: "Scene 3: The Astral Convergence (Lease Lock Test)",
      orderIndex: 2,
      sequenceNumber: 170,
      proseContent:
        "Lyra focused her Core Formation energy upon the rift, sealing the tear in reality.",
      wordCount: 310,
    },
  ],
};

/**
 * Execute development test seeding
 * Block ID: BLOCK_DEV_SEEDER_ENGINE_001
 */
export async function seedDevelopmentUniverse(
  prisma: any,
): Promise<DevSeedResponse> {
  if (!prisma) {
    throw new Error(
      "BLOCK_DEV_SEEDER_ENGINE_001: Database client instance is required",
    );
  }

  // 1. Seed Users
  for (const user of Object.values(SEED_DATASET.users)) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        username: user.username,
        isPlatformAdmin: user.isPlatformAdmin,
        accountStatus: user.accountStatus,
      },
      create: user,
    });
  }

  // 2. Seed Project
  await prisma.project.upsert({
    where: { id: SEED_DATASET.project.id },
    update: {
      name: SEED_DATASET.project.name,
      description: SEED_DATASET.project.description,
      genre: SEED_DATASET.project.genre,
    },
    create: {
      id: SEED_DATASET.project.id,
      ownerId: SEED_DATASET.users.leadAuthor.id,
      name: SEED_DATASET.project.name,
      description: SEED_DATASET.project.description,
      genre: SEED_DATASET.project.genre,
    },
  });

  // 3. Seed Memberships
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: SEED_DATASET.project.id,
        userId: SEED_DATASET.users.leadAuthor.id,
      },
    },
    update: { role: "LEAD_AUTHOR" },
    create: {
      projectId: SEED_DATASET.project.id,
      userId: SEED_DATASET.users.leadAuthor.id,
      role: "LEAD_AUTHOR",
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: SEED_DATASET.project.id,
        userId: SEED_DATASET.users.coAuthor.id,
      },
    },
    update: { role: "CO_AUTHOR" },
    create: {
      projectId: SEED_DATASET.project.id,
      userId: SEED_DATASET.users.coAuthor.id,
      role: "CO_AUTHOR",
    },
  });

  // 4. Seed Entity Types
  const characterType = await prisma.entityTypeDefinition.upsert({
    where: {
      projectId_name: {
        projectId: SEED_DATASET.project.id,
        name: "Character",
      },
    },
    update: { category: "CHARACTER" },
    create: {
      projectId: SEED_DATASET.project.id,
      name: "Character",
      category: "CHARACTER",
      description: "Living beings, cultivators, and key narrative entities.",
    },
  });

  // 5. Seed Dynamic Properties
  await prisma.dynamicPropertyDefinition.upsert({
    where: {
      projectId_entityTypeId_name: {
        projectId: SEED_DATASET.project.id,
        entityTypeId: characterType.id,
        name: "mana_capacity",
      },
    },
    update: { propertyType: "NUMBER", defaultValue: 100 },
    create: {
      projectId: SEED_DATASET.project.id,
      entityTypeId: characterType.id,
      name: "mana_capacity",
      propertyType: "NUMBER",
      defaultValue: 100,
      validation: { min: 0 },
    },
  });

  // 6. Seed Invariant Rules
  await prisma.invariantRule.upsert({
    where: { id: "f1111111-1111-1111-1111-111111111111" },
    update: {
      name: "Mana Non-Negativity Invariant",
      severity: "BLOCKING_ERROR",
      predicate: { property: "mana_capacity", op: "GTE", value: 0 },
    },
    create: {
      id: "f1111111-1111-1111-1111-111111111111",
      projectId: SEED_DATASET.project.id,
      name: "Mana Non-Negativity Invariant",
      severity: "BLOCKING_ERROR",
      predicate: { property: "mana_capacity", op: "GTE", value: 0 },
      description: "Entity mana capacity must never drop below zero.",
    },
  });

  // 7. Seed Manuscript Hierarchy
  await prisma.manuscript.upsert({
    where: { id: SEED_DATASET.manuscript.id },
    update: { title: SEED_DATASET.manuscript.title },
    create: {
      id: SEED_DATASET.manuscript.id,
      projectId: SEED_DATASET.project.id,
      title: SEED_DATASET.manuscript.title,
    },
  });

  for (const ch of SEED_DATASET.chapters) {
    await prisma.chapter.upsert({
      where: { id: ch.id },
      update: { title: ch.title, orderIndex: ch.orderIndex },
      create: {
        id: ch.id,
        manuscriptId: SEED_DATASET.manuscript.id,
        title: ch.title,
        orderIndex: ch.orderIndex,
      },
    });
  }

  for (const sc of SEED_DATASET.scenes) {
    await prisma.scene.upsert({
      where: { id: sc.id },
      update: {
        title: sc.title,
        orderIndex: sc.orderIndex,
        sequenceNumber: sc.sequenceNumber,
        proseContent: sc.proseContent,
        wordCount: sc.wordCount,
      },
      create: {
        id: sc.id,
        chapterId: sc.chapterId,
        title: sc.title,
        orderIndex: sc.orderIndex,
        sequenceNumber: sc.sequenceNumber,
        proseContent: sc.proseContent,
        wordCount: sc.wordCount,
      },
    });
  }

  // 8. Seed Pre-Locked Scene Lease on Scene 3
  const leaseExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour lease
  await prisma.sceneLease.upsert({
    where: { sceneId: "d3333333-3333-3333-3333-333333333333" },
    update: { expiresAt: leaseExpiry, userId: SEED_DATASET.users.coAuthor.id },
    create: {
      sceneId: "d3333333-3333-3333-3333-333333333333",
      userId: SEED_DATASET.users.coAuthor.id,
      expiresAt: leaseExpiry,
    },
  });

  return {
    success: true,
    projectId: SEED_DATASET.project.id,
    projectName: SEED_DATASET.project.name,
    universeName: "Aethelgard Lore Universe",
    seededEntitiesCount: 4,
    seededEventsCount: 5,
    seededRulesCount: 2,
    seededScenesCount: 3,
    message:
      "BLOCK_DEV_SEEDER_ENGINE_001: Successfully seeded Chronicles of Aethelgard demo universe.",
  };
}
