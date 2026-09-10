import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      env("DATABASE_URL") ||
      "postgresql://novwrite:novwrite_dev@localhost:5433/novwrite_db?schema=public",
  },
});
