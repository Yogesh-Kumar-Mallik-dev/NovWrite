import test from "node:test";
import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { LoggerApi } from "@/lib/logger/api";

import type { ApiLog } from "@/lib/logger/types";

/* -------------------------------------------------------------------------- */
/*                               Test Logger                                  */
/* -------------------------------------------------------------------------- */

class TestLoggerApi extends LoggerApi {
  public logs: Omit<ApiLog, "level">[] = [];

  public prismaLogs: Omit<ApiLog, "level">[] = [];

  protected override dispatch(
    log: Omit<ApiLog, "level">
  ) {
    this.logs.push(log);
  }

  protected override debug(
    log: Omit<ApiLog, "level">
  ) {
    this.prismaLogs.push(log);
  }
}

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

function createRequest() {
  return new NextRequest(
    "http://localhost:3000/api/test",
    {
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
        origin:
          "http://localhost:3000",
      },
    }
  );
}

function createApi() {
  return new TestLoggerApi(
    createRequest()
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Success                                    */
/* -------------------------------------------------------------------------- */

test("ok()", () => {
  const api = createApi();

  api.ok({
    registry: "characters",
    rows: 5,
  });

  assert.equal(
    api.logs.length,
    1
  );

  const log = api.logs[0];

  assert.equal(
    log.response?.status,
    200
  );

  assert.equal(
    log.response?.success,
    true
  );

  assert.equal(
    log.registry,
    "characters"
  );

  assert.equal(
    log.message,
    "5 row(s) affected."
  );
});

test("created()", () => {
  const api = createApi();

  api.created({});

  assert.equal(
    api.logs[0].response?.status,
    201
  );
});

test("updated()", () => {
  const api = createApi();

  api.updated({});

  assert.equal(
    api.logs[0].response?.status,
    200
  );
});

test("deleted()", () => {
  const api = createApi();

  api.deleted({});

  assert.equal(
    api.logs[0].response?.status,
    204
  );
});

/* -------------------------------------------------------------------------- */
/*                             Rate Limiting                                  */
/* -------------------------------------------------------------------------- */

test("rateLimited()", () => {
  const api = createApi();

  api.rateLimited({
    triesPerMinute: 60,
  });

  const log = api.logs[0];

  assert.equal(
    log.response?.status,
    429
  );

  assert.equal(
    log.blocked,
    true
  );

  assert.equal(
    log.triesPerMinute,
    60
  );
});

/* -------------------------------------------------------------------------- */
/*                               Errors                                       */
/* -------------------------------------------------------------------------- */

test("validation()", () => {
  const api = createApi();

  const error = new Error(
    "Invalid payload"
  );

  api.validation(error);

  const log = api.logs[0];

  assert.equal(
    log.response?.status,
    422
  );

  assert.equal(
    log.message,
    "Invalid payload"
  );

  assert.equal(
    log.error,
    error
  );
});

test("badRequest()", () => {
  const api = createApi();

  const error = new Error(
    "Bad request"
  );

  api.badRequest(error);

  const log = api.logs[0];

  assert.equal(
    log.response?.status,
    400
  );

  assert.equal(
    log.message,
    "Bad request"
  );
});

test("notFound()", () => {
  const api = createApi();

  api.notFound();

  const log = api.logs[0];

  assert.equal(
    log.response?.status,
    404
  );

  assert.equal(
    log.message,
    "Resource not found."
  );
});

test("internal()", () => {
  const api = createApi();

  const error = new Error(
    "Database exploded"
  );

  api.internal(error);

  const log = api.logs[0];

  assert.equal(
    log.response?.status,
    500
  );

  assert.equal(
    log.message,
    "Database exploded"
  );

  assert.equal(
    log.error,
    error
  );
});

/* -------------------------------------------------------------------------- */
/*                                Prisma                                      */
/* -------------------------------------------------------------------------- */

test("prisma()", () => {
  const api = createApi();

  api.prisma(
    "findMany",
    12.5,
    8
  );

  assert.equal(
    api.prismaLogs.length,
    1
  );

  const log =
    api.prismaLogs[0];

  assert.equal(
    log.handler,
    "Prisma Client"
  );

  assert.equal(
    log.operation,
    "findMany"
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
    "8 row(s) affected."
  );
});
