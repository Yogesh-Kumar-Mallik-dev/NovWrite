import { logger } from "./logger";

import {
  createRequestId,
  now,
} from "./utils";

import { PrismaLog } from "./types";

/* -------------------------------------------------------------------------- */
/*                               Prisma Logger                                */
/* -------------------------------------------------------------------------- */

export function logPrisma({
  model,
  action,
  duration,
  rows,
  query,
}: PrismaLog) {
  logger.debug({
    request: {
      id: createRequestId(),

      method: "GET",

      path: `prisma://${model}`,

      ip: "localhost",

      source: "SERVICE",

      browser: "Unknown",

      client: "API Client",

      userAgent: "Prisma ORM",

      startedAt: now(),

      request: {} as never,
    },

    registry: model,

    handler: "Prisma Client",

    operation: `${model}.${action}()`,

    message:
      rows !== undefined
        ? `${rows} row(s) affected.`
        : undefined,

    response: {
      status: 200,

      success: true,

      duration,
    },

    error: undefined,
  });

  if (query) {
    console.debug(query);
  }
}

/* -------------------------------------------------------------------------- */
/*                            Prisma Error Logger                             */
/* -------------------------------------------------------------------------- */

export function logPrismaError(
  model: string,
  action: string,
  error: unknown,
  duration: number
) {
  logger.error({
    request: {
      id: createRequestId(),

      method: "GET",

      path: `prisma://${model}`,

      ip: "localhost",

      source: "SERVICE",

      browser: "Unknown",

      client: "Server",

      userAgent: "Prisma ORM",

      startedAt: now(),

      request: {} as never,
    },

    registry: model,

    handler: "Prisma Client",

    operation: `${model}.${action}()`,

    response: {
      status: 500,

      success: false,

      duration,
    },

    error,
  });
}
