import test from "node:test";
import assert from "node:assert/strict";

import { Logger } from "@/lib/logger/logger";

import type { ApiLog } from "@/lib/logger/types";

function createLog(): Omit<ApiLog, "level"> {
  return {
    request: {
      id: "ABC12345",
      method: "GET",
      path: "/api/test",

      ip: "::1",

      source: "FRONTEND",

      browser: "Chrome",

      client: "Desktop",

      userAgent: "Chrome",

      startedAt: 0,

      request: {} as never,
    },

    response: {
      status: 200,
      duration: 10,
      success: true,
    },
  };
}

function withMockedConsole(
  fn: (calls: string[]) => void
) {
  const original = console.log;

  const calls: string[] = [];

  console.log = (
    message?: unknown
  ) => {
    calls.push(String(message));
  };

  try {
    fn(calls);
  } finally {
    console.log = original;
  }
}

/* -------------------------------------------------------------------------- */
/*                               Log Levels                                   */
/* -------------------------------------------------------------------------- */

test(
  "trace logs",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.trace(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "debug logs",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.debug(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "info logs",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.info(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "success logs",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.success(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "warn logs",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.warn(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "error logs",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.error(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "fatal logs",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.fatal(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                            Level Filtering                                 */
/* -------------------------------------------------------------------------- */

test(
  "INFO level suppresses TRACE and DEBUG",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("INFO");

        logger.trace(
          createLog()
        );

        logger.debug(
          createLog()
        );

        logger.info(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "ERROR level suppresses lower levels",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("ERROR");

        logger.info(
          createLog()
        );

        logger.success(
          createLog()
        );

        logger.warn(
          createLog()
        );

        logger.error(
          createLog()
        );

        logger.fatal(
          createLog()
        );

        assert.equal(
          calls.length,
          2
        );
      }
    );
  }
);

test(
  "FATAL level only logs fatal",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("FATAL");

        logger.trace(
          createLog()
        );

        logger.debug(
          createLog()
        );

        logger.info(
          createLog()
        );

        logger.success(
          createLog()
        );

        logger.warn(
          createLog()
        );

        logger.error(
          createLog()
        );

        logger.fatal(
          createLog()
        );

        assert.equal(
          calls.length,
          1
        );
      }
    );
  }
);

test(
  "logger writes formatted output",
  () => {
    withMockedConsole(
      (calls) => {
        const logger =
          new Logger("TRACE");

        logger.success(
          createLog()
        );

        assert.match(
          calls[0],
          /SUCCESS/
        );

        assert.match(
          calls[0],
          /GET/
        );

        assert.match(
          calls[0],
          /\/api\/test/
        );
      }
    );
  }
);
