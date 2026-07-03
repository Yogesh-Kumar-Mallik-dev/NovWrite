import test from "node:test";
import assert from "node:assert/strict";

import { logger } from "@/lib/logger/logger";
import {
  logPrisma,
  logPrismaError,
} from "@/lib/logger/prisma";

import type { ApiLog } from "@/lib/logger/types";

function withLoggerMocks(
  callback: (
    debugCalls: Omit<ApiLog, "level">[],
    errorCalls: Omit<ApiLog, "level">[],
    consoleDebugCalls: string[]
  ) => void
) {
  const debugCalls: Omit<ApiLog, "level">[] = [];
  const errorCalls: Omit<ApiLog, "level">[] = [];
  const consoleDebugCalls: string[] = [];

  const originalDebug = logger.debug;
  const originalError = logger.error;
  const originalConsoleDebug =
    console.debug;

  logger.debug = (
    log: Omit<ApiLog, "level">
  ) => {
    debugCalls.push(log);
  };

  logger.error = (
    log: Omit<ApiLog, "level">
  ) => {
    errorCalls.push(log);
  };

  console.debug = (
    message?: unknown
  ) => {
    consoleDebugCalls.push(
      String(message)
    );
  };

  try {
    callback(
      debugCalls,
      errorCalls,
      consoleDebugCalls
    );
  } finally {
    logger.debug = originalDebug;
    logger.error = originalError;
    console.debug =
      originalConsoleDebug;
  }
}

/* -------------------------------------------------------------------------- */
/*                               logPrisma                                    */
/* -------------------------------------------------------------------------- */

test(
  "logPrisma logs successful prisma operation",
  () => {
    withLoggerMocks(
      (debugCalls) => {
        logPrisma({
          model: "Character",
          action: "findMany",
          duration: 12.5,
          rows: 15,
        });

        assert.equal(
          debugCalls.length,
          1
        );

        const log =
          debugCalls[0];

        assert.equal(
          log.registry,
          "Character"
        );

        assert.equal(
          log.handler,
          "Prisma Client"
        );

        assert.equal(
          log.operation,
          "Character.findMany()"
        );

        assert.equal(
          log.request.path,
          "prisma://Character"
        );

        assert.equal(
          log.request.source,
          "SERVICE"
        );

        assert.equal(
          log.request.client,
          "API Client"
        );

        assert.equal(
          log.response?.status,
          200
        );

        assert.equal(
          log.response?.success,
          true
        );

        assert.equal(
          log.response?.duration,
          12.5
        );

        assert.equal(
          log.message,
          "15 row(s) affected."
        );
      }
    );
  }
);

test(
  "logPrisma omits message when rows are undefined",
  () => {
    withLoggerMocks(
      (debugCalls) => {
        logPrisma({
          model: "Character",
          action: "findUnique",
          duration: 3.2,
        });

        assert.equal(
          debugCalls[0].message,
          undefined
        );
      }
    );
  }
);

test(
  "logPrisma prints query when provided",
  () => {
    withLoggerMocks(
      (
        _,
        __,
        consoleDebugCalls
      ) => {
        logPrisma({
          model: "Character",
          action: "findMany",
          duration: 8,
          query:
            "SELECT * FROM Character",
        });

        assert.equal(
          consoleDebugCalls.length,
          1
        );

        assert.equal(
          consoleDebugCalls[0],
          "SELECT * FROM Character"
        );
      }
    );
  }
);

test(
  "logPrisma skips console.debug when query is absent",
  () => {
    withLoggerMocks(
      (
        _,
        __,
        consoleDebugCalls
      ) => {
        logPrisma({
          model: "Character",
          action: "findMany",
          duration: 8,
        });

        assert.equal(
          consoleDebugCalls.length,
          0
        );
      }
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                            logPrismaError                                  */
/* -------------------------------------------------------------------------- */

test(
  "logPrismaError logs failed prisma operation",
  () => {
    withLoggerMocks(
      (
        _,
        errorCalls
      ) => {
        const error =
          new Error(
            "Database failed"
          );

        logPrismaError(
          "Character",
          "create",
          error,
          42
        );

        assert.equal(
          errorCalls.length,
          1
        );

        const log =
          errorCalls[0];

        assert.equal(
          log.registry,
          "Character"
        );

        assert.equal(
          log.handler,
          "Prisma Client"
        );

        assert.equal(
          log.operation,
          "Character.create()"
        );

        assert.equal(
          log.request.path,
          "prisma://Character"
        );

        assert.equal(
          log.request.client,
          "Server"
        );

        assert.equal(
          log.response?.status,
          500
        );

        assert.equal(
          log.response?.success,
          false
        );

        assert.equal(
          log.response?.duration,
          42
        );

        assert.equal(
          log.error,
          error
        );
      }
    );
  }
);
