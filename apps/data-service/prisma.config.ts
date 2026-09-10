import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://novwrite:novwrite_dev@localhost:5433/novwrite_db?sslmode=disable",
  },
});
