import { defineConfig, env } from "prisma/config";

const databaseUrl = env("DATABASE_URL");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

export default defineConfig({
  schema: "./prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
