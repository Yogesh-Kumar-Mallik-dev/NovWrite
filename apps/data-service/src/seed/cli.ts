/**
 * @file cli.ts
 * @description CLI entry point for running the development test data seeder.
 * Block Standard: BLOCK_DEV_SEEDER_CLI_001
 */

import { PrismaClient } from "@prisma/client";
import { seedDevelopmentUniverse } from "./devSeeder.js";

async function main() {
  console.log("[NovWrite Dev Seeder] Starting database seeding...");
  const prisma = new PrismaClient();

  try {
    const result = await seedDevelopmentUniverse(prisma);
    console.log(`[NovWrite Dev Seeder] ${result.message}`);
    console.log(`[NovWrite Dev Seeder] Project ID: ${result.projectId}`);
    console.log(
      `[NovWrite Dev Seeder] Seeded Scenes: ${result.seededScenesCount}`,
    );
  } catch (err: any) {
    console.error("[NovWrite Dev Seeder] Seeding failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
