import test from "node:test";
import assert from "node:assert/strict";

import { formatApiLog } from "@/lib/logger/formatter";

import type { ApiLog } from "@/lib/logger/types";

function createLog(
  overrides: Partial<ApiLog> = {}
): ApiLog {
  return {
    level: "SUCCESS",

    request: {
      id: "ABC12345",
      method: "GET",
      path: "/api/v1/characters",

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
      duration: 12.34,
      success: true,
    },

    registry: "characters",

    handler: "Collection Handler",

    operation: "findMany",

    message: "10 row(s) affected.",

    blocked: false,

    triesPerMinute: 5,

    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/*                                Header                                      */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog renders request header",
  () => {
    const output = formatApiLog(
      createLog()
    );

    assert.match(
      output,
      /SUCCESS/
    );

    assert.match(
      output,
      /ABC12345/
    );

    assert.match(
      output,
      /GET/
    );

    assert.match(
      output,
      /\/api\/v1\/characters/
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                             Request Fields                                 */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog renders request information",
  () => {
    const output = formatApiLog(
      createLog()
    );

    assert.match(
      output,
      /Client/
    );

    assert.match(
      output,
      /Chrome/
    );

    assert.match(
      output,
      /Desktop/
    );

    assert.match(
      output,
      /Source/
    );

    assert.match(
      output,
      /FRONTEND/
    );

    assert.match(
      output,
      /Registry/
    );

    assert.match(
      output,
      /characters/
    );

    assert.match(
      output,
      /Handler/
    );

    assert.match(
      output,
      /Collection Handler/
    );

    assert.match(
      output,
      /Operation/
    );

    assert.match(
      output,
      /findMany/
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                              Response                                      */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog renders response information",
  () => {
    const output = formatApiLog(
      createLog()
    );

    assert.match(
      output,
      /Status/
    );

    assert.match(
      output,
      /200/
    );

    assert.match(
      output,
      /Duration/
    );

    assert.match(
      output,
      /Memory/
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                              Rate Limit                                    */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog renders rate limit information",
  () => {
    const output = formatApiLog(
      createLog()
    );

    assert.match(
      output,
      /Tries\/min/
    );

    assert.match(
      output,
      /5/
    );

    assert.match(
      output,
      /Blocked/
    );

    assert.match(
      output,
      /No/
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                               Message                                      */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog renders message",
  () => {
    const output = formatApiLog(
      createLog()
    );

    assert.match(
      output,
      /10 row\(s\) affected/
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                                 Error                                      */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog renders errors",
  () => {
    const output = formatApiLog(
      createLog({
        error: new Error(
          "Database exploded"
        ),
      })
    );

    assert.match(
      output,
      /Error/
    );

    assert.match(
      output,
      /Database exploded/
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                             Optional Fields                                */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog omits optional rows when absent",
  () => {
    const output = formatApiLog(
      createLog({
        registry: undefined,
        handler: undefined,
        operation: undefined,
        message: undefined,
        blocked: undefined,
        triesPerMinute:
          undefined,
      })
    );

    assert.doesNotMatch(
      output,
      /Registry/
    );

    assert.doesNotMatch(
      output,
      /Handler/
    );

    assert.doesNotMatch(
      output,
      /Operation/
    );

    assert.doesNotMatch(
      output,
      /Message/
    );

    assert.doesNotMatch(
      output,
      /Blocked/
    );

    assert.doesNotMatch(
      output,
      /Tries\/min/
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                                Borders                                     */
/* -------------------------------------------------------------------------- */

test(
  "formatApiLog renders box borders",
  () => {
    const output = formatApiLog(
      createLog()
    );

    assert.match(
      output,
      /╭/
    );

    assert.match(
      output,
      /╰/
    );

    assert.match(
      output,
      /│/
    );
  }
);

test(
  "formatApiLog omits response rows when response is undefined",
  () => {
    const output = formatApiLog(
      createLog({
        response: undefined,
      })
    );

    assert.doesNotMatch(
      output,
      /Status/
    );

    assert.doesNotMatch(
      output,
      /Duration/
    );
  }
);

test(
  "formatApiLog renders blocked requests",
  () => {
    const output = formatApiLog(
      createLog({
        blocked: true,
      })
    );

    assert.match(
      output,
      /Blocked/
    );

    assert.match(
      output,
      /Yes/
    );
  }
);

test(
  "formatApiLog renders error status",
  () => {
    const output = formatApiLog(
      createLog({
        response: {
          status: 500,
          duration: 9,
          success: false,
        },
      })
    );

    assert.match(
      output,
      /500/
    );
  }
);
