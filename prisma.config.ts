import "dotenv/config";

import { defineConfig } from "prisma/config";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

export default defineConfig({
  schema: "./prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: requireEnv("DATABASE_URL"),
  },
});
